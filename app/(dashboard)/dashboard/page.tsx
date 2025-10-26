'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/components/auth/auth-provider';

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold">Lecture Lens</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user?.email}
                </span>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Welcome to Lecture Lens!</h2>
              <p className="text-gray-600 mb-4">
                Your AI-powered cohort assistant is ready. Chat interface coming soon...
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>Setup Progress:</strong> Authentication system is complete!
                </p>
                <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                  <li>✓ Next.js 14 with TypeScript and Tailwind</li>
                  <li>✓ Supabase database with pgvector</li>
                  <li>✓ Authentication with Supabase Auth</li>
                  <li>⏳ VTT processing pipeline (next)</li>
                  <li>⏳ RAG implementation (coming)</li>
                  <li>⏳ Chat interface (coming)</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
