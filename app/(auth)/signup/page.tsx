'use client';

import Link from 'next/link';

export default function SignupDisabledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Registration Closed
          </h2>
          <div className="mt-6 text-left space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                📧 How to Get Access
              </p>
              <p className="text-sm text-blue-800">
                Lecture Lens uses invite-only access to maintain security and cohort isolation.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                For Students:
              </p>
              <p className="text-sm text-gray-700">
                Contact your cohort admin or instructor to request access.
                They will create an account and assign you to your cohort.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                For Admins:
              </p>
              <p className="text-sm text-gray-700">
                Create user accounts via the admin panel or seed script:
              </p>
              <code className="block mt-2 text-xs bg-gray-900 text-green-400 p-2 rounded">
                npm run seed
              </code>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm font-semibold text-yellow-900 mb-2">
                🎯 Demo Access
              </p>
              <p className="text-sm text-yellow-800 mb-2">
                For demo purposes, use these test accounts:
              </p>
              <div className="text-xs space-y-1 text-yellow-800 font-mono">
                <p>• student@cohort5.com / demo123</p>
                <p>• instructor@cohort5.com / demo123</p>
                <p>• admin@100x.com / demo123</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Login
            </Link>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center border-t pt-4">
          <p className="font-semibold mb-2">Why Invite-Only?</p>
          <ul className="text-left space-y-1 text-gray-600">
            <li>• Prevents unauthorized access to cohort data</li>
            <li>• Maintains Row-Level Security (RLS) integrity</li>
            <li>• Ensures users are properly assigned to cohorts</li>
            <li>• Protects lecture content and resources</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
