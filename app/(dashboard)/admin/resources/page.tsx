'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Github, Youtube, BookOpen, Rss, Trash2, Plus, Settings, ExternalLink } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
  is_global: boolean;
  created_at: string;
}

// Resource type configuration
const resourceTypes = [
  { value: 'github', label: 'GitHub', icon: Github, color: 'text-gray-600' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500' },
  { value: 'blog', label: 'Blog', icon: BookOpen, color: 'text-green-500' },
  { value: 'rss', label: 'RSS', icon: Rss, color: 'text-blue-500' },
];

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

  const getResourceIcon = (type: string) => {
    const resourceType = resourceTypes.find(t => t.value === type);
    return resourceType?.icon || Settings;
  };

  const getResourceColor = (type: string) => {
    const resourceType = resourceTypes.find(t => t.value === type);
    return resourceType?.color || 'text-gray-500';
  };

  if (userRole && userRole.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Resources</h1>
          <p className="text-gray-600 mt-2">
            View and manage all learning resources
          </p>
        </div>
        <Button
          onClick={() => router.push('/instructor/resources')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Resource
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading resources...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600 mb-4">
                Get started by adding your first learning resource
              </p>
              <Button
                onClick={() => router.push('/instructor/resources')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Resource
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Resources</CardTitle>
            <CardDescription>
              {resources.length} resource{resources.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => {
                  const Icon = getResourceIcon(resource.type);
                  const color = getResourceColor(resource.type);
                  
                  return (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${color}`} />
                          <span className="font-medium capitalize">{resource.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {resource.title || 'Untitled'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-xs"
                          >
                            {resource.url}
                          </a>
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={resource.is_global ? 'default' : 'secondary'}
                            className={
                              resource.is_global
                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                            }
                          >
                            {resource.is_global ? 'Global' : 'Local'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(resource.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(resource.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

