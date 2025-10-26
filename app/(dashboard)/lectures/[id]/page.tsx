'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';

interface Lecture {
  id: string;
  title: string;
  instructor: string;
  lecture_date: string;
  duration_mins: number;
  summary: any;
  status: string;
}

export default function LectureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useAuth();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLecture = async () => {
      try {
        const response = await fetch(`/api/lectures/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setLecture(data);
        } else {
          setError('Failed to fetch lecture');
        }
      } catch (error) {
        console.error('Error fetching lecture:', error);
        setError('Failed to fetch lecture');
      } finally {
        setLoading(false);
      }
    };

    if (params.id && session) {
      fetchLecture();
    }
  }, [params.id, session]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading lecture...</p>
        </div>
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Lecture not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => router.push('/dashboard')}
        className="mb-4 text-blue-600 hover:text-blue-700 text-sm"
      >
        ← Back to Dashboard
      </button>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="border-b pb-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{lecture.title}</h1>
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
            <span>👨‍🏫 {lecture.instructor}</span>
            <span>📅 {new Date(lecture.lecture_date).toLocaleDateString()}</span>
            <span>⏱️ {lecture.duration_mins} mins</span>
            <span className={`px-2 py-1 rounded text-xs ${
              lecture.status === 'completed' ? 'bg-green-100 text-green-800' :
              lecture.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {lecture.status}
            </span>
          </div>
        </div>

        {lecture.summary ? (
          <div className="space-y-6">
            {/* Overview */}
            {lecture.summary.overview && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Overview</h2>
                <p className="text-gray-700">{lecture.summary.overview}</p>
              </div>
            )}

            {/* Topics */}
            {lecture.summary.topics && lecture.summary.topics.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Topics Covered</h2>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {lecture.summary.topics.map((topic: string, index: number) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tools */}
            {lecture.summary.tools && lecture.summary.tools.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Tools & Technologies</h2>
                <div className="flex flex-wrap gap-2">
                  {lecture.summary.tools.map((tool: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sections */}
            {lecture.summary.sections && lecture.summary.sections.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Lecture Sections</h2>
                <div className="space-y-3">
                  {lecture.summary.sections.map((section: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono text-gray-500">
                          {section.timestamp}
                        </span>
                        <h3 className="font-medium">{section.title}</h3>
                      </div>
                      {section.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {section.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {lecture.status === 'processing' ? (
              <>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p>Lecture is being processed...</p>
              </>
            ) : (
              <p>No summary available</p>
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Ask Questions About This Lecture
          </button>
        </div>
      </div>
    </div>
  );
}

