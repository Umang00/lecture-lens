'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';

export default function InstructorResourcesPage() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceType, setResourceType] = useState('github');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if user is instructor or admin
  useEffect(() => {
    if (userRole && userRole.role === 'student') {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: resourceUrl,
          type: resourceType,
          isGlobal: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add resource');
      }

      setSuccess(true);
      setResourceUrl('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error adding resource:', error);
      setError(error instanceof Error ? error.message : 'Failed to add resource');
    } finally {
      setLoading(false);
    }
  };

  if (userRole && userRole.role === 'student') {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Add Resource</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          Resource added successfully! Processing in background...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Resource Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resource Type *
          </label>
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="resource-type"
            disabled={loading}
          >
            <option value="github">GitHub Repository</option>
            <option value="youtube">YouTube Video</option>
            <option value="blog">Blog Post</option>
            <option value="rss">RSS Feed</option>
          </select>
        </div>

        {/* Resource URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resource URL *
          </label>
          <input
            type="url"
            value={resourceUrl}
            onChange={(e) => setResourceUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://github.com/docker/compose"
            data-testid="resource-url"
            required
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-1">
            {resourceType === 'github' && 'Enter a GitHub repository URL'}
            {resourceType === 'youtube' && 'Enter a YouTube video URL'}
            {resourceType === 'blog' && 'Enter a blog post URL'}
            {resourceType === 'rss' && 'Enter an RSS feed URL'}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          data-testid="add-resource-submit"
        >
          {loading ? 'Adding Resource...' : 'Add Resource'}
        </button>
      </form>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Resources are automatically scraped and processed</li>
          <li>• Content is chunked and embedded for search</li>
          <li>• Students can query this content in the chat</li>
          <li>• Processing happens in the background</li>
        </ul>
      </div>
    </div>
  );
}

