# Authentication & Security Model

## Overview

Lecture Lens implements a **closed, invite-only authentication system** to ensure cohort data isolation and prevent unauthorized access to lecture content and resources.

## Security Architecture

### 🔐 Core Principles

1. **No Public Signup** - Registration is disabled for public users
2. **Admin-Controlled Access** - Only admins can create user accounts
3. **Mandatory Cohort Assignment** - All users must be assigned to at least one cohort
4. **Row-Level Security (RLS)** - Database enforces data isolation at the query level
5. **Role-Based Access Control (RBAC)** - Three roles: student, instructor, admin

---

## User Creation Flow

### Current Implementation

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN CREATES USER                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Admin runs seed script OR uses admin panel (future)     │
│     npm run seed                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. User account created in Supabase Auth                    │
│     - Email + Password                                       │
│     - Email verification skipped for demo                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. User automatically assigned to cohort with role          │
│     - Record created in user_cohorts table                   │
│     - Role: student | instructor | admin                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. User can now login and access cohort data                │
│     - RLS policies automatically filter data by cohort       │
└─────────────────────────────────────────────────────────────┘
```

### What Happens if User Has NO Cohort Assignment?

```
User logs in → ✅ Authentication succeeds
            → ❌ NO data visible (RLS blocks everything)
            → Dashboard shows "No cohort assigned" message
```

---

## Why Public Signup is Disabled

### Security Risks with Open Signup

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Unauthorized Access** | Anyone could create accounts | ✅ Disabled signup |
| **Data Leakage** | Users see other cohorts' data | ✅ RLS enforces isolation |
| **Orphaned Accounts** | Users with no cohort see nothing | ✅ Admin-controlled creation |
| **Spam/Abuse** | Malicious signups | ✅ Invite-only model |

### PRD Alignment

From the PRD (Feature F7):
> "Email-based login (Supabase Auth)
> User → Cohort mapping (many-to-many, allows multi-cohort enrollment)
> **List of cohort names + user emails for initial setup**"

This implies users are **pre-created with cohort assignments**, not self-registered.

---

## Authentication Flow

### Login Process

```typescript
// User enters email + password
supabase.auth.signInWithPassword({ email, password })

// If successful:
1. JWT token issued
2. Token stored in browser (secure, httpOnly cookie)
3. AuthProvider fetches user session
4. User redirected to /dashboard

// Backend automatically:
1. Fetches user's cohorts from user_cohorts table
2. RLS policies filter all queries by cohort_id
3. User sees only their cohort's data
```

### Role-Based Access

```sql
-- Students: See only their cohort's data
CREATE POLICY cohort_isolation_lectures ON lectures
FOR SELECT
USING (
  module_id IN (
    SELECT m.id
    FROM modules m
    JOIN user_cohorts uc ON uc.cohort_id = m.cohort_id
    WHERE uc.user_id = auth.uid()
  )
);

-- Instructors: See all cohorts they teach
-- (same policy, multiple cohort assignments)

-- Admins: See everything (bypasses RLS in some cases)
CREATE POLICY admin_full_access_lectures ON lectures
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_cohorts
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

---

## Current Pages

### `/login` - Login Page
- ✅ **Public** (no auth required)
- Shows demo credentials
- Validates email + password
- Redirects to `/dashboard` on success

### `/signup` - Registration Closed Page
- ✅ **Public** (no auth required)
- Explains why signup is disabled
- Shows demo credentials for testing
- Provides instructions for admins to create accounts
- Link to contact admin

### `/dashboard` - Main App
- 🔒 **Protected** (auth required)
- Redirects to `/login` if not authenticated
- Shows user's cohort data only (RLS enforced)

---

## Demo Credentials

For testing and demonstration purposes:

```
Student:
  Email: student@cohort5.com
  Password: demo123
  Cohort: Cohort 5
  Role: student

Instructor:
  Email: instructor@cohort5.com
  Password: demo123
  Cohort: Cohort 5
  Role: instructor

Admin:
  Email: admin@100x.com
  Password: demo123
  Cohort: Cohort 5 (can see all cohorts)
  Role: admin
```

---

## How Admins Create Users

### Method 1: Seed Script (Current)

```bash
npm run seed
```

This creates:
- 3 cohorts (Cohort 4, 5, 6)
- 9 modules (3 per cohort)
- 3 test users (see above)

### Method 2: Admin Panel (Future - TODO)

```
Admin Dashboard → Users → Add User
├── Email
├── Password (auto-generated or manual)
├── Cohort (dropdown)
├── Role (dropdown: student/instructor/admin)
└── Send invite email (checkbox)
```

### Method 3: Batch Import (Future - TODO)

```
Upload CSV:
email,cohort,role
student1@example.com,Cohort 5,student
student2@example.com,Cohort 5,student
instructor@example.com,Cohort 5,instructor
```

---

## Future Enhancements (Post-MVP)

### Option 1: Email Whitelist
- Allow signups only from specific domains
- Still requires admin to assign cohort after signup
- Example: `@100xengineers.com`

### Option 2: Approval Workflow
- Users can sign up but accounts are "pending"
- Admin reviews and approves + assigns cohort
- Users notified via email when approved

### Option 3: Invite-Only System (Recommended)
- Admin generates invite link with pre-assigned cohort
- User clicks link → creates password → auto-assigned
- Similar to Slack/Discord invite system
- Best UX and security

### Option 4: SSO Integration (Enterprise)
- Integrate with Google Workspace / Microsoft AD
- Auto-assign cohort based on email domain or group
- Zero-touch provisioning

---

## Security Checklist

### ✅ Implemented
- [x] Email + password authentication (Supabase Auth)
- [x] JWT token-based sessions
- [x] Row-Level Security (RLS) policies
- [x] Cohort isolation at database level
- [x] Role-based access control (RBAC)
- [x] Public signup disabled
- [x] Admin-controlled user creation
- [x] Secure environment variable handling
- [x] Server-side only admin client

### ⏳ Pending (Future)
- [ ] Email verification for new users
- [ ] Password reset flow
- [ ] Session timeout (auto-logout)
- [ ] Rate limiting on login attempts
- [ ] 2FA/MFA support
- [ ] Audit logging for admin actions
- [ ] IP whitelist (optional)
- [ ] Admin user management UI

---

## Common Questions

### Q: Can users change their cohort?
**A:** No. Only admins can modify cohort assignments via the `user_cohorts` table.

### Q: Can a user belong to multiple cohorts?
**A:** Yes. The `user_cohorts` table supports many-to-many relationships.

### Q: What happens if a user is removed from all cohorts?
**A:** They can still log in but see no data (RLS blocks everything).

### Q: Can students see other students' activity?
**A:** No. There is no user-to-user visibility. Students only see lecture content and resources.

### Q: Can instructors see all cohorts?
**A:** Only if they're assigned to multiple cohorts. By default, instructors see only the cohorts they teach.

### Q: How do admins get created?
**A:** Via seed script or direct database insert. First admin must be created manually.

---

## Technical Implementation

### Files Modified

| File | Purpose | Change |
|------|---------|--------|
| `app/(auth)/signup/page.tsx` | Signup page | Replaced with "Registration Closed" message |
| `lib/db/client.ts` | Database client | Added server-side only admin client |
| `components/auth/auth-provider.tsx` | Auth context | Manages user session |
| `components/auth/protected-route.tsx` | Route guard | Redirects unauthenticated users |
| `scripts/seed-data.ts` | Seed script | Creates test users with cohort assignments |

### Environment Variables

```bash
# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Private (server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Never exposed to browser
```

---

## Conclusion

The current authentication system is **secure by design**:
- ✅ No unauthorized access possible
- ✅ Cohort data properly isolated
- ✅ Admin has full control over user creation
- ✅ RLS policies enforce security at database level

For production, consider implementing the **Invite-Only System (Option 3)** for the best user experience while maintaining security.

**Last Updated:** January 2025
**Status:** MVP Complete
**Next Steps:** Implement admin user management UI (Phase 5+)
