/**
 * Types for Lecture Summary Generation
 * Defines the structure of comprehensive lecture summaries
 */

export interface LectureSummary {
  executiveOverview: string;
  sections: Section[];
  toolsMentioned: Tool[];
  keyTakeaways: string[];
  resourcesShared: string[];
  totalDuration: number; // in minutes
  lectureTitle?: string;
  instructor?: string;
  date?: string;
}

export interface Section {
  title: string;
  timestampStart: string;
  timestampEnd: string;
  durationMins: number;
  keyConcepts: ConceptWithTimestamp[];
  technicalDetails: string[];
  demonstrations: Demo[];
  summary: string;
}

export interface ConceptWithTimestamp {
  concept: string;
  timestamp: string;
  explanation: string;
  importance: 'high' | 'medium' | 'low';
}

export interface Demo {
  title: string;
  timestamp: string;
  description: string;
  toolsUsed: string[];
  outcome: string;
}

export interface Tool {
  name: string;
  category: 'framework' | 'library' | 'tool' | 'platform' | 'language' | 'other';
  firstMentioned: string;
  description: string;
  useCases: string[];
  alternatives?: string[];
}

export interface Resource {
  name: string;
  type: 'documentation' | 'tutorial' | 'repository' | 'article' | 'video' | 'other';
  url?: string;
  timestamp: string;
  description: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface SummaryConfig {
  maxSections: number;
  minSectionDuration: number; // in minutes
  includeTechnicalDetails: boolean;
  includeDemonstrations: boolean;
  includeResources: boolean;
  summaryStyle: 'comprehensive' | 'concise' | 'technical';
}

export interface SummarizationResult {
  summary: LectureSummary;
  processingTime: number; // in seconds
  chunksProcessed: number;
  tokensUsed: number;
  confidence: number; // 0-1 scale
}
