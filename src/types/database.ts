export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      captions: {
        Row: {
          id: string
          user_id: string
          content: string
          tone: string
          platform: string
          hashtags: string[]
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          tone: string
          platform?: string
          hashtags?: string[]
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          tone?: string
          platform?: string
          hashtags?: string[]
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      api_usage: {
        Row: {
          id: string
          user_id: string
          requests_count: number
          last_request_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          requests_count?: number
          last_request_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          requests_count?: number
          last_request_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Caption = Database['public']['Tables']['captions']['Row']
export type ApiUsage = Database['public']['Tables']['api_usage']['Row']