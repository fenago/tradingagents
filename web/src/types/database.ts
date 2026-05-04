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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_conversations: {
        Row: {
          agent_key: string
          created_at: string
          id: string
          messages: Json
          run_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_key: string
          created_at?: string
          id?: string
          messages?: Json
          run_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_key?: string
          created_at?: string
          id?: string
          messages?: Json
          run_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          cost_usd: number | null
          delta: number
          id: number
          metadata: Json | null
          reason: string
          run_id: string | null
          ts: string
          user_id: string
        }
        Insert: {
          cost_usd?: number | null
          delta: number
          id?: number
          metadata?: Json | null
          reason: string
          run_id?: string | null
          ts?: string
          user_id: string
        }
        Update: {
          cost_usd?: number | null
          delta?: number
          id?: number
          metadata?: Json | null
          reason?: string
          run_id?: string | null
          ts?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys_encrypted: {
        Row: {
          created_at: string
          hint: string
          key_secret_id: string
          provider: Database["public"]["Enums"]["llm_provider"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hint: string
          key_secret_id: string
          provider: Database["public"]["Enums"]["llm_provider"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hint?: string
          key_secret_id?: string
          provider?: Database["public"]["Enums"]["llm_provider"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brokerage_credentials: {
        Row: {
          account_id: string | null
          account_status: string | null
          broker: Database["public"]["Enums"]["brokerage"]
          buying_power: number | null
          cash: number | null
          connected_at: string
          key_id_hint: string
          key_id_secret_id: string
          paper_mode: boolean
          secret_key_secret_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          account_status?: string | null
          broker?: Database["public"]["Enums"]["brokerage"]
          buying_power?: number | null
          cash?: number | null
          connected_at?: string
          key_id_hint: string
          key_id_secret_id: string
          paper_mode?: boolean
          secret_key_secret_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          account_status?: string | null
          broker?: Database["public"]["Enums"]["brokerage"]
          buying_power?: number | null
          cash?: number | null
          connected_at?: string
          key_id_hint?: string
          key_id_secret_id?: string
          paper_mode?: boolean
          secret_key_secret_id?: string
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
      orders: {
        Row: {
          broker: Database["public"]["Enums"]["brokerage"]
          broker_order_id: string | null
          created_at: string
          filled_avg_price: number | null
          filled_qty: number | null
          id: string
          limit_price: number | null
          order_type: string
          paper_mode: boolean
          qty: number
          raw_response: Json | null
          run_id: string | null
          side: string
          status: string
          ticker: string
          time_in_force: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broker?: Database["public"]["Enums"]["brokerage"]
          broker_order_id?: string | null
          created_at?: string
          filled_avg_price?: number | null
          filled_qty?: number | null
          id?: string
          limit_price?: number | null
          order_type?: string
          paper_mode?: boolean
          qty: number
          raw_response?: Json | null
          run_id?: string | null
          side: string
          status?: string
          ticker: string
          time_in_force?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broker?: Database["public"]["Enums"]["brokerage"]
          broker_order_id?: string | null
          created_at?: string
          filled_avg_price?: number | null
          filled_qty?: number | null
          id?: string
          limit_price?: number | null
          order_type?: string
          paper_mode?: boolean
          qty?: number
          raw_response?: Json | null
          run_id?: string | null
          side?: string
          status?: string
          ticker?: string
          time_in_force?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_run_id_fkey"
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
          credit_balance: number
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
          credit_balance?: number
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
          credit_balance?: number
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
        Insert: {
          created_at?: string | null
          hint?: string | null
          provider?: Database["public"]["Enums"]["llm_provider"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          hint?: string | null
          provider?: Database["public"]["Enums"]["llm_provider"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      vault_create_secret: { Args: { secret: string }; Returns: string }
      vault_delete_secret: { Args: { secret_id: string }; Returns: undefined }
      vault_get_secret: { Args: { secret_id: string }; Returns: string }
    }
    Enums: {
      brokerage: "alpaca"
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
      tier: "free" | "pro" | "trader" | "enterprise" | "researcher" | "director"
      trader_action: "buy" | "hold" | "sell"
      verdict: "buy" | "overweight" | "hold" | "underweight" | "sell"
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
    Enums: {
      brokerage: ["alpaca"],
      llm_provider: [
        "openai",
        "anthropic",
        "google",
        "xai",
        "deepseek",
        "qwen",
        "glm",
        "openrouter",
        "ollama",
        "azure",
      ],
      run_status: ["queued", "running", "completed", "failed", "cancelled"],
      tier: ["free", "pro", "trader", "enterprise", "researcher", "director"],
      trader_action: ["buy", "hold", "sell"],
      verdict: ["buy", "overweight", "hold", "underweight", "sell"],
    },
  },
} as const
