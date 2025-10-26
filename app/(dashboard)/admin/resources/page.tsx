'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
  is_global: boolean;
  created_at: string;
}

export default function AdminResourcesPage() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (userRole && userRole.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch('/api/resources');
        if (response.ok) {
          const data = await response.json();
          setResources(data);
        } else {
          setError('Failed to fetch resources');
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
        setError('Failed to fetch resources');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setResources(resources.filter(r => r.id !== resourceId));
      } else {
        alert('Failed to delete resource');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource');
    }
  };

  if (userRole && userRole.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Resources</h1>
        <button
          onClick={() => router.push('/dashboard/instructor/resources')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Resource
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No resources found</p>
          <button
            onClick={() => router.push('/dashboard/instructor/resources')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Add your first resource
          </button>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {resources.map((resource) => (
              <li key={resource.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {resource.type}
                      </span>
                      {resource.is_global && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Global
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {resource.title || 'Untitled'}
                    </h3>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-blue-600 hover:text-blue-800 truncate block"
                    >
                      {resource.url}
                    </a>
                    <p className="mt-1 text-xs text-gray-500">
                      Added {new Date(resource.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

