export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_keys_encrypted: {
        Row: {
          ciphertext: string
          created_at: string
          hint: string
          provider: Database["public"]["Enums"]["llm_provider"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ciphertext: string
          created_at?: string
          hint: string
          provider: Database["public"]["Enums"]["llm_provider"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ciphertext?: string
          created_at?: string
          hint?: string
          provider?: Database["public"]["Enums"]["llm_provider"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memory_log: {
        Row: {
          alpha_return: number | null
          created_at: string
          decision: string
          holding_days: number | null
          id: string
          raw_return: number | null
          reflection: string | null
          resolved_at: string | null
          run_id: string | null
          ticker: string
          trade_date: string
          user_id: string
          verdict: Database["public"]["Enums"]["verdict"] | null
        }
        Insert: {
          alpha_return?: number | null
          created_at?: string
          decision: string
          holding_days?: number | null
          id?: string
          raw_return?: number | null
          reflection?: string | null
          resolved_at?: string | null
          run_id?: string | null
          ticker: string
          trade_date: string
          user_id: string
          verdict?: Database["public"]["Enums"]["verdict"] | null
        }
        Update: {
          alpha_return?: number | null
          created_at?: string
          decision?: string
          holding_days?: number | null
          id?: string
          raw_return?: number | null
          reflection?: string | null
          resolved_at?: string | null
          run_id?: string | null
          ticker?: string
          trade_date?: string
          user_id?: string
          verdict?: Database["public"]["Enums"]["verdict"] | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_log_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_admin: boolean
          persona_overrides: Json
          run_defaults: Json
          stripe_customer_id: string | null
          tier: Database["public"]["Enums"]["tier"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          is_admin?: boolean
          persona_overrides?: Json
          run_defaults?: Json
          stripe_customer_id?: string | null
          tier?: Database["public"]["Enums"]["tier"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_admin?: boolean
          persona_overrides?: Json
          run_defaults?: Json
          stripe_customer_id?: string | null
          tier?: Database["public"]["Enums"]["tier"]
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          data: Json | null
          markdown: string
          run_id: string
          section: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          markdown: string
          run_id: string
          section: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          markdown?: string
          run_id?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      run_events: {
        Row: {
          agent: string
          event_type: string
          id: number
          payload: Json
          run_id: string
          ts: string
        }
        Insert: {
          agent: string
          event_type: string
          id?: number
          payload?: Json
          run_id: string
          ts?: string
        }
        Update: {
          agent?: string
          event_type?: string
          id?: number
          payload?: Json
          run_id?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      runs: {
        Row: {
          completed_at: string | null
          confidence: number | null
          config_snapshot: Json
          cost_usd: number
          created_at: string
          error_message: string | null
          id: string
          is_public: boolean
          one_liner: string | null
          queued_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["run_status"]
          ticker: string
          tokens_in: number
          tokens_out: number
          trade_date: string
          trader_action: Database["public"]["Enums"]["trader_action"] | null
          user_id: string
          verdict: Database["public"]["Enums"]["verdict"] | null
        }
        Insert: {
          completed_at?: string | null
          confidence?: number | null
          config_snapshot: Json
          cost_usd?: number
          created_at?: string
          error_message?: string | null
          id?: string
          is_public?: boolean
          one_liner?: string | null
          queued_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          ticker: string
          tokens_in?: number
          tokens_out?: number
          trade_date: string
          trader_action?: Database["public"]["Enums"]["trader_action"] | null
          user_id: string
          verdict?: Database["public"]["Enums"]["verdict"] | null
        }
        Update: {
          completed_at?: string | null
          confidence?: number | null
          config_snapshot?: Json
          cost_usd?: number
          created_at?: string
          error_message?: string | null
          id?: string
          is_public?: boolean
          one_liner?: string | null
          queued_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          ticker?: string
          tokens_in?: number
          tokens_out?: number
          trade_date?: string
          trader_action?: Database["public"]["Enums"]["trader_action"] | null
          user_id?: string
          verdict?: Database["public"]["Enums"]["verdict"] | null
        }
        Relationships: []
      }
      share_links: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          run_id: string
          slug: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          run_id: string
          slug: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          run_id?: string
          slug?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "share_links_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_price_id: string | null
          tier: Database["public"]["Enums"]["tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id: string
          status: string
          stripe_price_id?: string | null
          tier: Database["public"]["Enums"]["tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_price_id?: string | null
          tier?: Database["public"]["Enums"]["tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_ledger: {
        Row: {
          billed_as: string
          cost_usd: number
          id: number
          run_id: string | null
          stripe_meter_event_id: string | null
          tokens_in: number
          tokens_out: number
          ts: string
          user_id: string
        }
        Insert: {
          billed_as: string
          cost_usd?: number
          id?: number
          run_id?: string | null
          stripe_meter_event_id?: string | null
          tokens_in?: number
          tokens_out?: number
          ts?: string
          user_id: string
        }
        Update: {
          billed_as?: string
          cost_usd?: number
          id?: number
          run_id?: string | null
          stripe_meter_event_id?: string | null
          tokens_in?: number
          tokens_out?: number
          ts?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_ledger_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist: {
        Row: {
          added_at: string
          notify_daily: boolean
          notify_on_change: boolean
          ticker: string
          user_id: string
        }
        Insert: {
          added_at?: string
          notify_daily?: boolean
          notify_on_change?: boolean
          ticker: string
          user_id: string
        }
        Update: {
          added_at?: string
          notify_daily?: boolean
          notify_on_change?: boolean
          ticker?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      api_keys_meta: {
        Row: {
          created_at: string | null
          hint: string | null
          provider: Database["public"]["Enums"]["llm_provider"] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: { [_ in never]: never }
    Enums: {
      llm_provider:
        | "openai"
        | "anthropic"
        | "google"
        | "xai"
        | "deepseek"
        | "qwen"
        | "glm"
        | "openrouter"
        | "ollama"
        | "azure"
      run_status: "queued" | "running" | "completed" | "failed" | "cancelled"
      tier: "free" | "pro" | "trader" | "enterprise"
      trader_action: "buy" | "hold" | "sell"
      verdict: "buy" | "overweight" | "hold" | "underweight" | "sell"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
