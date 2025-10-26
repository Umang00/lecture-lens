'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Github, Youtube, BookOpen, Rss, Plus, CheckCircle, XCircle } from 'lucide-react';

// Resource type configuration with icons and colors
const resourceTypes = [
  { value: 'github', label: 'GitHub Repository', icon: Github, color: 'text-gray-600' },
  { value: 'youtube', label: 'YouTube Video', icon: Youtube, color: 'text-red-500' },
  { value: 'blog', label: 'Blog Post', icon: BookOpen, color: 'text-green-500' },
  { value: 'rss', label: 'RSS Feed', icon: Rss, color: 'text-blue-500' },
];

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

  const getResourceIcon = (type: string) => {
    const resourceType = resourceTypes.find(t => t.value === type);
    return resourceType?.icon || BookOpen;
  };

  const getResourceColor = (type: string) => {
    const resourceType = resourceTypes.find(t => t.value === type);
    return resourceType?.color || 'text-gray-500';
  };

  const getPlaceholder = (type: string) => {
    switch (type) {
      case 'github': return 'https://github.com/docker/compose';
      case 'youtube': return 'https://youtube.com/watch?v=...';
      case 'blog': return 'https://example.com/blog-post';
      case 'rss': return 'https://example.com/feed.xml';
      default: return 'Enter URL...';
    }
  };

  if (userRole && userRole.role === 'student') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Resource</h1>
          <p className="text-gray-600 mt-2">
            Add new learning resources for your students
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/resources')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Manage Resources
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-700 font-medium">
              Resource added successfully! Processing in background...
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add New Resource</CardTitle>
          <CardDescription>
            Choose a resource type and provide the URL. The content will be automatically scraped and processed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resource Type */}
              <div className="space-y-2">
                <Label htmlFor="resource-type" className="text-sm font-medium text-gray-900">
                  Resource Type *
                </Label>
                <Select
                  value={resourceType}
                  onValueChange={setResourceType}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Resource URL */}
              <div className="space-y-2">
                <Label htmlFor="resource-url" className="text-sm font-medium text-gray-900">
                  Resource URL *
                </Label>
                <Input
                  id="resource-url"
                  type="url"
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder={getPlaceholder(resourceType)}
                  required
                  disabled={loading}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  {resourceType === 'github' && 'Enter a GitHub repository URL'}
                  {resourceType === 'youtube' && 'Enter a YouTube video URL'}
                  {resourceType === 'blog' && 'Enter a blog post URL'}
                  {resourceType === 'rss' && 'Enter an RSS feed URL'}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading || !resourceUrl.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                data-testid="add-resource-submit"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Resource...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Automatic Processing</h4>
              <p className="text-sm text-gray-600">
                Resources are automatically scraped and processed in the background
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Smart Chunking</h4>
              <p className="text-sm text-gray-600">
                Content is intelligently chunked and embedded for optimal search
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Student Access</h4>
              <p className="text-sm text-gray-600">
                Students can query this content through the chat interface
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Real-time Updates</h4>
              <p className="text-sm text-gray-600">
                New content is automatically indexed and made searchable
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

