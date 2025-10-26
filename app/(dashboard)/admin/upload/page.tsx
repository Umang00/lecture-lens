'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';

interface Cohort {
  id: string;
  name: string;
}

interface Module {
  id: string;
  name: string;
  cohort_id: string;
}

export default function AdminUploadPage() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  
  const [formData, setFormData] = useState({
    cohortId: '',
    moduleId: '',
    title: '',
    instructor: '',
    date: '',
    file: null as File | null
  });
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (userRole && userRole.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  // Fetch cohorts and modules
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cohorts
        const cohortsRes = await fetch('/api/cohorts');
        if (cohortsRes.ok) {
          const cohortsData = await cohortsRes.json();
          setCohorts(cohortsData);
        }

        // Fetch modules
        const modulesRes = await fetch('/api/modules');
        if (modulesRes.ok) {
          const modulesData = await modulesRes.json();
          setModules(modulesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter modules when cohort changes
  useEffect(() => {
    if (formData.cohortId) {
      const filtered = modules.filter(m => m.cohort_id === formData.cohortId);
      setFilteredModules(filtered);
    } else {
      setFilteredModules([]);
    }
  }, [formData.cohortId, modules]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.vtt')) {
        setFormData({ ...formData, file });
        setError(null);
      } else {
        setError('Please select a valid .vtt file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Validate form
      if (!formData.file || !formData.cohortId || !formData.moduleId || !formData.title || !formData.instructor || !formData.date) {
        throw new Error('Please fill in all required fields');
      }

      // Create FormData
      const uploadData = new FormData();
      uploadData.append('file', formData.file);
      uploadData.append('cohortId', formData.cohortId);
      uploadData.append('moduleId', formData.moduleId);
      uploadData.append('title', formData.title);
      uploadData.append('instructor', formData.instructor);
      uploadData.append('lectureDate', formData.date);

      // Upload file
      const response = await fetch('/api/vtt/upload', {
        method: 'POST',
        body: uploadData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Poll for processing status
      const lectureId = result.lectureId;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes

      const pollStatus = async () => {
        try {
          const statusRes = await fetch(`/api/vtt/status/${lectureId}`);
          const statusData = await statusRes.json();

          if (statusData.status === 'completed') {
            setProgress(100);
            setSuccess(true);
            setTimeout(() => {
              router.push(`/dashboard/lectures/${lectureId}`);
            }, 2000);
          } else if (statusData.status === 'failed') {
            throw new Error('Processing failed');
          } else {
            // Still processing
            setProgress(Math.min(90, (attempts / maxAttempts) * 90));
            attempts++;
            
            if (attempts < maxAttempts) {
              setTimeout(pollStatus, 5000); // Poll every 5 seconds
            } else {
              throw new Error('Processing timeout');
            }
          }
        } catch (error) {
          console.error('Error polling status:', error);
          setError('Error checking processing status');
          setUploading(false);
        }
      };

      // Start polling
      setTimeout(pollStatus, 5000);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      setUploading(false);
    }
  };

  if (userRole && userRole.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upload Lecture</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          Upload successful! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cohort Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cohort *
          </label>
          <select
            value={formData.cohortId}
            onChange={(e) => setFormData({ ...formData, cohortId: e.target.value, moduleId: '' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={uploading}
          >
            <option value="">Select a cohort</option>
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name}
              </option>
            ))}
          </select>
        </div>

        {/* Module Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Module *
          </label>
          <select
            value={formData.moduleId}
            onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={uploading || !formData.cohortId}
          >
            <option value="">Select a module</option>
            {filteredModules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lecture Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Docker Deep Dive"
            required
            disabled={uploading}
          />
        </div>

        {/* Instructor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instructor Name *
          </label>
          <input
            type="text"
            value={formData.instructor}
            onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Siddhanth"
            required
            disabled={uploading}
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lecture Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={uploading}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            VTT File *
          </label>
          <input
            type="file"
            accept=".vtt"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={uploading}
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload a .vtt (WebVTT) transcript file
          </p>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {progress < 100 ? 'Processing...' : 'Complete!'}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Lecture'}
        </button>
      </form>
    </div>
  );
}

