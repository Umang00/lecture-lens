export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cohorts: {
        Row: {
          created_at: string | null
          id: string
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          cohort_id: string
          created_at: string | null
          embedding: string
          end_time: string | null
          id: string
          lecture_id: string | null
          metadata: Json
          resource_id: string | null
          start_time: string | null
          text: string
          token_count: number | null
          type: string
        }
        Insert: {
          chunk_index: number
          cohort_id: string
          created_at?: string | null
          embedding: string
          end_time?: string | null
          id?: string
          lecture_id?: string | null
          metadata: Json
          resource_id?: string | null
          start_time?: string | null
          text: string
          token_count?: number | null
          type: string
        }
        Update: {
          chunk_index?: number
          cohort_id?: string
          created_at?: string | null
          embedding?: string
          end_time?: string | null
          id?: string
          lecture_id?: string | null
          metadata?: Json
          resource_id?: string | null
          start_time?: string | null
          text?: string
          token_count?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_resources: {
        Row: {
          created_at: string | null
          lecture_id: string
          mention_context: string | null
          resource_id: string
        }
        Insert: {
          created_at?: string | null
          lecture_id: string
          mention_context?: string | null
          resource_id: string
        }
        Update: {
          created_at?: string | null
          lecture_id?: string
          mention_context?: string | null
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecture_resources_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecture_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      lectures: {
        Row: {
          chunks_count: number | null
          cohort_id: string | null
          completed_at: string | null
          confidence: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_mins: number | null
          error_message: string | null
          failed_at: string | null
          id: string
          instructor: string
          key_topics: string[] | null
          lecture_date: string
          module_id: string
          processed: boolean | null
          processing_progress: number | null
          processing_stage: string | null
          processing_time: number | null
          status: string | null
          summary: Json | null
          title: string
          tokens_used: number | null
          updated_at: string | null
          vtt_file_url: string | null
          vtt_filename: string | null
          vtt_size: number | null
        }
        Insert: {
          chunks_count?: number | null
          cohort_id?: string | null
          completed_at?: string | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_mins?: number | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          instructor: string
          key_topics?: string[] | null
          lecture_date: string
          module_id: string
          processed?: boolean | null
          processing_progress?: number | null
          processing_stage?: string | null
          processing_time?: number | null
          status?: string | null
          summary?: Json | null
          title: string
          tokens_used?: number | null
          updated_at?: string | null
          vtt_file_url?: string | null
          vtt_filename?: string | null
          vtt_size?: number | null
        }
        Update: {
          chunks_count?: number | null
          cohort_id?: string | null
          completed_at?: string | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_mins?: number | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          instructor?: string
          key_topics?: string[] | null
          lecture_date?: string
          module_id?: string
          processed?: boolean | null
          processing_progress?: number | null
          processing_stage?: string | null
          processing_time?: number | null
          status?: string | null
          summary?: Json | null
          title?: string
          tokens_used?: number | null
          updated_at?: string | null
          vtt_file_url?: string | null
          vtt_filename?: string | null
          vtt_size?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lectures_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lectures_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          cohort_id: string
          created_at: string | null
          id: string
          name: string
          sequence: number
        }
        Insert: {
          cohort_id: string
          created_at?: string | null
          id?: string
          name: string
          sequence: number
        }
        Update: {
          cohort_id?: string
          created_at?: string | null
          id?: string
          name?: string
          sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "modules_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_global: boolean | null
          metadata: Json | null
          scraped_at: string | null
          summary: string | null
          title: string
          type: string
          url: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          metadata?: Json | null
          scraped_at?: string | null
          summary?: string | null
          title: string
          type: string
          url: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          metadata?: Json | null
          scraped_at?: string | null
          summary?: string | null
          title?: string
          type?: string
          url?: string
        }
        Relationships: []
      }
      user_cohorts: {
        Row: {
          cohort_id: string
          enrolled_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          cohort_id: string
          enrolled_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          cohort_id?: string
          enrolled_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cohorts_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_cohorts: {
        Args: { user_uuid: string }
        Returns: {
          cohort_id: string
        }[]
      }
      search_knowledge: {
        Args: {
          filter_cohort_id?: string
          filter_type?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          id: string
          lecture_id: string
          metadata: Json
          resource_id: string
          similarity: number
          text: string
          type: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const