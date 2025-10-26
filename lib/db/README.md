# Database Setup Guide

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project credentials from Project Settings > API

## Setup Steps

### 1. Run Migration Scripts

In your Supabase SQL Editor, run the following migration scripts **in order**:

1. `migrations/001_schema.sql` - Creates tables and relationships
2. `migrations/002_indexes.sql` - Creates performance indexes
3. `migrations/003_functions.sql` - Creates custom functions
4. `migrations/004_rls_policies.sql` - Enables Row-Level Security

### 2. Enable pgvector Extension

If not already enabled:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Configure Environment Variables

Update your `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Generate TypeScript Types

After running migrations, generate types:

```bash
npx supabase gen types typescript --project-id your-project-id > types/database.ts
```

Or if using Supabase CLI:

```bash
supabase gen types typescript --local > types/database.ts
```

## Database Schema Overview

### Core Tables

- **cohorts** - Student cohorts/batches
- **modules** - Course modules within cohorts
- **lectures** - Individual lecture sessions
- **resources** - External resources (GitHub, YouTube, blogs)
- **knowledge_chunks** - Unified searchable content (lectures + resources)
- **user_cohorts** - User-to-cohort mappings with roles
- **lecture_resources** - Lecture-to-resource links

### Key Features

- **Vector Search**: pgvector extension for semantic search
- **Row-Level Security**: Multi-tenant cohort isolation
- **Cascade Deletes**: Automatic cleanup of related data
- **Indexes**: Optimized for fast queries (vector search, cohort filtering)

## Testing Database Connection

Create a test file `lib/db/test-connection.ts`:

```typescript
import { supabase } from './client';

async function testConnection() {
  const { data, error } = await supabase.from('cohorts').select('count');

  if (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }

  console.log('✅ Database connection successful');
  return true;
}

testConnection();
```

Run with: `npx tsx lib/db/test-connection.ts`

## Common Issues

### Issue: pgvector extension not found
**Solution**: Run `CREATE EXTENSION IF NOT EXISTS vector;` in SQL Editor

### Issue: RLS blocking queries
**Solution**: Ensure user has entries in `user_cohorts` table

### Issue: Types not matching schema
**Solution**: Regenerate types after schema changes

## Seeding Data

After setup, run the seed script to add demo data:

```bash
npm run seed
```

This will create:
- 3 cohorts
- 9 modules (3 per cohort)
- 3 test users (student, instructor, admin)
- Sample lectures and resources (optional)
