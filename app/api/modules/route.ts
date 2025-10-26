import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { supabase } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticate(req);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    // Fetch all modules
    const { data, error } = await supabase
      .from('modules')
      .select('id, name, cohort_id, sequence')
      .order('sequence', { ascending: true });

    if (error) {
      console.error('[GET /api/modules] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch modules' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/modules] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

