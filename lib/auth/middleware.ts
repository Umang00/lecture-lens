import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, userHasRole } from '@/lib/db/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  cohortIds: string[];
  roles: string[];
}

/**
 * Validates JWT token and returns authenticated user
 */
export async function authenticate(
  req: NextRequest
): Promise<{ user: AuthenticatedUser | null; error: string | null }> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid Authorization header' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' };
    }

    // Get user's cohorts and roles
    const { data: userCohorts, error: cohortsError } = await supabaseAdmin
      .from('user_cohorts')
      .select('cohort_id, role')
      .eq('user_id', user.id);

    if (cohortsError) {
      console.error('Error fetching user cohorts:', cohortsError);
      return { user: null, error: 'Failed to fetch user data' };
    }

    const cohortIds = userCohorts.map((uc) => uc.cohort_id);
    const roles = [...new Set(userCohorts.map((uc) => uc.role))];

    return {
      user: {
        id: user.id,
        email: user.email!,
        cohortIds,
        roles,
      },
      error: null,
    };
  } catch (err) {
    console.error('Authentication error:', err);
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Requires user to have specific role(s)
 */
export async function requireRole(
  req: NextRequest,
  requiredRoles: string[]
): Promise<{ user: AuthenticatedUser | null; error: string | null }> {
  const { user, error } = await authenticate(req);

  if (error || !user) {
    return { user: null, error: error || 'Unauthorized' };
  }

  const hasRole = user.roles.some((role) => requiredRoles.includes(role));

  if (!hasRole) {
    return {
      user: null,
      error: `Forbidden: Requires one of [${requiredRoles.join(', ')}]`,
    };
  }

  return { user, error: null };
}

/**
 * Creates an authenticated API response
 */
export function createAuthResponse(
  data: any,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Creates an error API response
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  code?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: code || 'ERROR',
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
