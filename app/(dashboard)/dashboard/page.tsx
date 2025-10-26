'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/components/auth/auth-provider';
import { ChatInterface } from '@/components/chat/chat-interface';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-bold">Lecture Lens</h1>
                
                {/* Role-based navigation */}
                <div className="flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-gray-900 hover:text-gray-700"
                  >
                    Chat
                  </Link>
                  
                  {userRole?.role === 'admin' && (
                    <>
                      <Link
                        href="/admin/upload"
                        className="text-sm font-medium text-gray-900 hover:text-gray-700"
                        data-testid="upload-lecture-button"
                      >
                        Upload Lecture
                      </Link>
                      <Link
                        href="/admin/resources"
                        className="text-sm font-medium text-gray-900 hover:text-gray-700"
                        data-testid="manage-resources-button"
                      >
                        Manage Resources
                      </Link>
                    </>
                  )}
                  
                  {userRole?.role === 'instructor' && (
                    <Link
                      href="/instructor/resources"
                      className="text-sm font-medium text-gray-900 hover:text-gray-700"
                      data-testid="add-resource-button"
                    >
                      Add Resources
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {userRole && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {userRole.role.charAt(0).toUpperCase() + userRole.role.slice(1)}
                  </span>
                )}
                <span className="text-sm text-gray-700">
                  {user?.email}
                </span>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  data-testid="sign-out-button"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <ChatInterface />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
