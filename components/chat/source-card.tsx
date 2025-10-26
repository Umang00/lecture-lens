'use client';

import { Source } from './chat-interface';

interface SourceCardProps {
  source: Source;
}

export function SourceCard({ source }: SourceCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lecture':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        );
      case 'resource':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'Lecture';
      case 'resource':
        return 'Resource';
      default:
        return 'Source';
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    
    // Handle different timestamp formats
    if (timestamp.includes(':')) {
      // Already formatted timestamp like "00:23:15"
      return timestamp;
    }
    
    // Convert seconds to MM:SS or HH:MM:SS format
    const seconds = parseInt(timestamp);
    if (isNaN(seconds)) return timestamp;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const handleSourceClick = () => {
    if (source.url) {
      window.open(source.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow ${
        source.url ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
      onClick={handleSourceClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getTypeIcon(source.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {getTypeLabel(source.type)}
            </span>
            {source.similarity && (
              <span className="text-xs text-gray-400">
                ({Math.round(source.similarity * 100)}% match)
              </span>
            )}
          </div>
          
          <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
            {source.title}
          </h4>
          
          {source.timestamp && (
            <div className="flex items-center space-x-1 mb-2">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-xs text-gray-500">
                {formatTimestamp(source.timestamp)}
              </span>
            </div>
          )}
          
          <p className="text-xs text-gray-600 line-clamp-3">
            {source.text}
          </p>
          
          {source.metadata && (
            <div className="mt-2 flex flex-wrap gap-1">
              {source.metadata.instructor && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {source.metadata.instructor}
                </span>
              )}
              {source.metadata.lectureDate && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {new Date(source.metadata.lectureDate).toLocaleDateString()}
                </span>
              )}
              {source.metadata.moduleNumber && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Module {source.metadata.moduleNumber}
                </span>
              )}
            </div>
          )}
        </div>
        
        {source.url && (
          <div className="flex-shrink-0">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
