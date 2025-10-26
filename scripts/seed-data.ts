import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure .env.local has:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function seedDemoData() {
  console.log('🌱 Seeding Demo Data\n');

  try {
    // Create cohorts
    console.log('📚 Creating cohorts...');
    const cohorts = [
      { name: 'Cohort 4', start_date: '2024-01-01' },
      { name: 'Cohort 5', start_date: '2024-06-01' },
      { name: 'Cohort 6', start_date: '2025-01-01' },
    ];

    const createdCohorts: any[] = [];
    for (const cohort of cohorts) {
      const { data, error } = await supabase
        .from('cohorts')
        .upsert(cohort, { onConflict: 'name' })
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Failed to create ${cohort.name}:`, error.message);
      } else {
        console.log(`  ✓ Created ${cohort.name}`);
        createdCohorts.push(data);
      }
    }

    // Create modules for each cohort
    console.log('\n📖 Creating modules...');
    for (const cohort of createdCohorts) {
      const modules = [
        { cohort_id: cohort.id, name: 'Module 1: Introduction', sequence: 1 },
        { cohort_id: cohort.id, name: 'Module 2: Advanced Topics', sequence: 2 },
        { cohort_id: cohort.id, name: 'Module 3: Final Project', sequence: 3 },
      ];

      for (const module of modules) {
        const { error } = await supabase.from('modules').upsert(module, {
          onConflict: 'cohort_id,sequence',
        });

        if (error) {
          console.error(`  ❌ Failed to create module:`, error.message);
        } else {
          console.log(`  ✓ Created ${module.name} for ${cohort.name}`);
        }
      }
    }

    console.log('\n✅ Demo data seeded successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  }
}

async function createTestUsers() {
  console.log('\n👥 Creating Test Users\n');

  // Get Cohort 5 ID
  const { data: cohort5 } = await supabase
    .from('cohorts')
    .select('id')
    .eq('name', 'Cohort 5')
    .single();

  if (!cohort5) {
    console.error('❌ Cohort 5 not found. Run demo data seeding first.');
    return;
  }

  const users = [
    {
      email: 'student@cohort5.com',
      password: 'demo123',
      role: 'student',
      cohortId: cohort5.id,
      cohortName: 'Cohort 5',
    },
    {
      email: 'instructor@cohort5.com',
      password: 'demo123',
      role: 'instructor',
      cohortId: cohort5.id,
      cohortName: 'Cohort 5',
    },
    {
      email: 'admin@100x.com',
      password: 'demo123',
      role: 'admin',
      cohortId: cohort5.id,
      cohortName: 'Cohort 5',
    },
  ];

  for (const user of users) {
    try {
      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true, // Skip email verification
        });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`  ⚠️  ${user.email} already exists, skipping...`);

          // Get existing user ID
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === user.email);

          if (existingUser) {
            // Assign to cohort if not already assigned
            const { error: cohortError } = await supabase
              .from('user_cohorts')
              .upsert(
                {
                  user_id: existingUser.id,
                  cohort_id: user.cohortId,
                  role: user.role,
                },
                { onConflict: 'user_id,cohort_id' }
              );

            if (!cohortError) {
              console.log(`  ✓ Assigned ${user.email} to ${user.cohortName} as ${user.role}`);
            }
          }
        } else {
          console.error(`  ❌ Failed to create ${user.email}:`, authError.message);
        }
        continue;
      }

      console.log(`  ✓ Created user ${user.email}`);

      // Assign user to cohort
      const { error: cohortError } = await supabase.from('user_cohorts').insert({
        user_id: authData.user.id,
        cohort_id: user.cohortId,
        role: user.role,
      });

      if (cohortError) {
        console.error(`  ❌ Failed to assign cohort:`, cohortError.message);
      } else {
        console.log(`  ✓ Assigned to ${user.cohortName} as ${user.role}`);
      }
    } catch (err) {
      console.error(`  ❌ Error creating ${user.email}:`, err);
    }
  }

  console.log('\n📝 Test Credentials:');
  console.log('━'.repeat(50));
  users.forEach((user) => {
    console.log(`${user.role.padEnd(12)} → ${user.email.padEnd(25)} / ${user.password}`);
  });
  console.log('━'.repeat(50));
}

async function main() {
  console.log('🌱 Lecture Lens Database Seeding\n');
  console.log('This script will:');
  console.log('  1. Create demo cohorts and modules');
  console.log('  2. Create test users with credentials\n');

  const proceed = await prompt('Continue? (y/n): ');

  if (proceed.toLowerCase() !== 'y') {
    console.log('❌ Aborted.');
    process.exit(0);
  }

  try {
    await seedDemoData();
    await createTestUsers();
    console.log('\n🎉 Seeding Complete!\n');
    console.log('Next steps:');
    console.log('  1. Go to http://localhost:3000/login');
    console.log('  2. Login with any test credential above');
    console.log('  3. Start uploading lectures!\n');
  } catch (err) {
    console.error('\n💥 Seeding failed:', err);
    process.exit(1);
  }

  process.exit(0);
}

main();
