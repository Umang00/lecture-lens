// Database types for Lecture Lens
// Generated from our current schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cohorts: {
        Row: {
          id: string
          name: string
          start_date: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          created_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          cohort_id: string
          name: string
          sequence: number
          created_at: string
        }
        Insert: {
          id?: string
          cohort_id: string
          name: string
          sequence: number
          created_at?: string
        }
        Update: {
          id?: string
          cohort_id?: string
          name?: string
          sequence?: number
          created_at?: string
        }
      }
      lectures: {
        Row: {
          id: string
          module_id: string
          cohort_id: string | null
          title: string
          description: string | null
          instructor: string
          lecture_date: string
          duration_mins: number | null
          vtt_file_url: string | null
          summary: Json | null
          key_topics: string[] | null
          processed: boolean
          processing_progress: number
          status: string | null
          processing_stage: string | null
          error_message: string | null
          vtt_filename: string | null
          vtt_size: number | null
          chunks_count: number
          tokens_used: number
          confidence: number
          processing_time: number | null
          created_by: string | null
          completed_at: string | null
          failed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          cohort_id?: string | null
          title: string
          description?: string | null
          instructor: string
          lecture_date: string
          duration_mins?: number | null
          vtt_file_url?: string | null
          summary?: Json | null
          key_topics?: string[] | null
          processed?: boolean
          processing_progress?: number
          status?: string | null
          processing_stage?: string | null
          error_message?: string | null
          vtt_filename?: string | null
          vtt_size?: number | null
          chunks_count?: number
          tokens_used?: number
          confidence?: number
          processing_time?: number | null
          created_by?: string | null
          completed_at?: string | null
          failed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          cohort_id?: string | null
          title?: string
          description?: string | null
          instructor?: string
          lecture_date?: string
          duration_mins?: number | null
          vtt_file_url?: string | null
          summary?: Json | null
          key_topics?: string[] | null
          processed?: boolean
          processing_progress?: number
          status?: string | null
          processing_stage?: string | null
          error_message?: string | null
          vtt_filename?: string | null
          vtt_size?: number | null
          chunks_count?: number
          tokens_used?: number
          confidence?: number
          processing_time?: number | null
          created_by?: string | null
          completed_at?: string | null
          failed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      knowledge_chunks: {
        Row: {
          id: string
          type: string
          lecture_id: string | null
          resource_id: string | null
          text: string
          embedding: number[]
          metadata: Json
          cohort_id: string
          chunk_index: number
          token_count: number | null
          start_time: string | null
          end_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          lecture_id?: string | null
          resource_id?: string | null
          text: string
          embedding: number[]
          metadata: Json
          cohort_id: string
          chunk_index: number
          token_count?: number | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          lecture_id?: string | null
          resource_id?: string | null
          text?: string
          embedding?: number[]
          metadata?: Json
          cohort_id?: string
          chunk_index?: number
          token_count?: number | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
        }
      }
      user_cohorts: {
        Row: {
          user_id: string
          cohort_id: string
          role: string
          enrolled_at: string
        }
        Insert: {
          user_id: string
          cohort_id: string
          role: string
          enrolled_at?: string
        }
        Update: {
          user_id?: string
          cohort_id?: string
          role?: string
          enrolled_at?: string
        }
      }
    }
  }
}
