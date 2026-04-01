// Supabase generated types — run `supabase gen types typescript` to regenerate
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'student' | 'tutor' | 'admin'
          full_name: string
          email: string
          avatar_url: string | null
          preferred_language: string
          expo_push_token: string | null
          phone: string | null
          whatsapp: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'student' | 'tutor' | 'admin'
          full_name: string
          email: string
          avatar_url?: string | null
          preferred_language?: string
          expo_push_token?: string | null
          phone?: string | null
          whatsapp?: string | null
        }
        Update: {
          full_name?: string
          avatar_url?: string | null
          preferred_language?: string
          expo_push_token?: string | null
          phone?: string | null
          whatsapp?: string | null
        }
      }
      tutor_profiles: {
        Row: {
          id: string
          bio: string | null
          years_experience: number | null
          hourly_rate_qar: number | null
          session_type: 'in_person' | 'online' | 'both'
          areas: string[]
          subjects: string[]
          languages_taught: string[]
          verification_status: 'pending' | 'approved' | 'rejected'
          rejection_reason: string | null
          stripe_account_id: string | null
          stripe_customer_id: string | null
          is_featured: boolean
          featured_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          bio?: string | null
          years_experience?: number | null
          hourly_rate_qar?: number | null
          session_type?: 'in_person' | 'online' | 'both'
          areas?: string[]
          subjects?: string[]
          languages_taught?: string[]
        }
        Update: {
          bio?: string | null
          years_experience?: number | null
          hourly_rate_qar?: number | null
          session_type?: 'in_person' | 'online' | 'both'
          areas?: string[]
          subjects?: string[]
          languages_taught?: string[]
          verification_status?: 'pending' | 'approved' | 'rejected'
          rejection_reason?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          is_featured?: boolean
          featured_until?: string | null
        }
      }
      tutor_availability: {
        Row: {
          id: string
          tutor_id: string
          day_of_week: number
          start_time: string
          end_time: string
        }
        Insert: {
          tutor_id: string
          day_of_week: number
          start_time: string
          end_time: string
        }
        Update: {
          day_of_week?: number
          start_time?: string
          end_time?: string
        }
      }
      bookings: {
        Row: {
          id: string
          student_id: string
          tutor_id: string
          status: 'pending_payment' | 'awaiting_confirmation' | 'confirmed' | 'completed' | 'paid' | 'declined' | 'cancelled' | 'refunded' | 'disputed'
          session_mode: 'in_person' | 'online'
          scheduled_at: string
          duration_minutes: number
          hourly_rate_qar: number
          total_amount_qar: number
          platform_fee_qar: number
          tutor_payout_qar: number
          stripe_payment_intent_id: string | null
          tutor_phone: string | null
          tutor_whatsapp: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          completed_at: string | null
          auto_completed: boolean
          dispute_opened_at: string | null
          dispute_reason: string | null
          dispute_resolved_at: string | null
          dispute_resolved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          student_id: string
          tutor_id: string
          status?: 'pending_payment'
          session_mode: 'in_person' | 'online'
          scheduled_at: string
          duration_minutes: number
          hourly_rate_qar: number
          total_amount_qar: number
          platform_fee_qar: number
          tutor_payout_qar: number
        }
        Update: {
          status?: 'pending_payment' | 'awaiting_confirmation' | 'confirmed' | 'completed' | 'paid' | 'declined' | 'cancelled' | 'refunded' | 'disputed'
          stripe_payment_intent_id?: string | null
          tutor_phone?: string | null
          tutor_whatsapp?: string | null
          completed_at?: string | null
          auto_completed?: boolean
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolved_at?: string | null
          dispute_resolved_by?: string | null
        }
      }
      booking_events: {
        Row: {
          id: string
          booking_id: string
          from_status: string | null
          to_status: string
          actor_id: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          booking_id: string
          from_status?: string | null
          to_status: string
          actor_id?: string | null
          reason?: string | null
        }
        Update: Record<string, never>
      }
      messages: {
        Row: {
          id: string
          booking_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          booking_id: string
          sender_id: string
          content: string
        }
        Update: Record<string, never>
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          student_id: string
          tutor_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          booking_id: string
          student_id: string
          tutor_id: string
          rating: number
          comment?: string | null
        }
        Update: {
          rating?: number
          comment?: string | null
        }
      }
      tutor_documents: {
        Row: {
          id: string
          tutor_id: string
          document_type: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          tutor_id: string
          document_type: string
          storage_path: string
        }
        Update: Record<string, never>
      }
      audit_log: {
        Row: {
          id: string
          event_type: string
          actor_id: string | null
          entity_type: string | null
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          event_type: string
          actor_id?: string | null
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
        }
        Update: Record<string, never>
      }
    }
    Views: {
      tutor_search_results: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          years_experience: number | null
          hourly_rate_qar: number
          session_type: string
          areas: string[]
          subjects: string[]
          languages_taught: string[]
          is_featured: boolean
          search_vector: unknown
          avg_rating: number
          review_count: number
        }
      }
    }
    Functions: {
      get_user_role: { Returns: 'student' | 'tutor' | 'admin' }
    }
  }
}
