import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');

  if (typeof window !== 'undefined') {
    // Browser environment - show user-friendly error
    console.error('Please ensure .env.local is configured and restart the dev server');
  }
  throw new Error('Missing Supabase environment variables. Check console for details.');
}

// Client-side Supabase client (respects RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role (bypasses RLS)
// Use only in server components and API routes where admin access is needed
// This is lazily initialized to avoid exposing service key in browser
let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  // Only create admin client on server-side
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be used on the server side');
  }

  if (!_supabaseAdmin) {
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
    }

    _supabaseAdmin = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return _supabaseAdmin;
}

// For backward compatibility
export const supabaseAdmin = typeof window === 'undefined' ? getSupabaseAdmin() : null as any;

// Helper function to get user's cohort IDs
export async function getUserCohorts(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_cohorts')
    .select('cohort_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user cohorts:', error);
    return [];
  }

  return data.map((uc) => uc.cohort_id);
}

// Helper function to check if user has role
export async function userHasRole(
  userId: string,
  roles: string[]
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_cohorts')
    .select('role')
    .eq('user_id', userId)
    .in('role', roles)
    .limit(1);

  if (error) {
    console.error('Error checking user role:', error);
    return false;
  }

  return data.length > 0;
}
