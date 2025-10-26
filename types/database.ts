// Database types will be generated from Supabase schema
// Placeholder for now - will be replaced with: supabase gen types typescript

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
      // Tables will be defined here after schema setup
    }
  }
}
