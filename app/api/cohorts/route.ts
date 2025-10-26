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

    // Fetch all cohorts
    const { data, error } = await supabase
      .from('cohorts')
      .select('id, name, start_date')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('[GET /api/cohorts] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cohorts' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/cohorts] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

