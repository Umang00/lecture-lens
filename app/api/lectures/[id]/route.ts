import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { supabase } from '@/lib/db/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticate(req);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    // Fetch lecture
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('[GET /api/lectures/[id]] Error:', error);
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/lectures/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

