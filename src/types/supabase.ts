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
      accounting_periods: {
        Row: {
          company_id: string
          created_at: string | null
          end_date: string
          id: string
          is_closed: boolean | null
          name: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          end_date: string
          id?: string
          is_closed?: boolean | null
          name: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          is_closed?: boolean | null
          name?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_number: string
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          account_number: string
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          account_number?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_backup: {
        Row: {
          account_number: string | null
          balance: number | null
          class: number | null
          company_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          imported_from_fec: boolean | null
          is_active: boolean | null
          name: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          balance?: number | null
          class?: number | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string | null
          imported_from_fec?: boolean | null
          is_active?: boolean | null
          name?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          balance?: number | null
          class?: number | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string | null
          imported_from_fec?: boolean | null
          is_active?: boolean | null
          name?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          company_id: string
          context: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          messages: Json
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          context?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          messages?: Json
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          context?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          messages?: Json
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          affected_accounts: Json | null
          category: string
          company_id: string
          confidence_score: number | null
          created_at: string | null
          description: string
          detailed_analysis: string | null
          estimated_time_to_implement: string | null
          expires_at: string | null
          id: string
          impact_score: number | null
          implementation_difficulty: string | null
          implemented_at: string | null
          implemented_by: string | null
          insight_type: string
          model_version: string | null
          priority: string
          related_transactions: Json | null
          source_data: Json | null
          status: string | null
          suggested_actions: Json | null
          title: string
          updated_at: string | null
          user_feedback: string | null
          user_id: string | null
          user_rating: number | null
        }
        Insert: {
          affected_accounts?: Json | null
          category: string
          company_id: string
          confidence_score?: number | null
          created_at?: string | null
          description: string
          detailed_analysis?: string | null
          estimated_time_to_implement?: string | null
          expires_at?: string | null
          id?: string
          impact_score?: number | null
          implementation_difficulty?: string | null
          implemented_at?: string | null
          implemented_by?: string | null
          insight_type: string
          model_version?: string | null
          priority: string
          related_transactions?: Json | null
          source_data?: Json | null
          status?: string | null
          suggested_actions?: Json | null
          title: string
          updated_at?: string | null
          user_feedback?: string | null
          user_id?: string | null
          user_rating?: number | null
        }
        Update: {
          affected_accounts?: Json | null
          category?: string
          company_id?: string
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          detailed_analysis?: string | null
          estimated_time_to_implement?: string | null
          expires_at?: string | null
          id?: string
          impact_score?: number | null
          implementation_difficulty?: string | null
          implemented_at?: string | null
          implemented_by?: string | null
          insight_type?: string
          model_version?: string | null
          priority?: string
          related_transactions?: Json | null
          source_data?: Json | null
          status?: string | null
          suggested_actions?: Json | null
          title?: string
          updated_at?: string | null
          user_feedback?: string | null
          user_id?: string | null
          user_rating?: number | null
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          company_id: string
          confidence_score: number | null
          context_type: string | null
          created_at: string | null
          feedback_comment: string | null
          feedback_rating: number | null
          id: string
          model_used: string | null
          query: string
          response: string
          response_time_ms: number | null
          sources: Json | null
          suggestions: Json | null
          timestamp: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          company_id: string
          confidence_score?: number | null
          context_type?: string | null
          created_at?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          model_used?: string | null
          query: string
          response: string
          response_time_ms?: number | null
          sources?: Json | null
          suggestions?: Json | null
          timestamp?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          company_id?: string
          confidence_score?: number | null
          context_type?: string | null
          created_at?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          model_used?: string | null
          query?: string
          response?: string
          response_time_ms?: number | null
          sources?: Json | null
          suggestions?: Json | null
          timestamp?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_performance_metrics: {
        Row: {
          additional_data: Json | null
          company_id: string | null
          created_at: string | null
          id: string
          measurement_date: string
          measurement_period: string | null
          metric_type: string
          metric_value: number
          model_id: string
          model_version: string
          sample_size: number | null
        }
        Insert: {
          additional_data?: Json | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          measurement_date: string
          measurement_period?: string | null
          metric_type: string
          metric_value: number
          model_id: string
          model_version: string
          sample_size?: number | null
        }
        Update: {
          additional_data?: Json | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          measurement_date?: string
          measurement_period?: string | null
          metric_type?: string
          metric_value?: number
          model_id?: string
          model_version?: string
          sample_size?: number | null
        }
        Relationships: []
      }
      alert_configurations: {
        Row: {
          alert_name: string
          alert_type: string
          company_id: string | null
          conditions: Json
          created_at: string | null
          created_by: string | null
          escalation_rules: Json | null
          id: string
          is_active: boolean | null
          last_triggered: string | null
          notification_channels: string[] | null
          severity: string | null
          trigger_count: number | null
          updated_at: string | null
        }
        Insert: {
          alert_name: string
          alert_type: string
          company_id?: string | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          notification_channels?: string[] | null
          severity?: string | null
          trigger_count?: number | null
          updated_at?: string | null
        }
        Update: {
          alert_name?: string
          alert_type?: string
          company_id?: string | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          notification_channels?: string[] | null
          severity?: string | null
          trigger_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      analytical_distributions: {
        Row: {
          amount: number
          cost_center_id: string
          created_at: string | null
          id: string
          journal_entry_line_id: string
          percentage: number
          project_id: string | null
        }
        Insert: {
          amount: number
          cost_center_id: string
          created_at?: string | null
          id?: string
          journal_entry_line_id: string
          percentage?: number
          project_id?: string | null
        }
        Update: {
          amount?: number
          cost_center_id?: string
          created_at?: string | null
          id?: string
          journal_entry_line_id?: string
          percentage?: number
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytical_distributions_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytical_distributions_journal_entry_line_id_fkey"
            columns: ["journal_entry_line_id"]
            isOneToOne: false
            referencedRelation: "journal_entry_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytical_distributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_detections: {
        Row: {
          affected_data: Json | null
          anomaly_score: number | null
          anomaly_type: string
          company_id: string
          confidence_score: number | null
          created_at: string | null
          description: string
          detected_at: string | null
          detected_value: Json | null
          detection_model: string | null
          id: string
          normal_range: Json | null
          possible_causes: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_assessment: string | null
          severity: string
          source_record_id: string | null
          source_table: string
          status: string | null
          suggested_actions: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_data?: Json | null
          anomaly_score?: number | null
          anomaly_type: string
          company_id: string
          confidence_score?: number | null
          created_at?: string | null
          description: string
          detected_at?: string | null
          detected_value?: Json | null
          detection_model?: string | null
          id?: string
          normal_range?: Json | null
          possible_causes?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_assessment?: string | null
          severity: string
          source_record_id?: string | null
          source_table: string
          status?: string | null
          suggested_actions?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_data?: Json | null
          anomaly_score?: number | null
          anomaly_type?: string
          company_id?: string
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          detected_at?: string | null
          detected_value?: Json | null
          detection_model?: string | null
          id?: string
          normal_range?: Json | null
          possible_causes?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_assessment?: string | null
          severity?: string
          source_record_id?: string | null
          source_table?: string
          status?: string | null
          suggested_actions?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_configurations: {
        Row: {
          api_name: string
          authentication_type: string
          company_id: string | null
          created_at: string | null
          created_by: string | null
          credentials: Json
          endpoint_base_url: string
          headers: Json | null
          id: string
          is_active: boolean | null
          last_successful_call: string | null
          rate_limit_per_minute: number | null
          retry_config: Json | null
          timeout_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          api_name: string
          authentication_type?: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credentials?: Json
          endpoint_base_url: string
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_successful_call?: string | null
          rate_limit_per_minute?: number | null
          retry_config?: Json | null
          timeout_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          api_name?: string
          authentication_type?: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credentials?: Json
          endpoint_base_url?: string
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_successful_call?: string | null
          rate_limit_per_minute?: number | null
          retry_config?: Json | null
          timeout_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          allowed_ips: string[] | null
          company_id: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          rate_limit_per_day: number | null
          rate_limit_per_hour: number | null
          rate_limit_per_minute: number | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          scopes: string[]
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          allowed_ips?: string[] | null
          company_id: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[]
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          allowed_ips?: string[] | null
          company_id?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[]
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_logs: {
        Row: {
          api_key_id: string
          company_id: string
          created_at: string
          endpoint: string
          error_code: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          method: string
          rate_limit_remaining: number | null
          request_size_bytes: number | null
          response_size_bytes: number | null
          response_time_ms: number | null
          status_code: number
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          company_id: string
          created_at?: string
          endpoint: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method: string
          rate_limit_remaining?: number | null
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_time_ms?: number | null
          status_code: number
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          company_id?: string
          created_at?: string
          endpoint?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method?: string
          rate_limit_remaining?: number | null
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_time_ms?: number | null
          status_code?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          clock_in: string | null
          clock_out: string | null
          company_id: string
          created_at: string | null
          employee_id: string
          id: string
          is_holiday: boolean | null
          is_weekend: boolean | null
          location: string | null
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attendance_date: string
          clock_in?: string | null
          clock_out?: string | null
          company_id: string
          created_at?: string | null
          employee_id: string
          id?: string
          is_holiday?: boolean | null
          is_weekend?: boolean | null
          location?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attendance_date?: string
          clock_in?: string | null
          clock_out?: string | null
          company_id?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          is_holiday?: boolean | null
          is_weekend?: boolean | null
          location?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          changes_summary: string | null
          company_id: string | null
          compliance_tags: string[] | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          event_timestamp: string | null
          event_type: string | null
          id: string
          ip_address: unknown
          is_sensitive: boolean | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          request_id: string | null
          request_method: string | null
          request_path: string | null
          resource_type: string | null
          security_level: string | null
          session_id: string | null
          status: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          changes_summary?: string | null
          company_id?: string | null
          compliance_tags?: string[] | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          event_timestamp?: string | null
          event_type?: string | null
          id?: string
          ip_address?: unknown
          is_sensitive?: boolean | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          request_id?: string | null
          request_method?: string | null
          request_path?: string | null
          resource_type?: string | null
          security_level?: string | null
          session_id?: string | null
          status?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          changes_summary?: string | null
          company_id?: string | null
          compliance_tags?: string[] | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          event_timestamp?: string | null
          event_type?: string | null
          id?: string
          ip_address?: unknown
          is_sensitive?: boolean | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          request_id?: string | null
          request_method?: string | null
          request_path?: string | null
          resource_type?: string | null
          security_level?: string | null
          session_id?: string | null
          status?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          company_id: string | null
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          error_count: number | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed: string | null
          priority: number | null
          rule_name: string
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          company_id?: string | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          error_count?: number | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          priority?: number | null
          rule_name: string
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          company_id?: string | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          error_count?: number | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          priority?: number | null
          rule_name?: string
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      available_features: {
        Row: {
          category: string
          conflicts_with: string[] | null
          created_at: string | null
          default_enabled: boolean | null
          default_reset_period: string | null
          default_usage_limit: number | null
          deprecation_date: string | null
          description_en: string | null
          description_fr: string | null
          display_name_en: string | null
          display_name_fr: string
          enterprise_only: boolean | null
          feature_name: string
          icon_color: string | null
          icon_name: string | null
          is_active: boolean | null
          is_beta: boolean | null
          release_date: string | null
          requires_features: string[] | null
          requires_plan: string | null
          requires_subscription: boolean | null
          sort_order: number | null
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          conflicts_with?: string[] | null
          created_at?: string | null
          default_enabled?: boolean | null
          default_reset_period?: string | null
          default_usage_limit?: number | null
          deprecation_date?: string | null
          description_en?: string | null
          description_fr?: string | null
          display_name_en?: string | null
          display_name_fr: string
          enterprise_only?: boolean | null
          feature_name: string
          icon_color?: string | null
          icon_name?: string | null
          is_active?: boolean | null
          is_beta?: boolean | null
          release_date?: string | null
          requires_features?: string[] | null
          requires_plan?: string | null
          requires_subscription?: boolean | null
          sort_order?: number | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          conflicts_with?: string[] | null
          created_at?: string | null
          default_enabled?: boolean | null
          default_reset_period?: string | null
          default_usage_limit?: number | null
          deprecation_date?: string | null
          description_en?: string | null
          description_fr?: string | null
          display_name_en?: string | null
          display_name_fr?: string
          enterprise_only?: boolean | null
          feature_name?: string
          icon_color?: string | null
          icon_name?: string | null
          is_active?: boolean | null
          is_beta?: boolean | null
          release_date?: string | null
          requires_features?: string[] | null
          requires_plan?: string | null
          requires_subscription?: boolean | null
          sort_order?: number | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_configurations: {
        Row: {
          backup_type: string
          company_id: string | null
          compression_enabled: boolean | null
          config_name: string
          created_at: string | null
          created_by: string | null
          encryption_enabled: boolean | null
          exclude_patterns: string[] | null
          id: string
          include_patterns: string[] | null
          is_active: boolean | null
          last_backup: string | null
          next_backup: string | null
          retention_days: number | null
          schedule_expression: string | null
          storage_location: string
          updated_at: string | null
        }
        Insert: {
          backup_type: string
          company_id?: string | null
          compression_enabled?: boolean | null
          config_name: string
          created_at?: string | null
          created_by?: string | null
          encryption_enabled?: boolean | null
          exclude_patterns?: string[] | null
          id?: string
          include_patterns?: string[] | null
          is_active?: boolean | null
          last_backup?: string | null
          next_backup?: string | null
          retention_days?: number | null
          schedule_expression?: string | null
          storage_location: string
          updated_at?: string | null
        }
        Update: {
          backup_type?: string
          company_id?: string | null
          compression_enabled?: boolean | null
          config_name?: string
          created_at?: string | null
          created_by?: string | null
          encryption_enabled?: boolean | null
          exclude_patterns?: string[] | null
          id?: string
          include_patterns?: string[] | null
          is_active?: boolean | null
          last_backup?: string | null
          next_backup?: string | null
          retention_days?: number | null
          schedule_expression?: string | null
          storage_location?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string | null
          accounting_account_id: string | null
          authorized_overdraft: number | null
          bank_name: string
          bic: string | null
          company_id: string
          created_at: string | null
          currency: string | null
          current_balance: number | null
          iban: string | null
          id: string
          initial_balance: number | null
          is_active: boolean | null
          last_import: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          account_type?: string | null
          accounting_account_id?: string | null
          authorized_overdraft?: number | null
          bank_name: string
          bic?: string | null
          company_id: string
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          iban?: string | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          last_import?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string | null
          accounting_account_id?: string | null
          authorized_overdraft?: number | null
          bank_name?: string
          bic?: string | null
          company_id?: string
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          iban?: string | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          last_import?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_accounting_account_id_fkey"
            columns: ["accounting_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_alert_rules: {
        Row: {
          account_filters: string[] | null
          alert_type: string
          applies_to: string
          auto_resolve: boolean | null
          auto_resolve_conditions: Json | null
          category_filters: string[] | null
          company_id: string
          cooldown_minutes: number | null
          created_at: string | null
          created_by: string
          false_positive_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          notification_channels: Json
          priority: string
          require_acknowledgment: boolean | null
          rule_description: string | null
          rule_name: string
          trigger_conditions: Json
          trigger_count: number | null
          updated_at: string | null
        }
        Insert: {
          account_filters?: string[] | null
          alert_type: string
          applies_to?: string
          auto_resolve?: boolean | null
          auto_resolve_conditions?: Json | null
          category_filters?: string[] | null
          company_id: string
          cooldown_minutes?: number | null
          created_at?: string | null
          created_by: string
          false_positive_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          notification_channels?: Json
          priority?: string
          require_acknowledgment?: boolean | null
          rule_description?: string | null
          rule_name: string
          trigger_conditions?: Json
          trigger_count?: number | null
          updated_at?: string | null
        }
        Update: {
          account_filters?: string[] | null
          alert_type?: string
          applies_to?: string
          auto_resolve?: boolean | null
          auto_resolve_conditions?: Json | null
          category_filters?: string[] | null
          company_id?: string
          cooldown_minutes?: number | null
          created_at?: string | null
          created_by?: string
          false_positive_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          notification_channels?: Json
          priority?: string
          require_acknowledgment?: boolean | null
          rule_description?: string | null
          rule_name?: string
          trigger_conditions?: Json
          trigger_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_alert_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_audit_logs: {
        Row: {
          action: string
          action_category: string
          city: string | null
          company_id: string | null
          connection_id: string | null
          country_code: string | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          event_data: Json | null
          id: string
          ip_address: unknown
          request_id: string | null
          requires_review: boolean | null
          resource_id: string | null
          resource_type: string | null
          risk_level: string | null
          sensitive_data_accessed: boolean | null
          session_id: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          action_category: string
          city?: string | null
          company_id?: string | null
          connection_id?: string | null
          country_code?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          event_data?: Json | null
          id?: string
          ip_address?: unknown
          request_id?: string | null
          requires_review?: boolean | null
          resource_id?: string | null
          resource_type?: string | null
          risk_level?: string | null
          sensitive_data_accessed?: boolean | null
          session_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          action_category?: string
          city?: string | null
          company_id?: string | null
          connection_id?: string | null
          country_code?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          event_data?: Json | null
          id?: string
          ip_address?: unknown
          request_id?: string | null
          requires_review?: boolean | null
          resource_id?: string | null
          resource_type?: string | null
          risk_level?: string | null
          sensitive_data_accessed?: boolean | null
          session_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_audit_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_auth_flows: {
        Row: {
          auth_url: string | null
          challenge_data: Json | null
          code_verifier: string | null
          company_id: string
          completed_at: string | null
          connection_id: string
          consent_id: string | null
          consent_url: string | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          expires_at: string
          flow_type: string
          id: string
          max_retries: number | null
          permissions_requested: Json | null
          redirect_uri: string | null
          retry_count: number | null
          sca_method: string | null
          sca_status: string | null
          state_token: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          auth_url?: string | null
          challenge_data?: Json | null
          code_verifier?: string | null
          company_id: string
          completed_at?: string | null
          connection_id: string
          consent_id?: string | null
          consent_url?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string
          flow_type?: string
          id?: string
          max_retries?: number | null
          permissions_requested?: Json | null
          redirect_uri?: string | null
          retry_count?: number | null
          sca_method?: string | null
          sca_status?: string | null
          state_token?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          auth_url?: string | null
          challenge_data?: Json | null
          code_verifier?: string | null
          company_id?: string
          completed_at?: string | null
          connection_id?: string
          consent_id?: string | null
          consent_url?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string
          flow_type?: string
          id?: string
          max_retries?: number | null
          permissions_requested?: Json | null
          redirect_uri?: string | null
          retry_count?: number | null
          sca_method?: string | null
          sca_status?: string | null
          state_token?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_auth_flows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_auth_flows_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_balance_forecasts: {
        Row: {
          accuracy_last_period: number | null
          bank_account_id: string
          base_balance: number
          base_date: string
          cash_shortage_risk: boolean | null
          company_id: string
          created_at: string | null
          daily_forecasts: Json
          forecast_date: string
          forecast_horizon_days: number
          forecast_metadata: Json | null
          forecast_method: string
          id: string
          model_parameters: Json | null
          most_likely_scenario: Json | null
          optimistic_scenario: Json | null
          overall_confidence: number | null
          pessimistic_scenario: Json | null
          predicted_low_balance_amount: number | null
          predicted_low_balance_date: string | null
          recurring_inflows: Json | null
          recurring_outflows: Json | null
          updated_at: string | null
        }
        Insert: {
          accuracy_last_period?: number | null
          bank_account_id: string
          base_balance: number
          base_date: string
          cash_shortage_risk?: boolean | null
          company_id: string
          created_at?: string | null
          daily_forecasts?: Json
          forecast_date?: string
          forecast_horizon_days?: number
          forecast_metadata?: Json | null
          forecast_method?: string
          id?: string
          model_parameters?: Json | null
          most_likely_scenario?: Json | null
          optimistic_scenario?: Json | null
          overall_confidence?: number | null
          pessimistic_scenario?: Json | null
          predicted_low_balance_amount?: number | null
          predicted_low_balance_date?: string | null
          recurring_inflows?: Json | null
          recurring_outflows?: Json | null
          updated_at?: string | null
        }
        Update: {
          accuracy_last_period?: number | null
          bank_account_id?: string
          base_balance?: number
          base_date?: string
          cash_shortage_risk?: boolean | null
          company_id?: string
          created_at?: string | null
          daily_forecasts?: Json
          forecast_date?: string
          forecast_horizon_days?: number
          forecast_metadata?: Json | null
          forecast_method?: string
          id?: string
          model_parameters?: Json | null
          most_likely_scenario?: Json | null
          optimistic_scenario?: Json | null
          overall_confidence?: number | null
          pessimistic_scenario?: Json | null
          predicted_low_balance_amount?: number | null
          predicted_low_balance_date?: string | null
          recurring_inflows?: Json | null
          recurring_outflows?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_balance_forecasts_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_balance_forecasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_cash_flow_analysis: {
        Row: {
          analysis_date: string
          analysis_metadata: Json | null
          analysis_period: string
          average_balance: number | null
          bank_account_id: string
          burn_rate: number | null
          cash_flow_by_category: Json | null
          cash_flow_volatility: number | null
          closing_balance: number
          company_id: string
          created_at: string | null
          financing_cash_flow: number | null
          id: string
          inflow_transaction_count: number | null
          investing_cash_flow: number | null
          max_balance: number | null
          min_balance: number | null
          net_cash_flow: number | null
          opening_balance: number
          operating_cash_flow: number | null
          outflow_transaction_count: number | null
          period_end: string
          period_start: string
          runway_days: number | null
          top_expenses: Json | null
          top_revenues: Json | null
          total_inflows: number | null
          total_outflows: number | null
          transaction_count: number | null
          updated_at: string | null
        }
        Insert: {
          analysis_date?: string
          analysis_metadata?: Json | null
          analysis_period: string
          average_balance?: number | null
          bank_account_id: string
          burn_rate?: number | null
          cash_flow_by_category?: Json | null
          cash_flow_volatility?: number | null
          closing_balance?: number
          company_id: string
          created_at?: string | null
          financing_cash_flow?: number | null
          id?: string
          inflow_transaction_count?: number | null
          investing_cash_flow?: number | null
          max_balance?: number | null
          min_balance?: number | null
          net_cash_flow?: number | null
          opening_balance?: number
          operating_cash_flow?: number | null
          outflow_transaction_count?: number | null
          period_end: string
          period_start: string
          runway_days?: number | null
          top_expenses?: Json | null
          top_revenues?: Json | null
          total_inflows?: number | null
          total_outflows?: number | null
          transaction_count?: number | null
          updated_at?: string | null
        }
        Update: {
          analysis_date?: string
          analysis_metadata?: Json | null
          analysis_period?: string
          average_balance?: number | null
          bank_account_id?: string
          burn_rate?: number | null
          cash_flow_by_category?: Json | null
          cash_flow_volatility?: number | null
          closing_balance?: number
          company_id?: string
          created_at?: string | null
          financing_cash_flow?: number | null
          id?: string
          inflow_transaction_count?: number | null
          investing_cash_flow?: number | null
          max_balance?: number | null
          min_balance?: number | null
          net_cash_flow?: number | null
          opening_balance?: number
          operating_cash_flow?: number | null
          outflow_transaction_count?: number | null
          period_end?: string
          period_start?: string
          runway_days?: number | null
          top_expenses?: Json | null
          top_revenues?: Json | null
          total_inflows?: number | null
          total_outflows?: number | null
          transaction_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_cash_flow_analysis_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_cash_flow_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_categorization_rules: {
        Row: {
          accuracy_rate: number | null
          applications_count: number | null
          company_id: string
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_applied_at: string | null
          ml_confidence_threshold: number | null
          name: string
          priority: number | null
          target_account_code: string | null
          target_category: string
          target_subcategory: string | null
          updated_at: string | null
          use_ml_enhancement: boolean | null
        }
        Insert: {
          accuracy_rate?: number | null
          applications_count?: number | null
          company_id: string
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_applied_at?: string | null
          ml_confidence_threshold?: number | null
          name: string
          priority?: number | null
          target_account_code?: string | null
          target_category: string
          target_subcategory?: string | null
          updated_at?: string | null
          use_ml_enhancement?: boolean | null
        }
        Update: {
          accuracy_rate?: number | null
          applications_count?: number | null
          company_id?: string
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_applied_at?: string | null
          ml_confidence_threshold?: number | null
          name?: string
          priority?: number | null
          target_account_code?: string | null
          target_category?: string
          target_subcategory?: string | null
          updated_at?: string | null
          use_ml_enhancement?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_categorization_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_connections: {
        Row: {
          access_token: string | null
          auto_sync_enabled: boolean | null
          bank_bic: string | null
          bank_country: string | null
          bank_id: string
          bank_logo: string | null
          bank_name: string
          company_id: string
          connection_metadata: Json | null
          consent_expires_at: string | null
          consent_id: string | null
          consent_permissions: Json | null
          consent_status: string | null
          created_at: string | null
          created_by: string | null
          error_code: string | null
          error_message: string | null
          id: string
          last_sync: string | null
          next_sync: string | null
          provider_connection_id: string
          provider_id: string
          provider_metadata: Json | null
          provider_name: string
          refresh_token: string | null
          status: string
          sync_frequency_hours: number | null
          token_expires_at: string | null
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          auto_sync_enabled?: boolean | null
          bank_bic?: string | null
          bank_country?: string | null
          bank_id: string
          bank_logo?: string | null
          bank_name: string
          company_id: string
          connection_metadata?: Json | null
          consent_expires_at?: string | null
          consent_id?: string | null
          consent_permissions?: Json | null
          consent_status?: string | null
          created_at?: string | null
          created_by?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          last_sync?: string | null
          next_sync?: string | null
          provider_connection_id: string
          provider_id: string
          provider_metadata?: Json | null
          provider_name: string
          refresh_token?: string | null
          status?: string
          sync_frequency_hours?: number | null
          token_expires_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          auto_sync_enabled?: boolean | null
          bank_bic?: string | null
          bank_country?: string | null
          bank_id?: string
          bank_logo?: string | null
          bank_name?: string
          company_id?: string
          connection_metadata?: Json | null
          consent_expires_at?: string | null
          consent_id?: string | null
          consent_permissions?: Json | null
          consent_status?: string | null
          created_at?: string | null
          created_by?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          last_sync?: string | null
          next_sync?: string | null
          provider_connection_id?: string
          provider_id?: string
          provider_metadata?: Json | null
          provider_name?: string
          refresh_token?: string | null
          status?: string
          sync_frequency_hours?: number | null
          token_expires_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_connections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_consents: {
        Row: {
          access_count_today: number | null
          accounts_scope: string | null
          company_id: string
          connection_id: string
          consent_id: string
          consent_type: string
          created_at: string | null
          created_at_bank: string | null
          id: string
          last_access_date: string | null
          last_action_date: string | null
          max_frequency_per_day: number | null
          permissions: Json
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          selected_accounts: string[] | null
          status: string
          updated_at: string | null
          valid_until: string
        }
        Insert: {
          access_count_today?: number | null
          accounts_scope?: string | null
          company_id: string
          connection_id: string
          consent_id: string
          consent_type?: string
          created_at?: string | null
          created_at_bank?: string | null
          id?: string
          last_access_date?: string | null
          last_action_date?: string | null
          max_frequency_per_day?: number | null
          permissions?: Json
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          selected_accounts?: string[] | null
          status?: string
          updated_at?: string | null
          valid_until: string
        }
        Update: {
          access_count_today?: number | null
          accounts_scope?: string | null
          company_id?: string
          connection_id?: string
          consent_id?: string
          consent_type?: string
          created_at?: string | null
          created_at_bank?: string | null
          id?: string
          last_access_date?: string | null
          last_action_date?: string | null
          max_frequency_per_day?: number | null
          permissions?: Json
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          selected_accounts?: string[] | null
          status?: string
          updated_at?: string | null
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_consents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_consents_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_dashboards: {
        Row: {
          allowed_users: string[] | null
          company_id: string
          created_at: string | null
          created_by: string
          custom_charts: Json | null
          custom_kpis: Json | null
          dashboard_metadata: Json | null
          dashboard_name: string
          description: string | null
          filters: Json | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_public: boolean | null
          last_viewed_at: string | null
          layout_config: Json
          permissions: Json | null
          refresh_interval_minutes: number | null
          updated_at: string | null
          updated_by: string | null
          view_count: number | null
          widgets: Json
        }
        Insert: {
          allowed_users?: string[] | null
          company_id: string
          created_at?: string | null
          created_by: string
          custom_charts?: Json | null
          custom_kpis?: Json | null
          dashboard_metadata?: Json | null
          dashboard_name: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_public?: boolean | null
          last_viewed_at?: string | null
          layout_config?: Json
          permissions?: Json | null
          refresh_interval_minutes?: number | null
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
          widgets?: Json
        }
        Update: {
          allowed_users?: string[] | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          custom_charts?: Json | null
          custom_kpis?: Json | null
          dashboard_metadata?: Json | null
          dashboard_name?: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_public?: boolean | null
          last_viewed_at?: string | null
          layout_config?: Json
          permissions?: Json | null
          refresh_interval_minutes?: number | null
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
          widgets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "bank_dashboards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_encrypted_credentials: {
        Row: {
          access_count: number | null
          connection_id: string
          created_at: string | null
          data_type: string
          data_version: number | null
          encrypted_data: string
          encryption_algorithm: string
          expires_at: string | null
          id: string
          initialization_vector: string
          key_derivation_salt: string | null
          key_id: string
          key_rotation_version: number | null
          last_accessed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_count?: number | null
          connection_id: string
          created_at?: string | null
          data_type: string
          data_version?: number | null
          encrypted_data: string
          encryption_algorithm?: string
          expires_at?: string | null
          id?: string
          initialization_vector: string
          key_derivation_salt?: string | null
          key_id: string
          key_rotation_version?: number | null
          last_accessed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_count?: number | null
          connection_id?: string
          created_at?: string | null
          data_type?: string
          data_version?: number | null
          encrypted_data?: string
          encryption_algorithm?: string
          expires_at?: string | null
          id?: string
          initialization_vector?: string
          key_derivation_salt?: string | null
          key_id?: string
          key_rotation_version?: number | null
          last_accessed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_encrypted_credentials_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_export_formats: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          default_filters: Json | null
          description: string | null
          display_name: string
          export_config: Json
          field_mappings: Json
          file_extension: string
          file_format: string
          id: string
          is_active: boolean | null
          is_system_format: boolean | null
          last_used_at: string | null
          name: string
          software_version: string | null
          target_software: string
          updated_at: string | null
          usage_count: number | null
          validation_rules: Json | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          default_filters?: Json | null
          description?: string | null
          display_name: string
          export_config?: Json
          field_mappings?: Json
          file_extension: string
          file_format: string
          id?: string
          is_active?: boolean | null
          is_system_format?: boolean | null
          last_used_at?: string | null
          name: string
          software_version?: string | null
          target_software: string
          updated_at?: string | null
          usage_count?: number | null
          validation_rules?: Json | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          default_filters?: Json | null
          description?: string | null
          display_name?: string
          export_config?: Json
          field_mappings?: Json
          file_extension?: string
          file_format?: string
          id?: string
          is_active?: boolean | null
          is_system_format?: boolean | null
          last_used_at?: string | null
          name?: string
          software_version?: string | null
          target_software?: string
          updated_at?: string | null
          usage_count?: number | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_export_formats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_export_jobs: {
        Row: {
          account_filters: string[] | null
          category_filters: string[] | null
          company_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string
          current_step: string | null
          date_range_end: string
          date_range_start: string
          error_details: Json | null
          error_message: string | null
          export_format_id: string
          export_parameters: Json
          id: string
          job_metadata: Json | null
          job_name: string | null
          output_file_path: string | null
          output_file_size: number | null
          processing_duration_ms: number | null
          progress_percentage: number | null
          records_exported: number | null
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          account_filters?: string[] | null
          category_filters?: string[] | null
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          current_step?: string | null
          date_range_end: string
          date_range_start: string
          error_details?: Json | null
          error_message?: string | null
          export_format_id: string
          export_parameters?: Json
          id?: string
          job_metadata?: Json | null
          job_name?: string | null
          output_file_path?: string | null
          output_file_size?: number | null
          processing_duration_ms?: number | null
          progress_percentage?: number | null
          records_exported?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          account_filters?: string[] | null
          category_filters?: string[] | null
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          current_step?: string | null
          date_range_end?: string
          date_range_start?: string
          error_details?: Json | null
          error_message?: string | null
          export_format_id?: string
          export_parameters?: Json
          id?: string
          job_metadata?: Json | null
          job_name?: string | null
          output_file_path?: string | null
          output_file_size?: number | null
          processing_duration_ms?: number | null
          progress_percentage?: number | null
          records_exported?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_export_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_export_jobs_export_format_id_fkey"
            columns: ["export_format_id"]
            isOneToOne: false
            referencedRelation: "bank_export_formats"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_field_mappings: {
        Row: {
          created_at: string | null
          default_value: string | null
          export_format_id: string
          field_order: number | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          source_field: string
          target_field: string
          transformation_config: Json | null
          transformation_type: string | null
          updated_at: string | null
          validation_pattern: string | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          export_format_id: string
          field_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          source_field: string
          target_field: string
          transformation_config?: Json | null
          transformation_type?: string | null
          updated_at?: string | null
          validation_pattern?: string | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          export_format_id?: string
          field_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          source_field?: string
          target_field?: string
          transformation_config?: Json | null
          transformation_type?: string | null
          updated_at?: string | null
          validation_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_field_mappings_export_format_id_fkey"
            columns: ["export_format_id"]
            isOneToOne: false
            referencedRelation: "bank_export_formats"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_merchant_data: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          brand_name: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string | null
          data_confidence: number | null
          data_source: string | null
          email: string | null
          id: string
          industry: string | null
          last_seen_at: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          mcc_code: string | null
          merchant_id: string | null
          merchant_name: string
          normalized_name: string
          phone: string | null
          postal_code: string | null
          primary_color: string | null
          subcategory: string | null
          transaction_count: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          brand_name?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          data_confidence?: number | null
          data_source?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          last_seen_at?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          mcc_code?: string | null
          merchant_id?: string | null
          merchant_name: string
          normalized_name: string
          phone?: string | null
          postal_code?: string | null
          primary_color?: string | null
          subcategory?: string | null
          transaction_count?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          brand_name?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          data_confidence?: number | null
          data_source?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          last_seen_at?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          mcc_code?: string | null
          merchant_id?: string | null
          merchant_name?: string
          normalized_name?: string
          phone?: string | null
          postal_code?: string | null
          primary_color?: string | null
          subcategory?: string | null
          transaction_count?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      bank_notifications: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          action_taken: string | null
          action_taken_at: string | null
          alert_rule_id: string | null
          auto_delete: boolean | null
          available_actions: Json | null
          channels_sent: Json | null
          company_id: string
          created_at: string | null
          delivery_status: Json | null
          details: Json | null
          expires_at: string | null
          id: string
          message: string
          notification_type: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          severity: string
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_taken?: string | null
          action_taken_at?: string | null
          alert_rule_id?: string | null
          auto_delete?: boolean | null
          available_actions?: Json | null
          channels_sent?: Json | null
          company_id: string
          created_at?: string | null
          delivery_status?: Json | null
          details?: Json | null
          expires_at?: string | null
          id?: string
          message: string
          notification_type: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_taken?: string | null
          action_taken_at?: string | null
          alert_rule_id?: string | null
          auto_delete?: boolean | null
          available_actions?: Json | null
          channels_sent?: Json | null
          company_id?: string
          created_at?: string | null
          delivery_status?: Json | null
          details?: Json | null
          expires_at?: string | null
          id?: string
          message?: string
          notification_type?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_notifications_alert_rule_id_fkey"
            columns: ["alert_rule_id"]
            isOneToOne: false
            referencedRelation: "bank_alert_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_providers: {
        Row: {
          api_version: string | null
          auth_type: string
          base_url: string
          config: Json | null
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_sandbox: boolean | null
          logo: string | null
          name: string
          provider_id: string
          rate_limit_requests: number | null
          rate_limit_window_hours: number | null
          supported_banks_count: number | null
          supported_countries: string[] | null
          supports_payment_initiation: boolean | null
          supports_psd2: boolean | null
          supports_sca: boolean | null
          supports_webhooks: boolean | null
          type: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          api_version?: string | null
          auth_type: string
          base_url: string
          config?: Json | null
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          logo?: string | null
          name: string
          provider_id: string
          rate_limit_requests?: number | null
          rate_limit_window_hours?: number | null
          supported_banks_count?: number | null
          supported_countries?: string[] | null
          supports_payment_initiation?: boolean | null
          supports_psd2?: boolean | null
          supports_sca?: boolean | null
          supports_webhooks?: boolean | null
          type: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          api_version?: string | null
          auth_type?: string
          base_url?: string
          config?: Json | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          logo?: string | null
          name?: string
          provider_id?: string
          rate_limit_requests?: number | null
          rate_limit_window_hours?: number | null
          supported_banks_count?: number | null
          supported_countries?: string[] | null
          supports_payment_initiation?: boolean | null
          supports_psd2?: boolean | null
          supports_sca?: boolean | null
          supports_webhooks?: boolean | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      bank_reconciliation: {
        Row: {
          accounting_entry_id: string | null
          bank_account_id: string
          bank_transaction_id: string
          company_id: string
          confidence_score: number | null
          created_at: string | null
          discrepancies: Json | null
          id: string
          internal_notes: string | null
          match_criteria: Json | null
          match_type: string | null
          notes: string | null
          status: string
          updated_at: string | null
          validated: boolean | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          accounting_entry_id?: string | null
          bank_account_id: string
          bank_transaction_id: string
          company_id: string
          confidence_score?: number | null
          created_at?: string | null
          discrepancies?: Json | null
          id?: string
          internal_notes?: string | null
          match_criteria?: Json | null
          match_type?: string | null
          notes?: string | null
          status?: string
          updated_at?: string | null
          validated?: boolean | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          accounting_entry_id?: string | null
          bank_account_id?: string
          bank_transaction_id?: string
          company_id?: string
          confidence_score?: number | null
          created_at?: string | null
          discrepancies?: Json | null
          id?: string
          internal_notes?: string | null
          match_criteria?: Json | null
          match_type?: string | null
          notes?: string | null
          status?: string
          updated_at?: string | null
          validated?: boolean | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliation_log: {
        Row: {
          accounting_entry_id: string | null
          action: string
          action_type: string
          bank_transaction_id: string | null
          company_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          new_state: Json | null
          previous_state: Json | null
          reconciliation_id: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accounting_entry_id?: string | null
          action: string
          action_type?: string
          bank_transaction_id?: string | null
          company_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          new_state?: Json | null
          previous_state?: Json | null
          reconciliation_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accounting_entry_id?: string | null
          action?: string
          action_type?: string
          bank_transaction_id?: string | null
          company_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          new_state?: Json | null
          previous_state?: Json | null
          reconciliation_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_log_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_log_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliation"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliation_matches: {
        Row: {
          bank_transaction_id: string
          company_id: string
          confidence_score: number
          created_at: string | null
          id: string
          match_criteria: Json | null
          match_type: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rule_id: string | null
          score_breakdown: Json | null
          status: string
          suggested_accounting_entry_id: string | null
          system_notes: string | null
          updated_at: string | null
        }
        Insert: {
          bank_transaction_id: string
          company_id: string
          confidence_score?: number
          created_at?: string | null
          id?: string
          match_criteria?: Json | null
          match_type: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rule_id?: string | null
          score_breakdown?: Json | null
          status?: string
          suggested_accounting_entry_id?: string | null
          system_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_transaction_id?: string
          company_id?: string
          confidence_score?: number
          created_at?: string | null
          id?: string
          match_criteria?: Json | null
          match_type?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rule_id?: string | null
          score_breakdown?: Json | null
          status?: string
          suggested_accounting_entry_id?: string | null
          system_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_matches_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_matches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_matches_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliation_rules: {
        Row: {
          actions: Json
          auto_apply: boolean | null
          company_id: string
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          match_count: number | null
          name: string
          priority: number | null
          requires_review: boolean | null
          success_rate: number | null
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          auto_apply?: boolean | null
          company_id: string
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          match_count?: number | null
          name: string
          priority?: number | null
          requires_review?: boolean | null
          success_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          auto_apply?: boolean | null
          company_id?: string
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          match_count?: number | null
          name?: string
          priority?: number | null
          requires_review?: boolean | null
          success_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_sca_methods: {
        Row: {
          auth_flow_id: string | null
          challenge_format: string | null
          challenge_length: number | null
          connection_id: string
          created_at: string | null
          id: string
          is_available: boolean | null
          is_preferred: boolean | null
          last_used_at: string | null
          method_description: string | null
          method_metadata: Json | null
          method_name: string
          method_type: string
          priority: number | null
        }
        Insert: {
          auth_flow_id?: string | null
          challenge_format?: string | null
          challenge_length?: number | null
          connection_id: string
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          is_preferred?: boolean | null
          last_used_at?: string | null
          method_description?: string | null
          method_metadata?: Json | null
          method_name: string
          method_type: string
          priority?: number | null
        }
        Update: {
          auth_flow_id?: string | null
          challenge_format?: string | null
          challenge_length?: number | null
          connection_id?: string
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          is_preferred?: boolean | null
          last_used_at?: string | null
          method_description?: string | null
          method_metadata?: Json | null
          method_name?: string
          method_type?: string
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_sca_methods_auth_flow_id_fkey"
            columns: ["auth_flow_id"]
            isOneToOne: false
            referencedRelation: "bank_auth_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_sca_methods_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_spending_patterns: {
        Row: {
          analysis_date: string
          analysis_period: string
          average_amount: number | null
          bank_account_id: string | null
          company_id: string
          confidence_score: number | null
          created_at: string | null
          frequency: string | null
          growth_rate: number | null
          id: string
          is_anomaly: boolean | null
          pattern_category: string
          pattern_description: string
          pattern_metadata: Json | null
          pattern_type: string
          pattern_value: string | null
          period_end: string
          period_start: string
          representative_transactions: Json | null
          requires_attention: boolean | null
          risk_level: string | null
          total_amount: number | null
          transaction_count: number | null
          trend_direction: string | null
          updated_at: string | null
          volatility: number | null
          vs_previous_period: number | null
          vs_same_period_last_year: number | null
        }
        Insert: {
          analysis_date?: string
          analysis_period: string
          average_amount?: number | null
          bank_account_id?: string | null
          company_id: string
          confidence_score?: number | null
          created_at?: string | null
          frequency?: string | null
          growth_rate?: number | null
          id?: string
          is_anomaly?: boolean | null
          pattern_category: string
          pattern_description: string
          pattern_metadata?: Json | null
          pattern_type: string
          pattern_value?: string | null
          period_end: string
          period_start: string
          representative_transactions?: Json | null
          requires_attention?: boolean | null
          risk_level?: string | null
          total_amount?: number | null
          transaction_count?: number | null
          trend_direction?: string | null
          updated_at?: string | null
          volatility?: number | null
          vs_previous_period?: number | null
          vs_same_period_last_year?: number | null
        }
        Update: {
          analysis_date?: string
          analysis_period?: string
          average_amount?: number | null
          bank_account_id?: string | null
          company_id?: string
          confidence_score?: number | null
          created_at?: string | null
          frequency?: string | null
          growth_rate?: number | null
          id?: string
          is_anomaly?: boolean | null
          pattern_category?: string
          pattern_description?: string
          pattern_metadata?: Json | null
          pattern_type?: string
          pattern_value?: string | null
          period_end?: string
          period_start?: string
          representative_transactions?: Json | null
          requires_attention?: boolean | null
          risk_level?: string | null
          total_amount?: number | null
          transaction_count?: number | null
          trend_direction?: string | null
          updated_at?: string | null
          volatility?: number | null
          vs_previous_period?: number | null
          vs_same_period_last_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_spending_patterns_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_spending_patterns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_supported_banks: {
        Row: {
          bank_id: string
          bank_metadata: Json | null
          bic: string | null
          country: string
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          login_type: string
          logo: string | null
          maintenance_mode: boolean | null
          name: string
          provider_id: string
          supports_accounts: boolean | null
          supports_balance: boolean | null
          supports_business_accounts: boolean | null
          supports_payment_initiation: boolean | null
          supports_psd2: boolean | null
          supports_real_time: boolean | null
          supports_transactions: boolean | null
          supports_webhooks: boolean | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          bank_id: string
          bank_metadata?: Json | null
          bic?: string | null
          country?: string
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          login_type?: string
          logo?: string | null
          maintenance_mode?: boolean | null
          name: string
          provider_id: string
          supports_accounts?: boolean | null
          supports_balance?: boolean | null
          supports_business_accounts?: boolean | null
          supports_payment_initiation?: boolean | null
          supports_psd2?: boolean | null
          supports_real_time?: boolean | null
          supports_transactions?: boolean | null
          supports_webhooks?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          bank_id?: string
          bank_metadata?: Json | null
          bic?: string | null
          country?: string
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          login_type?: string
          logo?: string | null
          maintenance_mode?: boolean | null
          name?: string
          provider_id?: string
          supports_accounts?: boolean | null
          supports_balance?: boolean | null
          supports_business_accounts?: boolean | null
          supports_payment_initiation?: boolean | null
          supports_psd2?: boolean | null
          supports_real_time?: boolean | null
          supports_transactions?: boolean | null
          supports_webhooks?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_supported_banks_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "bank_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_sync_statistics: {
        Row: {
          accounts_synced: number | null
          api_calls_made: number | null
          company_id: string
          completed_at: string | null
          connection_id: string
          created_at: string | null
          duration_ms: number | null
          error_count: number | null
          error_details: Json | null
          id: string
          rate_limit_hits: number | null
          started_at: string
          status: string
          sync_date: string
          sync_metadata: Json | null
          sync_type: string
          transactions_added: number | null
          transactions_failed: number | null
          transactions_updated: number | null
        }
        Insert: {
          accounts_synced?: number | null
          api_calls_made?: number | null
          company_id: string
          completed_at?: string | null
          connection_id: string
          created_at?: string | null
          duration_ms?: number | null
          error_count?: number | null
          error_details?: Json | null
          id?: string
          rate_limit_hits?: number | null
          started_at?: string
          status?: string
          sync_date?: string
          sync_metadata?: Json | null
          sync_type?: string
          transactions_added?: number | null
          transactions_failed?: number | null
          transactions_updated?: number | null
        }
        Update: {
          accounts_synced?: number | null
          api_calls_made?: number | null
          company_id?: string
          completed_at?: string | null
          connection_id?: string
          created_at?: string | null
          duration_ms?: number | null
          error_count?: number | null
          error_details?: Json | null
          id?: string
          rate_limit_hits?: number | null
          started_at?: string
          status?: string
          sync_date?: string
          sync_metadata?: Json | null
          sync_type?: string
          transactions_added?: number | null
          transactions_failed?: number | null
          transactions_updated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_sync_statistics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_sync_statistics_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_token_rotation_log: {
        Row: {
          completed_at: string | null
          connection_id: string
          created_at: string | null
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          id: string
          new_token_hash: string
          old_token_hash: string
          provider_response: Json | null
          rotation_reason: string
          started_at: string
          success: boolean
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          connection_id: string
          created_at?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          new_token_hash: string
          old_token_hash: string
          provider_response?: Json | null
          rotation_reason: string
          started_at?: string
          success?: boolean
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          connection_id?: string
          created_at?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          new_token_hash?: string
          old_token_hash?: string
          provider_response?: Json | null
          rotation_reason?: string
          started_at?: string
          success?: boolean
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_token_rotation_log_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transaction_categories: {
        Row: {
          color: string | null
          company_id: string
          created_at: string | null
          credit_account: string | null
          debit_account: string | null
          default_account_code: string | null
          description: string | null
          display_name: string
          full_path: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          level: number | null
          name: string
          parent_category_id: string | null
          total_amount: number | null
          transaction_count: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string | null
          credit_account?: string | null
          debit_account?: string | null
          default_account_code?: string | null
          description?: string | null
          display_name: string
          full_path?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          level?: number | null
          name: string
          parent_category_id?: string | null
          total_amount?: number | null
          transaction_count?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string | null
          credit_account?: string | null
          debit_account?: string | null
          default_account_code?: string | null
          description?: string | null
          display_name?: string
          full_path?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          level?: number | null
          name?: string
          parent_category_id?: string | null
          total_amount?: number | null
          transaction_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transaction_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transaction_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "bank_transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          bank_reference: string | null
          category: string | null
          company_id: string
          created_at: string | null
          currency: string | null
          description: string
          id: string
          import_date: string | null
          import_source: string | null
          is_reconciled: boolean | null
          journal_entry_id: string | null
          matched_entry_id: string | null
          reconciliation_date: string | null
          reference: string | null
          status: string | null
          suggested_account_id: string | null
          transaction_date: string
          updated_at: string | null
          value_date: string | null
        }
        Insert: {
          amount: number
          bank_account_id: string
          bank_reference?: string | null
          category?: string | null
          company_id: string
          created_at?: string | null
          currency?: string | null
          description: string
          id?: string
          import_date?: string | null
          import_source?: string | null
          is_reconciled?: boolean | null
          journal_entry_id?: string | null
          matched_entry_id?: string | null
          reconciliation_date?: string | null
          reference?: string | null
          status?: string | null
          suggested_account_id?: string | null
          transaction_date: string
          updated_at?: string | null
          value_date?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string
          bank_reference?: string | null
          category?: string | null
          company_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string
          id?: string
          import_date?: string | null
          import_source?: string | null
          is_reconciled?: boolean | null
          journal_entry_id?: string | null
          matched_entry_id?: string | null
          reconciliation_date?: string | null
          reference?: string | null
          status?: string | null
          suggested_account_id?: string | null
          transaction_date?: string
          updated_at?: string | null
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_matched_entry_id_fkey"
            columns: ["matched_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_suggested_account_id_fkey"
            columns: ["suggested_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_validation_rules: {
        Row: {
          created_at: string | null
          error_message: string
          export_format_id: string
          field_name: string
          id: string
          is_active: boolean | null
          is_blocking: boolean | null
          rule_description: string | null
          rule_name: string
          severity: string | null
          updated_at: string | null
          validation_config: Json
          validation_type: string
          warning_message: string | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          export_format_id: string
          field_name: string
          id?: string
          is_active?: boolean | null
          is_blocking?: boolean | null
          rule_description?: string | null
          rule_name: string
          severity?: string | null
          updated_at?: string | null
          validation_config?: Json
          validation_type: string
          warning_message?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          export_format_id?: string
          field_name?: string
          id?: string
          is_active?: boolean | null
          is_blocking?: boolean | null
          rule_description?: string | null
          rule_name?: string
          severity?: string | null
          updated_at?: string | null
          validation_config?: Json
          validation_type?: string
          warning_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_validation_rules_export_format_id_fkey"
            columns: ["export_format_id"]
            isOneToOne: false
            referencedRelation: "bank_export_formats"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_webhook_configs: {
        Row: {
          company_id: string
          connection_id: string | null
          consecutive_failures: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_error_at: string | null
          last_event_at: string | null
          last_success_at: string | null
          max_retries: number | null
          provider_id: string
          retry_delay_seconds: number | null
          secret_token: string
          subscribed_events: Json
          timeout_seconds: number | null
          total_events_failed: number | null
          total_events_processed: number | null
          total_events_received: number | null
          updated_at: string | null
          webhook_url: string
        }
        Insert: {
          company_id: string
          connection_id?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_error_at?: string | null
          last_event_at?: string | null
          last_success_at?: string | null
          max_retries?: number | null
          provider_id: string
          retry_delay_seconds?: number | null
          secret_token: string
          subscribed_events?: Json
          timeout_seconds?: number | null
          total_events_failed?: number | null
          total_events_processed?: number | null
          total_events_received?: number | null
          updated_at?: string | null
          webhook_url: string
        }
        Update: {
          company_id?: string
          connection_id?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_error_at?: string | null
          last_event_at?: string | null
          last_success_at?: string | null
          max_retries?: number | null
          provider_id?: string
          retry_delay_seconds?: number | null
          secret_token?: string
          subscribed_events?: Json
          timeout_seconds?: number | null
          total_events_failed?: number | null
          total_events_processed?: number | null
          total_events_received?: number | null
          updated_at?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_webhook_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_webhook_configs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_webhook_configs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "bank_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_webhook_events: {
        Row: {
          connection_id: string | null
          created_at: string | null
          entities_created: number | null
          entities_updated: number | null
          error_details: Json | null
          error_message: string | null
          event_id: string
          event_source: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_completed_at: string | null
          processing_duration_ms: number | null
          processing_results: Json | null
          processing_started_at: string | null
          received_at: string
          retry_count: number | null
          signature: string | null
          status: string
          webhook_config_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          entities_created?: number | null
          entities_updated?: number | null
          error_details?: Json | null
          error_message?: string | null
          event_id: string
          event_source: string
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          processing_results?: Json | null
          processing_started_at?: string | null
          received_at?: string
          retry_count?: number | null
          signature?: string | null
          status?: string
          webhook_config_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          entities_created?: number | null
          entities_updated?: number | null
          error_details?: Json | null
          error_message?: string | null
          event_id?: string
          event_source?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          processing_results?: Json | null
          processing_started_at?: string | null
          received_at?: string
          retry_count?: number | null
          signature?: string | null
          status?: string
          webhook_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_webhook_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_webhook_events_webhook_config_id_fkey"
            columns: ["webhook_config_id"]
            isOneToOne: false
            referencedRelation: "bank_webhook_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits: {
        Row: {
          benefit_value: number | null
          category: string
          code: string
          company_cost_monthly: number | null
          company_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          eligibility_criteria: Json | null
          eligible_departments: string[] | null
          eligible_positions: string[] | null
          employee_cost_monthly: number | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          max_amount_per_year: number | null
          name: string
          provider_contact: string | null
          provider_contract_end: string | null
          provider_contract_start: string | null
          provider_name: string | null
          requires_employee_contribution: boolean | null
          social_charges_applicable: boolean | null
          tax_treatment: string | null
          updated_at: string | null
          usage_limit_per_year: number | null
        }
        Insert: {
          benefit_value?: number | null
          category: string
          code: string
          company_cost_monthly?: number | null
          company_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          eligible_departments?: string[] | null
          eligible_positions?: string[] | null
          employee_cost_monthly?: number | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          max_amount_per_year?: number | null
          name: string
          provider_contact?: string | null
          provider_contract_end?: string | null
          provider_contract_start?: string | null
          provider_name?: string | null
          requires_employee_contribution?: boolean | null
          social_charges_applicable?: boolean | null
          tax_treatment?: string | null
          updated_at?: string | null
          usage_limit_per_year?: number | null
        }
        Update: {
          benefit_value?: number | null
          category?: string
          code?: string
          company_cost_monthly?: number | null
          company_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          eligible_departments?: string[] | null
          eligible_positions?: string[] | null
          employee_cost_monthly?: number | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          max_amount_per_year?: number | null
          name?: string
          provider_contact?: string | null
          provider_contract_end?: string | null
          provider_contract_start?: string | null
          provider_name?: string | null
          requires_employee_contribution?: boolean | null
          social_charges_applicable?: boolean | null
          tax_treatment?: string | null
          updated_at?: string | null
          usage_limit_per_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "benefits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_feedback: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          created_at: string | null
          feedback_type: string
          id: string
          message: string
          page_url: string | null
          priority: string | null
          resolved_at: string | null
          screen_size: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string | null
          feedback_type: string
          id?: string
          message: string
          page_url?: string | null
          priority?: string | null
          resolved_at?: string | null
          screen_size?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string | null
          feedback_type?: string
          id?: string
          message?: string
          page_url?: string | null
          priority?: string | null
          resolved_at?: string | null
          screen_size?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      budget_approvals: {
        Row: {
          approval_level: number
          approved_at: string | null
          approver_id: string
          budget_id: string
          comments: string | null
          company_id: string
          conditions: string | null
          created_at: string | null
          deadline: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          approval_level?: number
          approved_at?: string | null
          approver_id: string
          budget_id: string
          comments?: string | null
          company_id: string
          conditions?: string | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          approval_level?: number
          approved_at?: string | null
          approver_id?: string
          budget_id?: string
          comments?: string | null
          company_id?: string
          conditions?: string | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_approvals_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_approvals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_assumptions: {
        Row: {
          budget_id: string
          category: string
          company_id: string
          confidence_level: number | null
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          impact_description: string | null
          key: string
          sensitivity_high: number | null
          sensitivity_low: number | null
          source: string | null
          unit: string | null
          updated_at: string | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          budget_id: string
          category: string
          company_id: string
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          impact_description?: string | null
          key: string
          sensitivity_high?: number | null
          sensitivity_low?: number | null
          source?: string | null
          unit?: string | null
          updated_at?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          budget_id?: string
          category?: string
          company_id?: string
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          impact_description?: string | null
          key?: string
          sensitivity_high?: number | null
          sensitivity_low?: number | null
          source?: string | null
          unit?: string | null
          updated_at?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_assumptions_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_assumptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_attachments: {
        Row: {
          budget_id: string
          category_id: string | null
          company_id: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_confidential: boolean | null
          mime_type: string | null
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          budget_id: string
          category_id?: string | null
          company_id: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_confidential?: boolean | null
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          budget_id?: string
          category_id?: string | null
          company_id?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_confidential?: boolean | null
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_attachments_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_attachments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_attachments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_by_category_monthly"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "budget_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_categories: {
        Row: {
          account_codes: string[] | null
          account_id: string | null
          annual_amount: number
          approval_status: string | null
          base_value: number | null
          budget_id: string
          category: string
          category_type: string
          company_id: string
          created_at: string | null
          created_by: string | null
          driver_type: string
          formula: string | null
          growth_rate: number | null
          id: string
          monthly_amounts: number[] | null
          notes: string | null
          responsible_person: string | null
          subcategory: string | null
          updated_at: string | null
          variable_rate: number | null
        }
        Insert: {
          account_codes?: string[] | null
          account_id?: string | null
          annual_amount?: number
          approval_status?: string | null
          base_value?: number | null
          budget_id: string
          category: string
          category_type?: string
          company_id: string
          created_at?: string | null
          created_by?: string | null
          driver_type?: string
          formula?: string | null
          growth_rate?: number | null
          id?: string
          monthly_amounts?: number[] | null
          notes?: string | null
          responsible_person?: string | null
          subcategory?: string | null
          updated_at?: string | null
          variable_rate?: number | null
        }
        Update: {
          account_codes?: string[] | null
          account_id?: string | null
          annual_amount?: number
          approval_status?: string | null
          base_value?: number | null
          budget_id?: string
          category?: string
          category_type?: string
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          driver_type?: string
          formula?: string | null
          growth_rate?: number | null
          id?: string
          monthly_amounts?: number[] | null
          notes?: string | null
          responsible_person?: string | null
          subcategory?: string | null
          updated_at?: string | null
          variable_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_category_templates: {
        Row: {
          category: string
          category_type: string
          country_code: string
          created_at: string | null
          default_account_numbers: string[] | null
          description: string | null
          display_order: number | null
          driver_type: string
          id: string
          is_active: boolean | null
          subcategory: string | null
        }
        Insert: {
          category: string
          category_type: string
          country_code: string
          created_at?: string | null
          default_account_numbers?: string[] | null
          description?: string | null
          display_order?: number | null
          driver_type?: string
          id?: string
          is_active?: boolean | null
          subcategory?: string | null
        }
        Update: {
          category?: string
          category_type?: string
          country_code?: string
          created_at?: string | null
          default_account_numbers?: string[] | null
          description?: string | null
          display_order?: number | null
          driver_type?: string
          id?: string
          is_active?: boolean | null
          subcategory?: string | null
        }
        Relationships: []
      }
      budget_comments: {
        Row: {
          budget_id: string
          category_id: string | null
          comment_type: string | null
          company_id: string
          content: string
          created_at: string | null
          created_by: string
          id: string
          is_internal: boolean | null
          is_resolved: boolean | null
          parent_comment_id: string | null
          updated_at: string | null
        }
        Insert: {
          budget_id: string
          category_id?: string | null
          comment_type?: string | null
          company_id: string
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          is_internal?: boolean | null
          is_resolved?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_id?: string
          category_id?: string | null
          comment_type?: string | null
          company_id?: string
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_internal?: boolean | null
          is_resolved?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_comments_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_comments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_comments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_by_category_monthly"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "budget_comments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "budget_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_forecasts: {
        Row: {
          accuracy_score: number | null
          base_period_end: string
          base_period_start: string
          budget_id: string
          company_id: string
          confidence_intervals: Json | null
          created_at: string | null
          created_by: string | null
          forecast_horizon: number
          forecast_method: string
          forecast_type: string
          forecasted_data: Json
          id: string
          mae: number | null
          mape: number | null
          methodology_notes: string | null
          updated_at: string | null
        }
        Insert: {
          accuracy_score?: number | null
          base_period_end: string
          base_period_start: string
          budget_id: string
          company_id: string
          confidence_intervals?: Json | null
          created_at?: string | null
          created_by?: string | null
          forecast_horizon: number
          forecast_method: string
          forecast_type: string
          forecasted_data?: Json
          id?: string
          mae?: number | null
          mape?: number | null
          methodology_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          accuracy_score?: number | null
          base_period_end?: string
          base_period_start?: string
          budget_id?: string
          company_id?: string
          confidence_intervals?: Json | null
          created_at?: string | null
          created_by?: string | null
          forecast_horizon?: number
          forecast_method?: string
          forecast_type?: string
          forecasted_data?: Json
          id?: string
          mae?: number | null
          mape?: number | null
          methodology_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_forecasts_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_forecasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_hypotheses: {
        Row: {
          budget_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          value: string
        }
        Insert: {
          budget_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          value: string
        }
        Update: {
          budget_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_hypotheses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          account_id: string
          account_name: string | null
          account_number: string | null
          annual_amount: number | null
          april: number | null
          august: number | null
          budget_id: string
          created_at: string | null
          december: number | null
          february: number | null
          growth_rate: number | null
          id: string
          january: number | null
          july: number | null
          june: number | null
          line_type: string
          march: number | null
          may: number | null
          monthly_distribution: number[] | null
          notes: string | null
          november: number | null
          october: number | null
          september: number | null
          subcategory: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          account_name?: string | null
          account_number?: string | null
          annual_amount?: number | null
          april?: number | null
          august?: number | null
          budget_id: string
          created_at?: string | null
          december?: number | null
          february?: number | null
          growth_rate?: number | null
          id?: string
          january?: number | null
          july?: number | null
          june?: number | null
          line_type: string
          march?: number | null
          may?: number | null
          monthly_distribution?: number[] | null
          notes?: string | null
          november?: number | null
          october?: number | null
          september?: number | null
          subcategory?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          account_name?: string | null
          account_number?: string | null
          annual_amount?: number | null
          april?: number | null
          august?: number | null
          budget_id?: string
          created_at?: string | null
          december?: number | null
          february?: number | null
          growth_rate?: number | null
          id?: string
          january?: number | null
          july?: number | null
          june?: number | null
          line_type?: string
          march?: number | null
          may?: number | null
          monthly_distribution?: number[] | null
          notes?: string | null
          november?: number | null
          october?: number | null
          september?: number | null
          subcategory?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_notifications: {
        Row: {
          action_url: string | null
          budget_id: string
          company_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          is_sent: boolean | null
          message: string
          notification_type: string
          priority: string | null
          send_at: string | null
          sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          budget_id: string
          company_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          message: string
          notification_type: string
          priority?: string | null
          send_at?: string | null
          sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          budget_id?: string
          company_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          message?: string
          notification_type?: string
          priority?: string | null
          send_at?: string | null
          sent_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_notifications_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_scenarios: {
        Row: {
          budget_id: string
          calculated_expenses: number | null
          calculated_profit: number | null
          calculated_revenue: number | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          expense_adjustment: number | null
          growth_factor: number | null
          id: string
          name: string
          probability: number | null
          revenue_adjustment: number | null
          scenario_assumptions: Json | null
          scenario_type: string | null
          updated_at: string | null
        }
        Insert: {
          budget_id: string
          calculated_expenses?: number | null
          calculated_profit?: number | null
          calculated_revenue?: number | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_adjustment?: number | null
          growth_factor?: number | null
          id?: string
          name: string
          probability?: number | null
          revenue_adjustment?: number | null
          scenario_assumptions?: Json | null
          scenario_type?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_id?: string
          calculated_expenses?: number | null
          calculated_profit?: number | null
          calculated_revenue?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_adjustment?: number | null
          growth_factor?: number | null
          id?: string
          name?: string
          probability?: number | null
          revenue_adjustment?: number | null
          scenario_assumptions?: Json | null
          scenario_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_scenarios_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_templates: {
        Row: {
          company_id: string | null
          company_size: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          industry: string | null
          is_default: boolean | null
          is_public: boolean | null
          name: string
          tags: string[] | null
          template_type: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          company_id?: string | null
          company_size?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_default?: boolean | null
          is_public?: boolean | null
          name: string
          tags?: string[] | null
          template_type?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          company_id?: string | null
          company_size?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_default?: boolean | null
          is_public?: boolean | null
          name?: string
          tags?: string[] | null
          template_type?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_variance_analysis: {
        Row: {
          actual_amount: number
          analysis_period: string
          analyzed_by: string | null
          budget_amount: number
          budget_id: string
          category_id: string | null
          company_id: string
          corrective_actions: string | null
          created_at: string | null
          explanation: string | null
          id: string
          period_end: string
          period_start: string
          trend: string | null
          updated_at: string | null
          variance_amount: number | null
          variance_percentage: number | null
          ytd_actual: number | null
          ytd_budget: number | null
          ytd_variance_amount: number | null
          ytd_variance_percentage: number | null
        }
        Insert: {
          actual_amount?: number
          analysis_period: string
          analyzed_by?: string | null
          budget_amount?: number
          budget_id: string
          category_id?: string | null
          company_id: string
          corrective_actions?: string | null
          created_at?: string | null
          explanation?: string | null
          id?: string
          period_end: string
          period_start: string
          trend?: string | null
          updated_at?: string | null
          variance_amount?: number | null
          variance_percentage?: number | null
          ytd_actual?: number | null
          ytd_budget?: number | null
          ytd_variance_amount?: number | null
          ytd_variance_percentage?: number | null
        }
        Update: {
          actual_amount?: number
          analysis_period?: string
          analyzed_by?: string | null
          budget_amount?: number
          budget_id?: string
          category_id?: string | null
          company_id?: string
          corrective_actions?: string | null
          created_at?: string | null
          explanation?: string | null
          id?: string
          period_end?: string
          period_start?: string
          trend?: string | null
          updated_at?: string | null
          variance_amount?: number | null
          variance_percentage?: number | null
          ytd_actual?: number | null
          ytd_budget?: number | null
          ytd_variance_amount?: number | null
          ytd_variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_variance_analysis_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_variance_analysis_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_variance_analysis_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_by_category_monthly"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "budget_variance_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_versions: {
        Row: {
          budget_id: string | null
          comment: string | null
          created_at: string | null
          created_by: string | null
          id: string
          snapshot_data: Json
          version_number: number
        }
        Insert: {
          budget_id?: string | null
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          snapshot_data: Json
          version_number: number
        }
        Update: {
          budget_id?: string | null
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          snapshot_data?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_versions_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget_year: number
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          name: string
          net_result: number | null
          start_date: string
          status: string | null
          total_expenses: number | null
          total_revenue: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget_year: number
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          name: string
          net_result?: number | null
          start_date: string
          status?: string | null
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget_year?: number
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          net_result?: number | null
          start_date?: string
          status?: string | null
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_settings: {
        Row: {
          cache_name: string
          cache_type: string
          company_id: string | null
          compression_enabled: boolean | null
          created_at: string | null
          eviction_policy: string | null
          hit_rate_threshold: number | null
          id: string
          is_enabled: boolean | null
          max_size_mb: number | null
          ttl_seconds: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cache_name: string
          cache_type: string
          company_id?: string | null
          compression_enabled?: boolean | null
          created_at?: string | null
          eviction_policy?: string | null
          hit_rate_threshold?: number | null
          id?: string
          is_enabled?: boolean | null
          max_size_mb?: number | null
          ttl_seconds?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cache_name?: string
          cache_type?: string
          company_id?: string | null
          compression_enabled?: boolean | null
          created_at?: string | null
          eviction_policy?: string | null
          hit_rate_threshold?: number | null
          id?: string
          is_enabled?: boolean | null
          max_size_mb?: number | null
          ttl_seconds?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cache_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      career_progression: {
        Row: {
          announcement_date: string | null
          approved_by: string
          company_id: string
          created_at: string | null
          effective_date: string
          employee_id: string
          from_position_id: string | null
          hr_approved_by: string | null
          id: string
          new_salary: number | null
          performance_rating: number | null
          previous_salary: number | null
          probation_period_months: number | null
          progression_type: string
          reason: string | null
          salary_increase_percentage: number | null
          to_position_id: string | null
          training_completion_deadline: string | null
          training_required: boolean | null
          updated_at: string | null
        }
        Insert: {
          announcement_date?: string | null
          approved_by: string
          company_id: string
          created_at?: string | null
          effective_date: string
          employee_id: string
          from_position_id?: string | null
          hr_approved_by?: string | null
          id?: string
          new_salary?: number | null
          performance_rating?: number | null
          previous_salary?: number | null
          probation_period_months?: number | null
          progression_type: string
          reason?: string | null
          salary_increase_percentage?: number | null
          to_position_id?: string | null
          training_completion_deadline?: string | null
          training_required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          announcement_date?: string | null
          approved_by?: string
          company_id?: string
          created_at?: string | null
          effective_date?: string
          employee_id?: string
          from_position_id?: string | null
          hr_approved_by?: string | null
          id?: string
          new_salary?: number | null
          performance_rating?: number | null
          previous_salary?: number | null
          probation_period_months?: number | null
          progression_type?: string
          reason?: string | null
          salary_increase_percentage?: number | null
          to_position_id?: string | null
          training_completion_deadline?: string | null
          training_required?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_progression_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_progression_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_progression_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_progression_from_position_id_fkey"
            columns: ["from_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_progression_hr_approved_by_fkey"
            columns: ["hr_approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_progression_to_position_id_fkey"
            columns: ["to_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_predictions: {
        Row: {
          actual_balance: number | null
          actual_expenses: number | null
          actual_income: number | null
          company_id: string
          confidence_score: number | null
          created_at: string | null
          historical_data_points: number | null
          id: string
          model_used: string | null
          predicted_balance: number | null
          predicted_expenses: number | null
          predicted_income: number | null
          prediction_date: string
          prediction_factors: Json | null
          prediction_month: string
          seasonality_factor: number | null
          trend_direction: string | null
          trend_factor: number | null
          updated_at: string | null
          variance_from_actual: number | null
        }
        Insert: {
          actual_balance?: number | null
          actual_expenses?: number | null
          actual_income?: number | null
          company_id: string
          confidence_score?: number | null
          created_at?: string | null
          historical_data_points?: number | null
          id?: string
          model_used?: string | null
          predicted_balance?: number | null
          predicted_expenses?: number | null
          predicted_income?: number | null
          prediction_date: string
          prediction_factors?: Json | null
          prediction_month: string
          seasonality_factor?: number | null
          trend_direction?: string | null
          trend_factor?: number | null
          updated_at?: string | null
          variance_from_actual?: number | null
        }
        Update: {
          actual_balance?: number | null
          actual_expenses?: number | null
          actual_income?: number | null
          company_id?: string
          confidence_score?: number | null
          created_at?: string | null
          historical_data_points?: number | null
          id?: string
          model_used?: string | null
          predicted_balance?: number | null
          predicted_expenses?: number | null
          predicted_income?: number | null
          prediction_date?: string
          prediction_factors?: Json | null
          prediction_month?: string
          seasonality_factor?: number | null
          trend_direction?: string | null
          trend_factor?: number | null
          updated_at?: string | null
          variance_from_actual?: number | null
        }
        Relationships: []
      }
      categorization_rules: {
        Row: {
          account_id: string | null
          company_id: string | null
          created_at: string | null
          created_from_transaction_id: string | null
          description_template: string | null
          id: string
          is_regex: boolean | null
          pattern: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_from_transaction_id?: string | null
          description_template?: string | null
          id?: string
          is_regex?: boolean | null
          pattern: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_from_transaction_id?: string | null
          description_template?: string | null
          id?: string
          is_regex?: boolean | null
          pattern?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorization_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorization_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorization_rules_created_from_transaction_id_fkey"
            columns: ["created_from_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      category_account_map: {
        Row: {
          account_code: string
          analytic_tag_id: string | null
          category_id: string
          company_id: string
          created_at: string
          id: string
        }
        Insert: {
          account_code: string
          analytic_tag_id?: string | null
          category_id: string
          company_id: string
          created_at?: string
          id?: string
        }
        Update: {
          account_code?: string
          analytic_tag_id?: string | null
          category_id?: string
          company_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_account_map_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_account_map_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_by_category_monthly"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_account_map_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_class: number | null
          account_name: string
          account_number: string
          account_type: string
          balance_credit: number | null
          balance_debit: number | null
          budget_category: string | null
          company_id: string
          created_at: string | null
          current_balance: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_detail_account: boolean | null
          level: number | null
          parent_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_class?: number | null
          account_name: string
          account_number: string
          account_type: string
          balance_credit?: number | null
          balance_debit?: number | null
          budget_category?: string | null
          company_id: string
          created_at?: string | null
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_detail_account?: boolean | null
          level?: number | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_class?: number | null
          account_name?: string
          account_number?: string
          account_type?: string
          balance_credit?: number | null
          balance_debit?: number | null
          budget_category?: string | null
          company_id?: string
          created_at?: string | null
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_detail_account?: boolean | null
          level?: number | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts_templates: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          budget_category_mapping: string | null
          class: number
          country_code: string
          created_at: string | null
          description: string | null
          id: string
          is_detail_account: boolean | null
          level: number
          parent_account_number: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          budget_category_mapping?: string | null
          class: number
          country_code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_detail_account?: boolean | null
          level: number
          parent_account_number?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          budget_category_mapping?: string | null
          class?: number
          country_code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_detail_account?: boolean | null
          level?: number
          parent_account_number?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          accounting_method: string | null
          accounting_standard: string | null
          active_modules: string | null
          activity_sector: string | null
          address: string | null
          business_key: string | null
          ceo_name: string | null
          ceo_title: string | null
          city: string | null
          company_size: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          created_by: string | null
          data_quality_score: number | null
          default_currency: string | null
          default_locale: string | null
          description: string | null
          email: string | null
          employee_count: string | null
          fiscal_year_start: string | null
          fiscal_year_start_day: number | null
          fiscal_year_start_month: number | null
          fiscal_year_type: string | null
          id: string
          industry_type: string | null
          is_active: boolean | null
          is_personal: boolean | null
          last_validation_date: string | null
          legal_form: string | null
          legal_name: string | null
          logo: string | null
          merged_into_company_id: string | null
          name: string
          normalized_name: string | null
          onboarding_completed_at: string | null
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          registration_date: string | null
          registration_number: string | null
          sector: string | null
          share_capital: number | null
          siren: string | null
          siret: string | null
          status: string | null
          tax_number: string | null
          timezone: string | null
          updated_at: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          accounting_method?: string | null
          accounting_standard?: string | null
          active_modules?: string | null
          activity_sector?: string | null
          address?: string | null
          business_key?: string | null
          ceo_name?: string | null
          ceo_title?: string | null
          city?: string | null
          company_size?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          data_quality_score?: number | null
          default_currency?: string | null
          default_locale?: string | null
          description?: string | null
          email?: string | null
          employee_count?: string | null
          fiscal_year_start?: string | null
          fiscal_year_start_day?: number | null
          fiscal_year_start_month?: number | null
          fiscal_year_type?: string | null
          id?: string
          industry_type?: string | null
          is_active?: boolean | null
          is_personal?: boolean | null
          last_validation_date?: string | null
          legal_form?: string | null
          legal_name?: string | null
          logo?: string | null
          merged_into_company_id?: string | null
          name: string
          normalized_name?: string | null
          onboarding_completed_at?: string | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_date?: string | null
          registration_number?: string | null
          sector?: string | null
          share_capital?: number | null
          siren?: string | null
          siret?: string | null
          status?: string | null
          tax_number?: string | null
          timezone?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          accounting_method?: string | null
          accounting_standard?: string | null
          active_modules?: string | null
          activity_sector?: string | null
          address?: string | null
          business_key?: string | null
          ceo_name?: string | null
          ceo_title?: string | null
          city?: string | null
          company_size?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          data_quality_score?: number | null
          default_currency?: string | null
          default_locale?: string | null
          description?: string | null
          email?: string | null
          employee_count?: string | null
          fiscal_year_start?: string | null
          fiscal_year_start_day?: number | null
          fiscal_year_start_month?: number | null
          fiscal_year_type?: string | null
          id?: string
          industry_type?: string | null
          is_active?: boolean | null
          is_personal?: boolean | null
          last_validation_date?: string | null
          legal_form?: string | null
          legal_name?: string | null
          logo?: string | null
          merged_into_company_id?: string | null
          name?: string
          normalized_name?: string | null
          onboarding_completed_at?: string | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_date?: string | null
          registration_number?: string | null
          sector?: string | null
          share_capital?: number | null
          siren?: string | null
          siret?: string | null
          status?: string | null
          tax_number?: string | null
          timezone?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_merged_into_company_id_fkey"
            columns: ["merged_into_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_deletion_requests: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          company_id: string
          created_at: string | null
          export_download_url: string | null
          export_generated_at: string | null
          export_requested: boolean | null
          id: string
          legal_archive_created: boolean | null
          legal_archive_location: string | null
          processed_at: string | null
          received_approvals: Json | null
          requested_at: string | null
          requested_by: string
          required_approvals: Json
          scheduled_deletion_at: string
          status: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          company_id: string
          created_at?: string | null
          export_download_url?: string | null
          export_generated_at?: string | null
          export_requested?: boolean | null
          id?: string
          legal_archive_created?: boolean | null
          legal_archive_location?: string | null
          processed_at?: string | null
          received_approvals?: Json | null
          requested_at?: string | null
          requested_by: string
          required_approvals?: Json
          scheduled_deletion_at?: string
          status?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          company_id?: string
          created_at?: string | null
          export_download_url?: string | null
          export_generated_at?: string | null
          export_requested?: boolean | null
          id?: string
          legal_archive_created?: boolean | null
          legal_archive_location?: string | null
          processed_at?: string | null
          received_approvals?: Json | null
          requested_at?: string | null
          requested_by?: string
          required_approvals?: Json
          scheduled_deletion_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_deletion_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_duplicates: {
        Row: {
          created_at: string | null
          detection_method: string
          duplicate_company_id: string
          id: string
          primary_company_id: string
          resolved_at: string | null
          resolved_by: string | null
          similarity_score: number
          status: string | null
        }
        Insert: {
          created_at?: string | null
          detection_method?: string
          duplicate_company_id: string
          id?: string
          primary_company_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          similarity_score?: number
          status?: string | null
        }
        Update: {
          created_at?: string | null
          detection_method?: string
          duplicate_company_id?: string
          id?: string
          primary_company_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          similarity_score?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_duplicates_duplicate_company_id_fkey"
            columns: ["duplicate_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_duplicates_primary_company_id_fkey"
            columns: ["primary_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_features: {
        Row: {
          auto_renew: boolean | null
          company_id: string
          configuration: Json | null
          conflicting_features: string[] | null
          created_at: string | null
          current_usage: number | null
          disable_reason: string | null
          disabled_at: string | null
          disabled_by: string | null
          enabled_at: string | null
          enabled_by: string | null
          expires_at: string | null
          feature_category: string | null
          feature_name: string
          id: string
          is_enabled: boolean | null
          last_modified_by: string | null
          last_reset_date: string | null
          license_tier: string | null
          minimum_plan: string | null
          modification_history: Json | null
          required_features: string[] | null
          reset_period: string | null
          updated_at: string | null
          usage_limit: number | null
        }
        Insert: {
          auto_renew?: boolean | null
          company_id: string
          configuration?: Json | null
          conflicting_features?: string[] | null
          created_at?: string | null
          current_usage?: number | null
          disable_reason?: string | null
          disabled_at?: string | null
          disabled_by?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          expires_at?: string | null
          feature_category?: string | null
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          last_modified_by?: string | null
          last_reset_date?: string | null
          license_tier?: string | null
          minimum_plan?: string | null
          modification_history?: Json | null
          required_features?: string[] | null
          reset_period?: string | null
          updated_at?: string | null
          usage_limit?: number | null
        }
        Update: {
          auto_renew?: boolean | null
          company_id?: string
          configuration?: Json | null
          conflicting_features?: string[] | null
          created_at?: string | null
          current_usage?: number | null
          disable_reason?: string | null
          disabled_at?: string | null
          disabled_by?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          expires_at?: string | null
          feature_category?: string | null
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          last_modified_by?: string | null
          last_reset_date?: string | null
          license_tier?: string | null
          minimum_plan?: string | null
          modification_history?: Json | null
          required_features?: string[] | null
          reset_period?: string | null
          updated_at?: string | null
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_features_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_fiscal_settings: {
        Row: {
          accounting_standard: string
          annual_financial_statements: boolean | null
          audit_required: boolean | null
          building_depreciation_rate: number | null
          company_id: string
          configuration_date: string | null
          corporate_tax_account: string | null
          country_code: string
          created_at: string | null
          custom_tax_rules: Json | null
          default_currency: string
          employer_contribution_rate: number | null
          equipment_depreciation_rate: number | null
          fiscal_year_end: string
          id: string
          income_tax_rate: number | null
          is_active: boolean | null
          minimum_capital: number | null
          monthly_vat_return: boolean | null
          payroll_tax_account: string | null
          pension_rate: number | null
          quarterly_tax_return: boolean | null
          regional_tax_settings: Json | null
          social_contributions_account: string | null
          social_security_rate: number | null
          software_depreciation_rate: number | null
          updated_at: string | null
          vat_collected_account: string | null
          vat_deductible_account: string | null
          vat_exempt_available: boolean | null
          vat_reduced_rate: number | null
          vat_standard_rate: number
          vat_zero_rate: number | null
          vehicle_depreciation_rate: number | null
        }
        Insert: {
          accounting_standard: string
          annual_financial_statements?: boolean | null
          audit_required?: boolean | null
          building_depreciation_rate?: number | null
          company_id: string
          configuration_date?: string | null
          corporate_tax_account?: string | null
          country_code: string
          created_at?: string | null
          custom_tax_rules?: Json | null
          default_currency: string
          employer_contribution_rate?: number | null
          equipment_depreciation_rate?: number | null
          fiscal_year_end?: string
          id?: string
          income_tax_rate?: number | null
          is_active?: boolean | null
          minimum_capital?: number | null
          monthly_vat_return?: boolean | null
          payroll_tax_account?: string | null
          pension_rate?: number | null
          quarterly_tax_return?: boolean | null
          regional_tax_settings?: Json | null
          social_contributions_account?: string | null
          social_security_rate?: number | null
          software_depreciation_rate?: number | null
          updated_at?: string | null
          vat_collected_account?: string | null
          vat_deductible_account?: string | null
          vat_exempt_available?: boolean | null
          vat_reduced_rate?: number | null
          vat_standard_rate?: number
          vat_zero_rate?: number | null
          vehicle_depreciation_rate?: number | null
        }
        Update: {
          accounting_standard?: string
          annual_financial_statements?: boolean | null
          audit_required?: boolean | null
          building_depreciation_rate?: number | null
          company_id?: string
          configuration_date?: string | null
          corporate_tax_account?: string | null
          country_code?: string
          created_at?: string | null
          custom_tax_rules?: Json | null
          default_currency?: string
          employer_contribution_rate?: number | null
          equipment_depreciation_rate?: number | null
          fiscal_year_end?: string
          id?: string
          income_tax_rate?: number | null
          is_active?: boolean | null
          minimum_capital?: number | null
          monthly_vat_return?: boolean | null
          payroll_tax_account?: string | null
          pension_rate?: number | null
          quarterly_tax_return?: boolean | null
          regional_tax_settings?: Json | null
          social_contributions_account?: string | null
          social_security_rate?: number | null
          software_depreciation_rate?: number | null
          updated_at?: string | null
          vat_collected_account?: string | null
          vat_deductible_account?: string | null
          vat_exempt_available?: boolean | null
          vat_reduced_rate?: number | null
          vat_standard_rate?: number
          vat_zero_rate?: number | null
          vehicle_depreciation_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_fiscal_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invitations: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invitation_token: string | null
          invited_at: string | null
          invited_by: string
          permissions: Json | null
          rejected_at: string | null
          role: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string | null
          invited_at?: string | null
          invited_by: string
          permissions?: Json | null
          rejected_at?: string | null
          role: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string
          permissions?: Json | null
          rejected_at?: string | null
          role?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_merges: {
        Row: {
          created_at: string | null
          executed_at: string | null
          id: string
          master_company_id: string
          merge_reason: string
          merged_company_id: string
          requested_by: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          executed_at?: string | null
          id?: string
          master_company_id: string
          merge_reason?: string
          merged_company_id: string
          requested_by: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          executed_at?: string | null
          id?: string
          master_company_id?: string
          merge_reason?: string
          merged_company_id?: string
          requested_by?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_merges_master_company_id_fkey"
            columns: ["master_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_merges_merged_company_id_fkey"
            columns: ["merged_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_modules: {
        Row: {
          access_level: string | null
          activated_at: string | null
          activated_by: string | null
          company_id: string
          created_at: string | null
          custom_color: string | null
          custom_description: string | null
          custom_icon: string | null
          custom_name: string | null
          custom_settings: Json | null
          display_order: number | null
          expires_at: string | null
          id: string
          is_enabled: boolean | null
          is_visible: boolean | null
          last_used_at: string | null
          license_type: string | null
          module_key: string
          module_name: string
          module_priority: number | null
          storage_quota_gb: number | null
          updated_at: string | null
          usage_count: number | null
          user_limit: number | null
        }
        Insert: {
          access_level?: string | null
          activated_at?: string | null
          activated_by?: string | null
          company_id: string
          created_at?: string | null
          custom_color?: string | null
          custom_description?: string | null
          custom_icon?: string | null
          custom_name?: string | null
          custom_settings?: Json | null
          display_order?: number | null
          expires_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_visible?: boolean | null
          last_used_at?: string | null
          license_type?: string | null
          module_key: string
          module_name: string
          module_priority?: number | null
          storage_quota_gb?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_limit?: number | null
        }
        Update: {
          access_level?: string | null
          activated_at?: string | null
          activated_by?: string | null
          company_id?: string
          created_at?: string | null
          custom_color?: string | null
          custom_description?: string | null
          custom_icon?: string | null
          custom_name?: string | null
          custom_settings?: Json | null
          display_order?: number | null
          expires_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_visible?: boolean | null
          last_used_at?: string | null
          license_type?: string | null
          module_key?: string
          module_name?: string
          module_priority?: number | null
          storage_quota_gb?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: Json | null
          business_hours: Json | null
          business_type: string | null
          company_id: string
          company_logo_url: string | null
          company_name: string
          contact_info: Json | null
          created_at: string | null
          date_format: string | null
          default_currency: string
          fiscal_year_start: number | null
          id: string
          number_format: Json | null
          tax_settings: Json | null
          timezone: string | null
          updated_at: string | null
          updated_by: string | null
          website_url: string | null
        }
        Insert: {
          address?: Json | null
          business_hours?: Json | null
          business_type?: string | null
          company_id: string
          company_logo_url?: string | null
          company_name: string
          contact_info?: Json | null
          created_at?: string | null
          date_format?: string | null
          default_currency?: string
          fiscal_year_start?: number | null
          id?: string
          number_format?: Json | null
          tax_settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website_url?: string | null
        }
        Update: {
          address?: Json | null
          business_hours?: Json | null
          business_type?: string | null
          company_id?: string
          company_logo_url?: string | null
          company_name?: string
          contact_info?: Json | null
          created_at?: string | null
          date_format?: string | null
          default_currency?: string
          fiscal_year_start?: number | null
          id?: string
          number_format?: Json | null
          tax_settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_sizes_catalog: {
        Row: {
          category: string
          created_at: string | null
          criteria_description: string | null
          default_modules: string[] | null
          description: string | null
          employee_max: number | null
          employee_min: number | null
          eu_classification: boolean | null
          examples: string[] | null
          id: string
          is_active: boolean | null
          priority_order: number | null
          recommended_plan: string | null
          revenue_max_eur: number | null
          revenue_min_eur: number | null
          size_code: string
          size_name: string
          size_name_english: string | null
          storage_quota_gb: number | null
          updated_at: string | null
          user_limit: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria_description?: string | null
          default_modules?: string[] | null
          description?: string | null
          employee_max?: number | null
          employee_min?: number | null
          eu_classification?: boolean | null
          examples?: string[] | null
          id?: string
          is_active?: boolean | null
          priority_order?: number | null
          recommended_plan?: string | null
          revenue_max_eur?: number | null
          revenue_min_eur?: number | null
          size_code: string
          size_name: string
          size_name_english?: string | null
          storage_quota_gb?: number | null
          updated_at?: string | null
          user_limit?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria_description?: string | null
          default_modules?: string[] | null
          description?: string | null
          employee_max?: number | null
          employee_min?: number | null
          eu_classification?: boolean | null
          examples?: string[] | null
          id?: string
          is_active?: boolean | null
          priority_order?: number | null
          recommended_plan?: string | null
          revenue_max_eur?: number | null
          revenue_min_eur?: number | null
          size_code?: string
          size_name?: string
          size_name_english?: string | null
          storage_quota_gb?: number | null
          updated_at?: string | null
          user_limit?: number | null
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          is_admin: boolean | null
          is_owner: boolean | null
          joined_at: string | null
          left_at: string | null
          permissions: Json | null
          role: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_admin?: boolean | null
          is_owner?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_admin?: boolean | null
          is_owner?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          created_at: string | null
          critical_issues: number | null
          executive_summary: string | null
          findings: string[] | null
          generated_at: string | null
          generated_by: string
          id: string
          issues_found: number | null
          period_end: string
          period_start: string
          recipients: string[] | null
          recommendations: string[] | null
          report_data: Json
          report_name: string
          report_type: string
          shared_externally: boolean | null
          status: string | null
          total_records_analyzed: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string | null
          critical_issues?: number | null
          executive_summary?: string | null
          findings?: string[] | null
          generated_at?: string | null
          generated_by: string
          id?: string
          issues_found?: number | null
          period_end: string
          period_start: string
          recipients?: string[] | null
          recommendations?: string[] | null
          report_data: Json
          report_name: string
          report_type: string
          shared_externally?: boolean | null
          status?: string | null
          total_records_analyzed?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string | null
          critical_issues?: number | null
          executive_summary?: string | null
          findings?: string[] | null
          generated_at?: string | null
          generated_by?: string
          id?: string
          issues_found?: number | null
          period_end?: string
          period_start?: string
          recipients?: string[] | null
          recommendations?: string[] | null
          report_data?: Json
          report_name?: string
          report_type?: string
          shared_externally?: boolean | null
          status?: string | null
          total_records_analyzed?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      configuration_categories: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          parent_id: string | null
          permissions: Json | null
          sort_order: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          parent_id?: string | null
          permissions?: Json | null
          sort_order?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          parent_id?: string | null
          permissions?: Json | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "configuration_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuration_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "configuration_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string
          created_at: string | null
          customer_id: string | null
          department: string | null
          email: string | null
          first_name: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          job_title: string | null
          last_name: string
          mobile: string | null
          notes: string | null
          phone: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          customer_id?: string | null
          department?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          job_title?: string | null
          last_name: string
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          customer_id?: string | null
          department?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          job_title?: string | null
          last_name?: string
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_alerts: {
        Row: {
          acknowledged_by: string | null
          action_description: string | null
          action_required: boolean | null
          alert_type: string
          assigned_to: string | null
          auto_generated: boolean | null
          company_id: string
          contract_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          email_sent: boolean | null
          id: string
          in_app_sent: boolean | null
          max_occurrences: number | null
          message: string
          metadata: Json | null
          occurrence_count: number | null
          priority: string | null
          recurrence_rule: string | null
          related_data: Json | null
          resolved_by: string | null
          resolved_date: string | null
          severity: string | null
          slack_sent: boolean | null
          sms_sent: boolean | null
          snooze_until: string | null
          status: string | null
          title: string
          trigger_date: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_by?: string | null
          action_description?: string | null
          action_required?: boolean | null
          alert_type: string
          assigned_to?: string | null
          auto_generated?: boolean | null
          company_id: string
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          email_sent?: boolean | null
          id?: string
          in_app_sent?: boolean | null
          max_occurrences?: number | null
          message: string
          metadata?: Json | null
          occurrence_count?: number | null
          priority?: string | null
          recurrence_rule?: string | null
          related_data?: Json | null
          resolved_by?: string | null
          resolved_date?: string | null
          severity?: string | null
          slack_sent?: boolean | null
          sms_sent?: boolean | null
          snooze_until?: string | null
          status?: string | null
          title: string
          trigger_date?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_by?: string | null
          action_description?: string | null
          action_required?: boolean | null
          alert_type?: string
          assigned_to?: string | null
          auto_generated?: boolean | null
          company_id?: string
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          email_sent?: boolean | null
          id?: string
          in_app_sent?: boolean | null
          max_occurrences?: number | null
          message?: string
          metadata?: Json | null
          occurrence_count?: number | null
          priority?: string | null
          recurrence_rule?: string | null
          related_data?: Json | null
          resolved_by?: string | null
          resolved_date?: string | null
          severity?: string | null
          slack_sent?: boolean | null
          sms_sent?: boolean | null
          snooze_until?: string | null
          status?: string | null
          title?: string
          trigger_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_alerts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_alerts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_amendments: {
        Row: {
          amendment_date: string | null
          amendment_number: string
          amendment_type: string
          approval_required: boolean | null
          approved_at: string | null
          approved_by: string | null
          changes_summary: string
          client_signature_date: string | null
          client_signed: boolean | null
          company_id: string
          company_signature_date: string | null
          company_signed: boolean | null
          contract_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          document_path: string | null
          effective_date: string
          expiry_date: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          reason: string | null
          rejection_reason: string | null
          signed_document_path: string | null
          status: string | null
          title: string
          updated_at: string | null
          value_change: number | null
        }
        Insert: {
          amendment_date?: string | null
          amendment_number: string
          amendment_type: string
          approval_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          changes_summary: string
          client_signature_date?: string | null
          client_signed?: boolean | null
          company_id: string
          company_signature_date?: string | null
          company_signed?: boolean | null
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          document_path?: string | null
          effective_date: string
          expiry_date?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          rejection_reason?: string | null
          signed_document_path?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          value_change?: number | null
        }
        Update: {
          amendment_date?: string | null
          amendment_number?: string
          amendment_type?: string
          approval_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          changes_summary?: string
          client_signature_date?: string | null
          client_signed?: boolean | null
          company_id?: string
          company_signature_date?: string | null
          company_signed?: boolean | null
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          document_path?: string | null
          effective_date?: string
          expiry_date?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          rejection_reason?: string | null
          signed_document_path?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          value_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_amendments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_amendments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_amendments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_amendments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_approvals: {
        Row: {
          amendment_id: string | null
          approval_step: number
          approval_threshold: number | null
          approver_id: string
          approver_role: string | null
          business_rules: Json | null
          can_delegate: boolean | null
          comments: string | null
          company_id: string
          conditions: string | null
          contract_id: string | null
          created_at: string | null
          decision_date: string | null
          delegated_to: string | null
          escalated_at: string | null
          escalated_to: string | null
          id: string
          is_mandatory: boolean | null
          notified_at: string | null
          reminder_sent_at: string | null
          status: string | null
          step_name: string
          updated_at: string | null
        }
        Insert: {
          amendment_id?: string | null
          approval_step: number
          approval_threshold?: number | null
          approver_id: string
          approver_role?: string | null
          business_rules?: Json | null
          can_delegate?: boolean | null
          comments?: string | null
          company_id: string
          conditions?: string | null
          contract_id?: string | null
          created_at?: string | null
          decision_date?: string | null
          delegated_to?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          is_mandatory?: boolean | null
          notified_at?: string | null
          reminder_sent_at?: string | null
          status?: string | null
          step_name: string
          updated_at?: string | null
        }
        Update: {
          amendment_id?: string | null
          approval_step?: number
          approval_threshold?: number | null
          approver_id?: string
          approver_role?: string | null
          business_rules?: Json | null
          can_delegate?: boolean | null
          comments?: string | null
          company_id?: string
          conditions?: string | null
          contract_id?: string | null
          created_at?: string | null
          decision_date?: string | null
          delegated_to?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          is_mandatory?: boolean | null
          notified_at?: string | null
          reminder_sent_at?: string | null
          status?: string | null
          step_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_approvals_amendment_id_fkey"
            columns: ["amendment_id"]
            isOneToOne: false
            referencedRelation: "contract_amendments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_approvals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_approvals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_approvals_delegated_to_fkey"
            columns: ["delegated_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_approvals_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_billing: {
        Row: {
          adjustments: number | null
          auto_generate: boolean | null
          base_amount: number
          billing_currency: string | null
          billing_details: Json | null
          billing_frequency: string | null
          billing_period_end: string
          billing_period_start: string
          billing_reference: string
          billing_status: string | null
          billing_template_id: string | null
          billing_type: string
          bonuses: number | null
          calculation_method: string | null
          company_id: string
          contract_id: string
          created_at: string | null
          created_by: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          is_recurring: boolean | null
          milestone_achieved: boolean | null
          next_billing_date: string | null
          paid_amount: number | null
          paid_date: string | null
          penalties: number | null
          rfa_amount: number | null
          rfa_applicable: boolean | null
          rfa_calculation_id: string | null
          total_amount: number
          updated_at: string | null
          updated_by: string | null
          usage_data: Json | null
        }
        Insert: {
          adjustments?: number | null
          auto_generate?: boolean | null
          base_amount?: number
          billing_currency?: string | null
          billing_details?: Json | null
          billing_frequency?: string | null
          billing_period_end: string
          billing_period_start: string
          billing_reference: string
          billing_status?: string | null
          billing_template_id?: string | null
          billing_type: string
          bonuses?: number | null
          calculation_method?: string | null
          company_id: string
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_recurring?: boolean | null
          milestone_achieved?: boolean | null
          next_billing_date?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          penalties?: number | null
          rfa_amount?: number | null
          rfa_applicable?: boolean | null
          rfa_calculation_id?: string | null
          total_amount?: number
          updated_at?: string | null
          updated_by?: string | null
          usage_data?: Json | null
        }
        Update: {
          adjustments?: number | null
          auto_generate?: boolean | null
          base_amount?: number
          billing_currency?: string | null
          billing_details?: Json | null
          billing_frequency?: string | null
          billing_period_end?: string
          billing_period_start?: string
          billing_reference?: string
          billing_status?: string | null
          billing_template_id?: string | null
          billing_type?: string
          bonuses?: number | null
          calculation_method?: string | null
          company_id?: string
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_recurring?: boolean | null
          milestone_achieved?: boolean | null
          next_billing_date?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          penalties?: number | null
          rfa_amount?: number | null
          rfa_applicable?: boolean | null
          rfa_calculation_id?: string | null
          total_amount?: number
          updated_at?: string | null
          updated_by?: string | null
          usage_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_billing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_billing_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_billing_rfa_calculation_id_fkey"
            columns: ["rfa_calculation_id"]
            isOneToOne: false
            referencedRelation: "rfa_calculations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_clauses: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          clause_category: string | null
          clause_type: string
          company_id: string
          conditions: Json | null
          content: string
          contract_id: string
          created_at: string | null
          id: string
          is_mandatory: boolean | null
          is_negotiable: boolean | null
          legal_approved: boolean | null
          legal_references: string[] | null
          negotiated_content: string | null
          negotiation_status: string | null
          order_position: number | null
          original_content: string | null
          risk_level: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          clause_category?: string | null
          clause_type: string
          company_id: string
          conditions?: Json | null
          content: string
          contract_id: string
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          is_negotiable?: boolean | null
          legal_approved?: boolean | null
          legal_references?: string[] | null
          negotiated_content?: string | null
          negotiation_status?: string | null
          order_position?: number | null
          original_content?: string | null
          risk_level?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          clause_category?: string | null
          clause_type?: string
          company_id?: string
          conditions?: Json | null
          content?: string
          contract_id?: string
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          is_negotiable?: boolean | null
          legal_approved?: boolean | null
          legal_references?: string[] | null
          negotiated_content?: string | null
          negotiation_status?: string | null
          order_position?: number | null
          original_content?: string | null
          risk_level?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_clauses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_clauses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_clauses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          access_level: string | null
          company_id: string
          contract_id: string
          created_at: string | null
          description: string | null
          document_category: string | null
          document_date: string | null
          document_name: string
          document_number: string | null
          document_type: string
          encryption_required: boolean | null
          expiry_date: string | null
          file_hash: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_confidential: boolean | null
          is_signed: boolean | null
          keywords: string[] | null
          language: string | null
          last_modified: string | null
          mime_type: string | null
          requires_signature: boolean | null
          signature_status: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          access_level?: string | null
          company_id: string
          contract_id: string
          created_at?: string | null
          description?: string | null
          document_category?: string | null
          document_date?: string | null
          document_name: string
          document_number?: string | null
          document_type: string
          encryption_required?: boolean | null
          expiry_date?: string | null
          file_hash?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_confidential?: boolean | null
          is_signed?: boolean | null
          keywords?: string[] | null
          language?: string | null
          last_modified?: string | null
          mime_type?: string | null
          requires_signature?: boolean | null
          signature_status?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          access_level?: string | null
          company_id?: string
          contract_id?: string
          created_at?: string | null
          description?: string | null
          document_category?: string | null
          document_date?: string | null
          document_name?: string
          document_number?: string | null
          document_type?: string
          encryption_required?: boolean | null
          expiry_date?: string | null
          file_hash?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_confidential?: boolean | null
          is_signed?: boolean | null
          keywords?: string[] | null
          language?: string | null
          last_modified?: string | null
          mime_type?: string | null
          requires_signature?: boolean | null
          signature_status?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_history: {
        Row: {
          change_description: string | null
          change_type: string
          changed_at: string | null
          changed_by: string | null
          contract_id: string
          id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          change_description?: string | null
          change_type: string
          changed_at?: string | null
          changed_by?: string | null
          contract_id: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          change_description?: string | null
          change_type?: string
          changed_at?: string | null
          changed_by?: string | null
          contract_id?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_kpi_tracking: {
        Row: {
          actual_value: number | null
          bonus_threshold: number | null
          company_id: string
          contract_id: string
          corrective_actions: string[] | null
          created_at: string | null
          critical_threshold: number | null
          id: string
          impact_description: string | null
          kpi_category: string | null
          kpi_name: string
          kpi_type: string
          measured_by: string | null
          measurement_period: string
          performance_percentage: number | null
          period_end: string
          period_start: string
          responsible_party: string | null
          status: string | null
          target_value: number | null
          unit: string | null
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          warning_threshold: number | null
        }
        Insert: {
          actual_value?: number | null
          bonus_threshold?: number | null
          company_id: string
          contract_id: string
          corrective_actions?: string[] | null
          created_at?: string | null
          critical_threshold?: number | null
          id?: string
          impact_description?: string | null
          kpi_category?: string | null
          kpi_name: string
          kpi_type: string
          measured_by?: string | null
          measurement_period: string
          performance_percentage?: number | null
          period_end: string
          period_start: string
          responsible_party?: string | null
          status?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          warning_threshold?: number | null
        }
        Update: {
          actual_value?: number | null
          bonus_threshold?: number | null
          company_id?: string
          contract_id?: string
          corrective_actions?: string[] | null
          created_at?: string | null
          critical_threshold?: number | null
          id?: string
          impact_description?: string | null
          kpi_category?: string | null
          kpi_name?: string
          kpi_type?: string
          measured_by?: string | null
          measurement_period?: string
          performance_percentage?: number | null
          period_end?: string
          period_start?: string
          responsible_party?: string | null
          status?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          warning_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_kpi_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_kpi_tracking_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_kpi_tracking_measured_by_fkey"
            columns: ["measured_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_kpi_tracking_responsible_party_fkey"
            columns: ["responsible_party"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_kpi_tracking_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_kpis: {
        Row: {
          action_items: Json | null
          alert_thresholds: Json | null
          alerts_triggered: number | null
          average_response_time_hours: number | null
          benchmarks: Json | null
          company_id: string
          completion_rate: number | null
          contract_amendments: number | null
          contract_health_status: string | null
          contract_id: string
          costs_incurred: number | null
          created_at: string | null
          created_by: string | null
          customer_satisfaction: number | null
          delivery_performance: number | null
          detailed_metrics: Json | null
          escalations: number | null
          id: string
          measurement_period_end: string
          measurement_period_start: string
          measurement_type: string | null
          milestones_completed: number | null
          milestones_total: number | null
          overall_performance_score: number | null
          penalties_applied: number | null
          performance_notes: string | null
          profit_margin: number | null
          profitability_score: number | null
          quality_score: number | null
          recommendations: string | null
          revenue_generated: number | null
          risk_incidents: number | null
          sla_compliance_rate: number | null
          targets: Json | null
          trend: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          action_items?: Json | null
          alert_thresholds?: Json | null
          alerts_triggered?: number | null
          average_response_time_hours?: number | null
          benchmarks?: Json | null
          company_id: string
          completion_rate?: number | null
          contract_amendments?: number | null
          contract_health_status?: string | null
          contract_id: string
          costs_incurred?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_satisfaction?: number | null
          delivery_performance?: number | null
          detailed_metrics?: Json | null
          escalations?: number | null
          id?: string
          measurement_period_end: string
          measurement_period_start: string
          measurement_type?: string | null
          milestones_completed?: number | null
          milestones_total?: number | null
          overall_performance_score?: number | null
          penalties_applied?: number | null
          performance_notes?: string | null
          profit_margin?: number | null
          profitability_score?: number | null
          quality_score?: number | null
          recommendations?: string | null
          revenue_generated?: number | null
          risk_incidents?: number | null
          sla_compliance_rate?: number | null
          targets?: Json | null
          trend?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          action_items?: Json | null
          alert_thresholds?: Json | null
          alerts_triggered?: number | null
          average_response_time_hours?: number | null
          benchmarks?: Json | null
          company_id?: string
          completion_rate?: number | null
          contract_amendments?: number | null
          contract_health_status?: string | null
          contract_id?: string
          costs_incurred?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_satisfaction?: number | null
          delivery_performance?: number | null
          detailed_metrics?: Json | null
          escalations?: number | null
          id?: string
          measurement_period_end?: string
          measurement_period_start?: string
          measurement_type?: string | null
          milestones_completed?: number | null
          milestones_total?: number | null
          overall_performance_score?: number | null
          penalties_applied?: number | null
          performance_notes?: string | null
          profit_margin?: number | null
          profitability_score?: number | null
          quality_score?: number | null
          recommendations?: string | null
          revenue_generated?: number | null
          risk_incidents?: number | null
          sla_compliance_rate?: number | null
          targets?: Json | null
          trend?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_kpis_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_milestones: {
        Row: {
          acceptance_criteria: string[] | null
          actual_date: string | null
          approved_at: string | null
          approved_by: string | null
          company_id: string
          completion_percentage: number | null
          contract_id: string
          created_at: string | null
          currency: string | null
          deadline_date: string | null
          deliverables: string[] | null
          description: string | null
          external_contact: string | null
          id: string
          invoice_required: boolean | null
          invoiced: boolean | null
          milestone_name: string
          milestone_type: string | null
          milestone_value: number | null
          planned_date: string
          quality_requirements: string | null
          rejection_reason: string | null
          requires_approval: boolean | null
          responsible_party_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: string[] | null
          actual_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          completion_percentage?: number | null
          contract_id: string
          created_at?: string | null
          currency?: string | null
          deadline_date?: string | null
          deliverables?: string[] | null
          description?: string | null
          external_contact?: string | null
          id?: string
          invoice_required?: boolean | null
          invoiced?: boolean | null
          milestone_name: string
          milestone_type?: string | null
          milestone_value?: number | null
          planned_date: string
          quality_requirements?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          responsible_party_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: string[] | null
          actual_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          completion_percentage?: number | null
          contract_id?: string
          created_at?: string | null
          currency?: string | null
          deadline_date?: string | null
          deliverables?: string[] | null
          description?: string | null
          external_contact?: string | null
          id?: string
          invoice_required?: boolean | null
          invoiced?: boolean | null
          milestone_name?: string
          milestone_type?: string | null
          milestone_value?: number | null
          planned_date?: string
          quality_requirements?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          responsible_party_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_milestones_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_responsible_party_id_fkey"
            columns: ["responsible_party_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_parties: {
        Row: {
          address: string | null
          company_id: string
          contact_person: string | null
          contract_id: string
          created_at: string | null
          customer_id: string | null
          email: string | null
          employee_id: string | null
          id: string
          legal_entity_name: string | null
          obligations: string[] | null
          party_name: string | null
          party_role: string | null
          type: string
          phone: string | null
          responsibilities: string[] | null
          signature_date: string | null
          signature_method: string | null
          signed: boolean | null
          signing_required: boolean | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_id: string
          contact_person?: string | null
          contract_id: string
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          employee_id?: string | null
          id?: string
          legal_entity_name?: string | null
          obligations?: string[] | null
          party_name?: string | null
          party_role?: string | null
          type: string
          phone?: string | null
          responsibilities?: string[] | null
          signature_date?: string | null
          signature_method?: string | null
          signed?: boolean | null
          signing_required?: boolean | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string
          contact_person?: string | null
          contract_id?: string
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          employee_id?: string | null
          id?: string
          legal_entity_name?: string | null
          obligations?: string[] | null
          party_name?: string | null
          party_role?: string | null
          type?: string
          phone?: string | null
          responsibilities?: string[] | null
          signature_date?: string | null
          signature_method?: string | null
          signed?: boolean | null
          signing_required?: boolean | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_parties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_parties_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_parties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_parties_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_parties_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_renewals: {
        Row: {
          amendment_required: boolean | null
          approved_by: string | null
          approved_date: string | null
          auto_renewal_enabled: boolean | null
          company_id: string
          contract_id: string
          contract_value_change: number | null
          created_at: string | null
          created_by: string | null
          id: string
          new_contract_value: number | null
          new_end_date: string
          notification_sent: boolean | null
          notification_sent_date: string | null
          original_end_date: string
          reminder_count: number | null
          renewal_conditions: Json | null
          renewal_notice_days: number | null
          renewal_period_months: number | null
          renewal_type: string
          status: string | null
          terms_changes: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amendment_required?: boolean | null
          approved_by?: string | null
          approved_date?: string | null
          auto_renewal_enabled?: boolean | null
          company_id: string
          contract_id: string
          contract_value_change?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_contract_value?: number | null
          new_end_date: string
          notification_sent?: boolean | null
          notification_sent_date?: string | null
          original_end_date: string
          reminder_count?: number | null
          renewal_conditions?: Json | null
          renewal_notice_days?: number | null
          renewal_period_months?: number | null
          renewal_type?: string
          status?: string | null
          terms_changes?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amendment_required?: boolean | null
          approved_by?: string | null
          approved_date?: string | null
          auto_renewal_enabled?: boolean | null
          company_id?: string
          contract_id?: string
          contract_value_change?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_contract_value?: number | null
          new_end_date?: string
          notification_sent?: boolean | null
          notification_sent_date?: string | null
          original_end_date?: string
          reminder_count?: number | null
          renewal_conditions?: Json | null
          renewal_notice_days?: number | null
          renewal_period_months?: number | null
          renewal_type?: string
          status?: string | null
          terms_changes?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_renewals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_renewals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_renewals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          clauses: Json | null
          company_id: string
          contract_type_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          language: string | null
          legal_approved: boolean | null
          name: string
          template_content: string
          updated_at: string | null
          variables: Json | null
          version: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          clauses?: Json | null
          company_id: string
          contract_type_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          language?: string | null
          legal_approved?: boolean | null
          name: string
          template_content: string
          updated_at?: string | null
          variables?: Json | null
          version?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          clauses?: Json | null
          company_id?: string
          contract_type_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          language?: string | null
          legal_approved?: boolean | null
          name?: string
          template_content?: string
          updated_at?: string | null
          variables?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_contract_type_id_fkey"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_terminations: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          asset_return_required: boolean | null
          asset_return_status: string | null
          company_id: string
          confidentiality_maintained: boolean | null
          contract_id: string
          created_at: string | null
          created_by: string | null
          early_termination: boolean | null
          effective_date: string | null
          final_payment_due: number | null
          id: string
          initiated_by: string | null
          legal_review_required: boolean | null
          legal_review_status: string | null
          notice_given_date: string | null
          notice_period_days: number | null
          outstanding_obligations: Json | null
          penalty_amount: number | null
          penalty_applicable: boolean | null
          refund_due: number | null
          settlement_terms: string | null
          status: string | null
          supporting_documents: Json | null
          termination_date: string
          termination_letter_path: string | null
          termination_reason: string
          termination_type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          asset_return_required?: boolean | null
          asset_return_status?: string | null
          company_id: string
          confidentiality_maintained?: boolean | null
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          early_termination?: boolean | null
          effective_date?: string | null
          final_payment_due?: number | null
          id?: string
          initiated_by?: string | null
          legal_review_required?: boolean | null
          legal_review_status?: string | null
          notice_given_date?: string | null
          notice_period_days?: number | null
          outstanding_obligations?: Json | null
          penalty_amount?: number | null
          penalty_applicable?: boolean | null
          refund_due?: number | null
          settlement_terms?: string | null
          status?: string | null
          supporting_documents?: Json | null
          termination_date: string
          termination_letter_path?: string | null
          termination_reason: string
          termination_type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          asset_return_required?: boolean | null
          asset_return_status?: string | null
          company_id?: string
          confidentiality_maintained?: boolean | null
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          early_termination?: boolean | null
          effective_date?: string | null
          final_payment_due?: number | null
          id?: string
          initiated_by?: string | null
          legal_review_required?: boolean | null
          legal_review_status?: string | null
          notice_given_date?: string | null
          notice_period_days?: number | null
          outstanding_obligations?: Json | null
          penalty_amount?: number | null
          penalty_applicable?: boolean | null
          refund_due?: number | null
          settlement_terms?: string | null
          status?: string | null
          supporting_documents?: Json | null
          termination_date?: string
          termination_letter_path?: string | null
          termination_reason?: string
          termination_type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_terminations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_terminations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_terminations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_terminations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_types: {
        Row: {
          auto_renewal: boolean | null
          category: string | null
          code: string
          company_id: string
          created_at: string | null
          default_duration_months: number | null
          default_template_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          mandatory_clauses: string[] | null
          max_duration_months: number | null
          min_duration_months: number | null
          name: string
          optional_clauses: string[] | null
          requires_approval: boolean | null
          requires_legal_review: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_renewal?: boolean | null
          category?: string | null
          code: string
          company_id: string
          created_at?: string | null
          default_duration_months?: number | null
          default_template_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          mandatory_clauses?: string[] | null
          max_duration_months?: number | null
          min_duration_months?: number | null
          name: string
          optional_clauses?: string[] | null
          requires_approval?: boolean | null
          requires_legal_review?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_renewal?: boolean | null
          category?: string | null
          code?: string
          company_id?: string
          created_at?: string | null
          default_duration_months?: number | null
          default_template_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          mandatory_clauses?: string[] | null
          max_duration_months?: number | null
          min_duration_months?: number | null
          name?: string
          optional_clauses?: string[] | null
          requires_approval?: boolean | null
          requires_legal_review?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          alert_before_expiry_days: number | null
          approval_status: string | null
          approval_workflow: Json | null
          auto_renewal: boolean | null
          client_id: string | null
          company_id: string
          contract_name: string
          contract_number: string
          contract_type_id: string
          contract_value: number | null
          created_at: string | null
          created_by: string | null
          creation_date: string | null
          currency: string | null
          deliverables: string[] | null
          description: string | null
          electronic_signature: boolean | null
          end_date: string | null
          has_rfa: boolean | null
          id: string
          internal_contact_id: string | null
          kpis: Json | null
          last_alert_sent: string | null
          legal_review_by: string | null
          legal_review_date: string | null
          legal_review_notes: string | null
          legal_review_required: boolean | null
          legal_review_status: string | null
          main_document_path: string | null
          next_review_date: string | null
          notice_period_days: number | null
          payment_frequency: string | null
          payment_terms: string | null
          performance_score: number | null
          priority: string | null
          profitability_rating: string | null
          renewal_notice_days: number | null
          renewal_terms: string | null
          rfa_base_percentage: number | null
          rfa_brackets: Json | null
          rfa_calculation_base: string | null
          rfa_calculation_type: string | null
          rfa_enabled: boolean | null
          rfa_tiers: Json | null
          risk_level: string | null
          signature_date: string | null
          signature_metadata: Json | null
          signed_document_path: string | null
          special_clauses: string[] | null
          start_date: string
          status: string | null
          supplier_id: string | null
          template_id: string | null
          terms_and_conditions: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          alert_before_expiry_days?: number | null
          approval_status?: string | null
          approval_workflow?: Json | null
          auto_renewal?: boolean | null
          client_id?: string | null
          company_id: string
          contract_name: string
          contract_number: string
          contract_type_id: string
          contract_value?: number | null
          created_at?: string | null
          created_by?: string | null
          creation_date?: string | null
          currency?: string | null
          deliverables?: string[] | null
          description?: string | null
          electronic_signature?: boolean | null
          end_date?: string | null
          has_rfa?: boolean | null
          id?: string
          internal_contact_id?: string | null
          kpis?: Json | null
          last_alert_sent?: string | null
          legal_review_by?: string | null
          legal_review_date?: string | null
          legal_review_notes?: string | null
          legal_review_required?: boolean | null
          legal_review_status?: string | null
          main_document_path?: string | null
          next_review_date?: string | null
          notice_period_days?: number | null
          payment_frequency?: string | null
          payment_terms?: string | null
          performance_score?: number | null
          priority?: string | null
          profitability_rating?: string | null
          renewal_notice_days?: number | null
          renewal_terms?: string | null
          rfa_base_percentage?: number | null
          rfa_brackets?: Json | null
          rfa_calculation_base?: string | null
          rfa_calculation_type?: string | null
          rfa_enabled?: boolean | null
          rfa_tiers?: Json | null
          risk_level?: string | null
          signature_date?: string | null
          signature_metadata?: Json | null
          signed_document_path?: string | null
          special_clauses?: string[] | null
          start_date: string
          status?: string | null
          supplier_id?: string | null
          template_id?: string | null
          terms_and_conditions?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          alert_before_expiry_days?: number | null
          approval_status?: string | null
          approval_workflow?: Json | null
          auto_renewal?: boolean | null
          client_id?: string | null
          company_id?: string
          contract_name?: string
          contract_number?: string
          contract_type_id?: string
          contract_value?: number | null
          created_at?: string | null
          created_by?: string | null
          creation_date?: string | null
          currency?: string | null
          deliverables?: string[] | null
          description?: string | null
          electronic_signature?: boolean | null
          end_date?: string | null
          has_rfa?: boolean | null
          id?: string
          internal_contact_id?: string | null
          kpis?: Json | null
          last_alert_sent?: string | null
          legal_review_by?: string | null
          legal_review_date?: string | null
          legal_review_notes?: string | null
          legal_review_required?: boolean | null
          legal_review_status?: string | null
          main_document_path?: string | null
          next_review_date?: string | null
          notice_period_days?: number | null
          payment_frequency?: string | null
          payment_terms?: string | null
          performance_score?: number | null
          priority?: string | null
          profitability_rating?: string | null
          renewal_notice_days?: number | null
          renewal_terms?: string | null
          rfa_base_percentage?: number | null
          rfa_brackets?: Json | null
          rfa_calculation_base?: string | null
          rfa_calculation_type?: string | null
          rfa_enabled?: boolean | null
          rfa_tiers?: Json | null
          risk_level?: string | null
          signature_date?: string | null
          signature_metadata?: Json | null
          signed_document_path?: string | null
          special_clauses?: string[] | null
          start_date?: string
          status?: string | null
          supplier_id?: string | null
          template_id?: string | null
          terms_and_conditions?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_contract_type_id_fkey"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_internal_contact_id_fkey"
            columns: ["internal_contact_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_legal_review_by_fkey"
            columns: ["legal_review_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts_archive: {
        Row: {
          access_log: Json | null
          archive_category: string | null
          archive_file_path: string
          archive_file_url: string
          archive_reference: string
          archived_at: string | null
          archived_by: string | null
          can_be_destroyed: boolean | null
          company_id: string
          contract_data_snapshot: Json | null
          contract_date: string
          contract_name: string
          contract_type: string
          contract_value: number | null
          created_at: string | null
          file_format: string
          file_hash: string | null
          file_size_bytes: number | null
          generated_contract_id: string | null
          id: string
          importance_level: string | null
          keywords: unknown
          last_accessed_at: string | null
          last_accessed_by: string | null
          legal_requirement: string | null
          notes: string | null
          original_generated_at: string | null
          original_signed_at: string | null
          party_name: string | null
          retention_until: string
          retention_years: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          access_log?: Json | null
          archive_category?: string | null
          archive_file_path: string
          archive_file_url: string
          archive_reference: string
          archived_at?: string | null
          archived_by?: string | null
          can_be_destroyed?: boolean | null
          company_id: string
          contract_data_snapshot?: Json | null
          contract_date: string
          contract_name: string
          contract_type: string
          contract_value?: number | null
          created_at?: string | null
          file_format: string
          file_hash?: string | null
          file_size_bytes?: number | null
          generated_contract_id?: string | null
          id?: string
          importance_level?: string | null
          keywords?: unknown
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          legal_requirement?: string | null
          notes?: string | null
          original_generated_at?: string | null
          original_signed_at?: string | null
          party_name?: string | null
          retention_until: string
          retention_years?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          access_log?: Json | null
          archive_category?: string | null
          archive_file_path?: string
          archive_file_url?: string
          archive_reference?: string
          archived_at?: string | null
          archived_by?: string | null
          can_be_destroyed?: boolean | null
          company_id?: string
          contract_data_snapshot?: Json | null
          contract_date?: string
          contract_name?: string
          contract_type?: string
          contract_value?: number | null
          created_at?: string | null
          file_format?: string
          file_hash?: string | null
          file_size_bytes?: number | null
          generated_contract_id?: string | null
          id?: string
          importance_level?: string | null
          keywords?: unknown
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          legal_requirement?: string | null
          notes?: string | null
          original_generated_at?: string | null
          original_signed_at?: string | null
          party_name?: string | null
          retention_until?: string
          retention_years?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_archive_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_archive_generated_contract_id_fkey"
            columns: ["generated_contract_id"]
            isOneToOne: false
            referencedRelation: "generated_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          actual_amount: number | null
          budget_amount: number | null
          code: string
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_amount?: number | null
          budget_amount?: number | null
          code: string
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_amount?: number | null
          budget_amount?: number | null
          code?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      countries_catalog: {
        Row: {
          accounting_standard: string
          accounting_standard_name: string | null
          area_km2: number | null
          capital: string | null
          code: string
          created_at: string | null
          currency_code: string
          currency_decimal_places: number | null
          currency_name: string
          currency_symbol: string
          date_format: string | null
          default_language: string | null
          fiscal_year_start: string | null
          id: string
          is_active: boolean | null
          is_supported: boolean | null
          name: string
          name_english: string | null
          name_native: string | null
          number_format: string | null
          population: number | null
          priority_order: number | null
          region: string | null
          subregion: string | null
          timezone: string
          updated_at: string | null
        }
        Insert: {
          accounting_standard: string
          accounting_standard_name?: string | null
          area_km2?: number | null
          capital?: string | null
          code: string
          created_at?: string | null
          currency_code: string
          currency_decimal_places?: number | null
          currency_name: string
          currency_symbol: string
          date_format?: string | null
          default_language?: string | null
          fiscal_year_start?: string | null
          id?: string
          is_active?: boolean | null
          is_supported?: boolean | null
          name: string
          name_english?: string | null
          name_native?: string | null
          number_format?: string | null
          population?: number | null
          priority_order?: number | null
          region?: string | null
          subregion?: string | null
          timezone: string
          updated_at?: string | null
        }
        Update: {
          accounting_standard?: string
          accounting_standard_name?: string | null
          area_km2?: number | null
          capital?: string | null
          code?: string
          created_at?: string | null
          currency_code?: string
          currency_decimal_places?: number | null
          currency_name?: string
          currency_symbol?: string
          date_format?: string | null
          default_language?: string | null
          fiscal_year_start?: string | null
          id?: string
          is_active?: boolean | null
          is_supported?: boolean | null
          name?: string
          name_english?: string | null
          name_native?: string | null
          number_format?: string | null
          population?: number | null
          priority_order?: number | null
          region?: string | null
          subregion?: string | null
          timezone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_actions: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          client_name: string | null
          company_id: string
          completed_date: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          duration_minutes: number | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          opportunity_id: string | null
          opportunity_title: string | null
          outcome: string | null
          priority: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          client_name?: string | null
          company_id: string
          completed_date?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          opportunity_id?: string | null
          opportunity_title?: string | null
          outcome?: string | null
          priority?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          client_name?: string | null
          company_id?: string
          completed_date?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          opportunity_id?: string | null
          opportunity_title?: string | null
          outcome?: string | null
          priority?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_actions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "third_parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_actions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_actions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_actions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_date: string
          activity_type: string
          assigned_to: string | null
          attachments: Json | null
          client_id: string | null
          company_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          duration_minutes: number | null
          id: string
          metadata: Json | null
          opportunity_id: string | null
          outcome: string | null
          outcome_notes: string | null
          priority: string | null
          reminder_minutes_before: number | null
          reminder_sent: boolean | null
          status: string
          subject: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          activity_date: string
          activity_type: string
          assigned_to?: string | null
          attachments?: Json | null
          client_id?: string | null
          company_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          opportunity_id?: string | null
          outcome?: string | null
          outcome_notes?: string | null
          priority?: string | null
          reminder_minutes_before?: number | null
          reminder_sent?: boolean | null
          status?: string
          subject: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          assigned_to?: string | null
          attachments?: Json | null
          client_id?: string | null
          company_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          opportunity_id?: string | null
          outcome?: string | null
          outcome_notes?: string | null
          priority?: string | null
          reminder_minutes_before?: number | null
          reminder_sent?: boolean | null
          status?: string
          subject?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_attachments: {
        Row: {
          activity_id: string | null
          client_id: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          document_type: string | null
          file_extension: string | null
          file_path: string
          file_size_bytes: number | null
          filename: string
          id: string
          is_confidential: boolean | null
          lead_id: string | null
          mime_type: string | null
          note_id: string | null
          opportunity_id: string | null
          original_filename: string
          parent_file_id: string | null
          storage_provider: string | null
          version: number | null
        }
        Insert: {
          activity_id?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          file_extension?: string | null
          file_path: string
          file_size_bytes?: number | null
          filename: string
          id?: string
          is_confidential?: boolean | null
          lead_id?: string | null
          mime_type?: string | null
          note_id?: string | null
          opportunity_id?: string | null
          original_filename: string
          parent_file_id?: string | null
          storage_provider?: string | null
          version?: number | null
        }
        Update: {
          activity_id?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          file_extension?: string | null
          file_path?: string
          file_size_bytes?: number | null
          filename?: string
          id?: string
          is_confidential?: boolean | null
          lead_id?: string | null
          mime_type?: string | null
          note_id?: string | null
          opportunity_id?: string | null
          original_filename?: string
          parent_file_id?: string | null
          storage_provider?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_attachments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_attachments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_attachments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_attachments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "crm_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_attachments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_attachments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_attachments_parent_file_id_fkey"
            columns: ["parent_file_id"]
            isOneToOne: false
            referencedRelation: "crm_attachments"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaigns: {
        Row: {
          budget: number | null
          clicked_count: number | null
          company_id: string
          cost: number | null
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          description: string | null
          end_date: string | null
          id: string
          leads_generated: number | null
          message_template: string | null
          name: string
          opened_count: number | null
          opportunities_created: number | null
          responded_count: number | null
          sent_count: number | null
          start_date: string | null
          status: string | null
          target_audience: Json | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          clicked_count?: number | null
          company_id: string
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          leads_generated?: number | null
          message_template?: string | null
          name: string
          opened_count?: number | null
          opportunities_created?: number | null
          responded_count?: number | null
          sent_count?: number | null
          start_date?: string | null
          status?: string | null
          target_audience?: Json | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          clicked_count?: number | null
          company_id?: string
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          leads_generated?: number | null
          message_template?: string | null
          name?: string
          opened_count?: number | null
          opportunities_created?: number | null
          responded_count?: number | null
          sent_count?: number | null
          start_date?: string | null
          status?: string | null
          target_audience?: Json | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_clients: {
        Row: {
          account_manager_id: string | null
          acquisition_cost: number | null
          annual_revenue: number | null
          billing_address: Json | null
          churn_risk: string | null
          company_id: string
          company_size: string | null
          converted_from_lead_id: string | null
          created_at: string | null
          created_by: string | null
          health_score: number | null
          id: string
          industry: string | null
          is_key_account: boolean | null
          last_purchase_date: string | null
          lifetime_value: number | null
          name: string
          parent_client_id: string | null
          preferred_contact_method: string | null
          preferred_payment_terms: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          satisfaction_rating: number | null
          segment: string | null
          shipping_address: Json | null
          special_terms: string | null
          status: string | null
          tags: Json | null
          tier: string | null
          total_value: number | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
          website: string | null
        }
        Insert: {
          account_manager_id?: string | null
          acquisition_cost?: number | null
          annual_revenue?: number | null
          billing_address?: Json | null
          churn_risk?: string | null
          company_id: string
          company_size?: string | null
          converted_from_lead_id?: string | null
          created_at?: string | null
          created_by?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          is_key_account?: boolean | null
          last_purchase_date?: string | null
          lifetime_value?: number | null
          name: string
          parent_client_id?: string | null
          preferred_contact_method?: string | null
          preferred_payment_terms?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          satisfaction_rating?: number | null
          segment?: string | null
          shipping_address?: Json | null
          special_terms?: string | null
          status?: string | null
          tags?: Json | null
          tier?: string | null
          total_value?: number | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          account_manager_id?: string | null
          acquisition_cost?: number | null
          annual_revenue?: number | null
          billing_address?: Json | null
          churn_risk?: string | null
          company_id?: string
          company_size?: string | null
          converted_from_lead_id?: string | null
          created_at?: string | null
          created_by?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          is_key_account?: boolean | null
          last_purchase_date?: string | null
          lifetime_value?: number | null
          name?: string
          parent_client_id?: string | null
          preferred_contact_method?: string | null
          preferred_payment_terms?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          satisfaction_rating?: number | null
          segment?: string | null
          shipping_address?: Json | null
          special_terms?: string | null
          status?: string | null
          tags?: Json | null
          tier?: string | null
          total_value?: number | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_clients_account_manager_id_fkey"
            columns: ["account_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_clients_converted_from_lead_id_fkey"
            columns: ["converted_from_lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_clients_parent_client_id_fkey"
            columns: ["parent_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_clients_parent_client_id_fkey"
            columns: ["parent_client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          client_id: string | null
          company_id: string
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          is_primary: boolean | null
          last_name: string
          notes: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          company_id: string
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean | null
          last_name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          company_id?: string
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "third_parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_entity_tags: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          tag_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          tag_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_entity_tags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          budget_range: string | null
          city: string | null
          communication_preferences: Json | null
          company_id: string
          company_name: string | null
          company_size: string | null
          company_website: string | null
          contact_attempts: number | null
          converted_to_client_id: string | null
          converted_to_opportunity_id: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          decision_timeframe: string | null
          email: string | null
          first_name: string
          id: string
          industry: string | null
          initial_notes: string | null
          interest_level: string | null
          job_title: string | null
          last_contact_date: string | null
          last_contact_type: string | null
          last_name: string
          lead_score: number | null
          lost_reason: string | null
          next_follow_up_date: string | null
          opted_out: boolean | null
          phone: string | null
          postal_code: string | null
          preferred_contact_method: string | null
          qualification_status: string | null
          source_details: Json | null
          source_id: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          utm_data: Json | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          city?: string | null
          communication_preferences?: Json | null
          company_id: string
          company_name?: string | null
          company_size?: string | null
          company_website?: string | null
          contact_attempts?: number | null
          converted_to_client_id?: string | null
          converted_to_opportunity_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_timeframe?: string | null
          email?: string | null
          first_name: string
          id?: string
          industry?: string | null
          initial_notes?: string | null
          interest_level?: string | null
          job_title?: string | null
          last_contact_date?: string | null
          last_contact_type?: string | null
          last_name: string
          lead_score?: number | null
          lost_reason?: string | null
          next_follow_up_date?: string | null
          opted_out?: boolean | null
          phone?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          qualification_status?: string | null
          source_details?: Json | null
          source_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          utm_data?: Json | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          city?: string | null
          communication_preferences?: Json | null
          company_id?: string
          company_name?: string | null
          company_size?: string | null
          company_website?: string | null
          contact_attempts?: number | null
          converted_to_client_id?: string | null
          converted_to_opportunity_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_timeframe?: string | null
          email?: string | null
          first_name?: string
          id?: string
          industry?: string | null
          initial_notes?: string | null
          interest_level?: string | null
          job_title?: string | null
          last_contact_date?: string | null
          last_contact_type?: string | null
          last_name?: string
          lead_score?: number | null
          lost_reason?: string | null
          next_follow_up_date?: string | null
          opted_out?: boolean | null
          phone?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          qualification_status?: string | null
          source_details?: Json | null
          source_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          utm_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "crm_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          activity_id: string | null
          client_id: string | null
          company_id: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_pinned: boolean | null
          is_private: boolean | null
          lead_id: string | null
          mentioned_users: Json | null
          note_type: string | null
          opportunity_id: string | null
          tags: Json | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          activity_id?: string | null
          client_id?: string | null
          company_id: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          is_private?: boolean | null
          lead_id?: string | null
          mentioned_users?: Json | null
          note_type?: string | null
          opportunity_id?: string | null
          tags?: Json | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          activity_id?: string | null
          client_id?: string | null
          company_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          is_private?: boolean | null
          lead_id?: string | null
          mentioned_users?: Json | null
          note_type?: string | null
          opportunity_id?: string | null
          tags?: Json | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunities: {
        Row: {
          actual_close_date: string | null
          client_id: string | null
          company_id: string
          competitors: Json | null
          created_at: string | null
          created_by: string | null
          created_date: string | null
          days_in_pipeline: number | null
          decision_criteria: Json | null
          decision_makers: Json | null
          description: string | null
          engagement_score: number | null
          expected_close_date: string | null
          forecast_category: string | null
          id: string
          lead_id: string | null
          lost_reason: string | null
          lost_to_competitor: string | null
          next_steps: string | null
          obstacles: string | null
          owner_id: string | null
          pipeline_id: string
          priority: string | null
          probability: number | null
          products_services: Json | null
          recurring_revenue_monthly: number | null
          sales_process: string | null
          solution_category: string | null
          source: string | null
          stage_history: Json | null
          stage_id: string
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
          updated_by: string | null
          value: number
          weighted_value: number | null
          won_reason: string | null
        }
        Insert: {
          actual_close_date?: string | null
          client_id?: string | null
          company_id: string
          competitors?: Json | null
          created_at?: string | null
          created_by?: string | null
          created_date?: string | null
          days_in_pipeline?: number | null
          decision_criteria?: Json | null
          decision_makers?: Json | null
          description?: string | null
          engagement_score?: number | null
          expected_close_date?: string | null
          forecast_category?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          lost_to_competitor?: string | null
          next_steps?: string | null
          obstacles?: string | null
          owner_id?: string | null
          pipeline_id: string
          priority?: string | null
          probability?: number | null
          products_services?: Json | null
          recurring_revenue_monthly?: number | null
          sales_process?: string | null
          solution_category?: string | null
          source?: string | null
          stage_history?: Json | null
          stage_id: string
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: number
          weighted_value?: number | null
          won_reason?: string | null
        }
        Update: {
          actual_close_date?: string | null
          client_id?: string | null
          company_id?: string
          competitors?: Json | null
          created_at?: string | null
          created_by?: string | null
          created_date?: string | null
          days_in_pipeline?: number | null
          decision_criteria?: Json | null
          decision_makers?: Json | null
          description?: string | null
          engagement_score?: number | null
          expected_close_date?: string | null
          forecast_category?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          lost_to_competitor?: string | null
          next_steps?: string | null
          obstacles?: string | null
          owner_id?: string | null
          pipeline_id?: string
          priority?: string | null
          probability?: number | null
          products_services?: Json | null
          recurring_revenue_monthly?: number | null
          sales_process?: string | null
          solution_category?: string | null
          source?: string | null
          stage_history?: Json | null
          stage_id?: string
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: number
          weighted_value?: number | null
          won_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          accessible_by: Json | null
          auto_progress_rules: Json | null
          average_cycle_days: number | null
          average_deal_size: number | null
          color: string | null
          company_id: string
          conversion_rate: number | null
          created_at: string | null
          created_by: string | null
          deal_rotation: boolean | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          probability_model: string | null
          stages_count: number | null
          updated_at: string | null
          updated_by: string | null
          visibility: string | null
        }
        Insert: {
          accessible_by?: Json | null
          auto_progress_rules?: Json | null
          average_cycle_days?: number | null
          average_deal_size?: number | null
          color?: string | null
          company_id: string
          conversion_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          deal_rotation?: boolean | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          probability_model?: string | null
          stages_count?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visibility?: string | null
        }
        Update: {
          accessible_by?: Json | null
          auto_progress_rules?: Json | null
          average_cycle_days?: number | null
          average_deal_size?: number | null
          color?: string | null
          company_id?: string
          conversion_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          deal_rotation?: boolean | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          probability_model?: string | null
          stages_count?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipelines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quote_items: {
        Row: {
          created_at: string
          description: string
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          item_id: string | null
          item_type: string
          line_order: number
          line_total: number
          metadata: Json | null
          quantity: number
          quote_id: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          item_id?: string | null
          item_type: string
          line_order?: number
          line_total: number
          metadata?: Json | null
          quantity?: number
          quote_id: string
          subtotal: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          item_id?: string | null
          item_type?: string
          line_order?: number
          line_total?: number
          metadata?: Json | null
          quantity?: number
          quote_id?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "crm_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quotes: {
        Row: {
          accepted_at: string | null
          attachments: Json | null
          client_id: string
          company_id: string
          contact_id: string | null
          converted_at: string | null
          converted_to_invoice_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          delivery_terms: string | null
          description: string | null
          discount_amount: number | null
          discount_type: string | null
          discount_value: number | null
          expires_at: string | null
          id: string
          metadata: Json | null
          notes: string | null
          opportunity_id: string | null
          payment_terms: string | null
          pdf_url: string | null
          quote_date: string
          quote_number: string
          rejected_at: string | null
          rejection_reason: string | null
          sales_rep_id: string | null
          sent_at: string | null
          status: string
          subject: string
          subtotal_amount: number
          tags: string[] | null
          tax_amount: number
          terms_and_conditions: string | null
          total_amount: number
          updated_at: string
          valid_until: string
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          attachments?: Json | null
          client_id: string
          company_id: string
          contact_id?: string | null
          converted_at?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          delivery_terms?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          opportunity_id?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          quote_date?: string
          quote_number: string
          rejected_at?: string | null
          rejection_reason?: string | null
          sales_rep_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          subtotal_amount?: number
          tags?: string[] | null
          tax_amount?: number
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
          valid_until: string
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          attachments?: Json | null
          client_id?: string
          company_id?: string
          contact_id?: string | null
          converted_at?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          delivery_terms?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          opportunity_id?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          quote_date?: string
          quote_number?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          sales_rep_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          subtotal_amount?: number
          tags?: string[] | null
          tax_amount?: number
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_converted_to_invoice_id_fkey"
            columns: ["converted_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_balances"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "crm_quotes_converted_to_invoice_id_fkey"
            columns: ["converted_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sources: {
        Row: {
          attribution_model: string | null
          category: string | null
          company_id: string
          conversion_rate: number | null
          cost_per_acquisition: number | null
          cost_per_lead: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          leads_generated: number | null
          name: string
          roi: number | null
          tracking_code: string | null
          type: string
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          attribution_model?: string | null
          category?: string | null
          company_id: string
          conversion_rate?: number | null
          cost_per_acquisition?: number | null
          cost_per_lead?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          leads_generated?: number | null
          name: string
          roi?: number | null
          tracking_code?: string | null
          type: string
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          attribution_model?: string | null
          category?: string | null
          company_id?: string
          conversion_rate?: number | null
          cost_per_acquisition?: number | null
          cost_per_lead?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          leads_generated?: number | null
          name?: string
          roi?: number | null
          tracking_code?: string | null
          type?: string
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_stages: {
        Row: {
          auto_actions: Json | null
          average_time_days: number | null
          color: string | null
          company_id: string
          conversion_rate: number | null
          created_at: string | null
          default_probability: number | null
          description: string | null
          id: string
          is_closed_lost: boolean | null
          is_closed_won: boolean | null
          max_probability: number | null
          min_probability: number | null
          name: string
          pipeline_id: string
          required_fields: Json | null
          stage_order: number
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          auto_actions?: Json | null
          average_time_days?: number | null
          color?: string | null
          company_id: string
          conversion_rate?: number | null
          created_at?: string | null
          default_probability?: number | null
          description?: string | null
          id?: string
          is_closed_lost?: boolean | null
          is_closed_won?: boolean | null
          max_probability?: number | null
          min_probability?: number | null
          name: string
          pipeline_id: string
          required_fields?: Json | null
          stage_order: number
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          auto_actions?: Json | null
          average_time_days?: number | null
          color?: string | null
          company_id?: string
          conversion_rate?: number | null
          created_at?: string | null
          default_probability?: number | null
          description?: string | null
          id?: string
          is_closed_lost?: boolean | null
          is_closed_won?: boolean | null
          max_probability?: number | null
          min_probability?: number | null
          name?: string
          pipeline_id?: string
          required_fields?: Json | null
          stage_order?: number
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tags: {
        Row: {
          color: string | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          actual_duration_minutes: number | null
          assigned_to: string | null
          category: string | null
          client_id: string | null
          company_id: string
          completed_at: string | null
          completion_notes: string | null
          completion_percentage: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_duration_minutes: number | null
          id: string
          is_recurring: boolean | null
          lead_id: string | null
          opportunity_id: string | null
          outcome: string | null
          priority: string | null
          recurrence_data: Json | null
          recurrence_pattern: string | null
          reminder_date: string | null
          status: string | null
          task_type: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          assigned_to?: string | null
          category?: string | null
          client_id?: string | null
          company_id: string
          completed_at?: string | null
          completion_notes?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_recurring?: boolean | null
          lead_id?: string | null
          opportunity_id?: string | null
          outcome?: string | null
          priority?: string | null
          recurrence_data?: Json | null
          recurrence_pattern?: string | null
          reminder_date?: string | null
          status?: string | null
          task_type?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          actual_duration_minutes?: number | null
          assigned_to?: string | null
          category?: string | null
          client_id?: string | null
          company_id?: string
          completed_at?: string | null
          completion_notes?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_recurring?: boolean | null
          lead_id?: string | null
          opportunity_id?: string | null
          outcome?: string | null
          priority?: string | null
          recurrence_data?: Json | null
          recurrence_pattern?: string | null
          reminder_date?: string | null
          status?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies_catalog: {
        Row: {
          country_codes: string[] | null
          created_at: string | null
          currency_code: string
          currency_name: string
          currency_symbol: string
          currency_symbol_native: string | null
          decimal_places: number | null
          decimal_separator: string | null
          description: string | null
          exchange_rate_source: string | null
          id: string
          is_active: boolean | null
          is_crypto: boolean | null
          is_major: boolean | null
          last_rate_update: string | null
          priority_order: number | null
          thousands_separator: string | null
          updated_at: string | null
        }
        Insert: {
          country_codes?: string[] | null
          created_at?: string | null
          currency_code: string
          currency_name: string
          currency_symbol: string
          currency_symbol_native?: string | null
          decimal_places?: number | null
          decimal_separator?: string | null
          description?: string | null
          exchange_rate_source?: string | null
          id?: string
          is_active?: boolean | null
          is_crypto?: boolean | null
          is_major?: boolean | null
          last_rate_update?: string | null
          priority_order?: number | null
          thousands_separator?: string | null
          updated_at?: string | null
        }
        Update: {
          country_codes?: string[] | null
          created_at?: string | null
          currency_code?: string
          currency_name?: string
          currency_symbol?: string
          currency_symbol_native?: string | null
          decimal_places?: number | null
          decimal_separator?: string | null
          description?: string | null
          exchange_rate_source?: string | null
          id?: string
          is_active?: boolean | null
          is_crypto?: boolean | null
          is_major?: boolean | null
          last_rate_update?: string | null
          priority_order?: number | null
          thousands_separator?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          company_id: string
          company_name: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          customer_number: string
          customer_type: string | null
          discount_rate: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: number | null
          phone: string | null
          registration_number: string | null
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_postal_code: string | null
          tags: string[] | null
          tax_number: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          company_id: string
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          customer_number: string
          customer_type?: string | null
          discount_rate?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          registration_number?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          tags?: string[] | null
          tax_number?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          company_id?: string
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          customer_number?: string
          customer_type?: string | null
          discount_rate?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          registration_number?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          tags?: string[] | null
          tax_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      data_classification: {
        Row: {
          access_restrictions: Json | null
          anonymization_rules: Json | null
          classification_level: string
          classified_at: string | null
          classified_by: string | null
          column_name: string | null
          created_at: string | null
          cross_border_transfer_allowed: boolean | null
          data_category: string
          data_residency: string[] | null
          encryption_required: boolean | null
          gdpr_category: string | null
          id: string
          justification: string | null
          last_reviewed_at: string | null
          legal_basis: string | null
          record_id: string | null
          related_policies: string[] | null
          retention_period: number | null
          review_due_at: string | null
          table_name: string
          updated_at: string | null
        }
        Insert: {
          access_restrictions?: Json | null
          anonymization_rules?: Json | null
          classification_level: string
          classified_at?: string | null
          classified_by?: string | null
          column_name?: string | null
          created_at?: string | null
          cross_border_transfer_allowed?: boolean | null
          data_category: string
          data_residency?: string[] | null
          encryption_required?: boolean | null
          gdpr_category?: string | null
          id?: string
          justification?: string | null
          last_reviewed_at?: string | null
          legal_basis?: string | null
          record_id?: string | null
          related_policies?: string[] | null
          retention_period?: number | null
          review_due_at?: string | null
          table_name: string
          updated_at?: string | null
        }
        Update: {
          access_restrictions?: Json | null
          anonymization_rules?: Json | null
          classification_level?: string
          classified_at?: string | null
          classified_by?: string | null
          column_name?: string | null
          created_at?: string | null
          cross_border_transfer_allowed?: boolean | null
          data_category?: string
          data_residency?: string[] | null
          encryption_required?: boolean | null
          gdpr_category?: string | null
          id?: string
          justification?: string | null
          last_reviewed_at?: string | null
          legal_basis?: string | null
          record_id?: string | null
          related_policies?: string[] | null
          retention_period?: number | null
          review_due_at?: string | null
          table_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      data_governance_audit: {
        Row: {
          action: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          performed_at: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          performed_at?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          performed_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          company_id: string | null
          compliance_requirements: string[] | null
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          data_category: string
          deletion_method: string | null
          exceptions: Json | null
          id: string
          is_active: boolean | null
          last_executed: string | null
          next_execution: string | null
          policy_name: string
          retention_period_days: number
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          compliance_requirements?: string[] | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_category: string
          deletion_method?: string | null
          exceptions?: Json | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          next_execution?: string | null
          policy_name: string
          retention_period_days: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          compliance_requirements?: string[] | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_category?: string
          deletion_method?: string | null
          exceptions?: Json | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          next_execution?: string | null
          policy_name?: string
          retention_period_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          budget_allocated: number | null
          code: string
          company_id: string
          created_at: string | null
          department_level: number | null
          description: string | null
          id: string
          is_active: boolean | null
          location: string | null
          manager_id: string | null
          name: string
          parent_department_id: string | null
          updated_at: string | null
        }
        Insert: {
          budget_allocated?: number | null
          code: string
          company_id: string
          created_at?: string | null
          department_level?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          manager_id?: string | null
          name: string
          parent_department_id?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_allocated?: number | null
          code?: string
          company_id?: string
          created_at?: string | null
          department_level?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          manager_id?: string | null
          name?: string
          parent_department_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      depreciation_schedules: {
        Row: {
          accumulated_depreciation: number
          company_id: string
          created_at: string | null
          depreciation_amount: number
          fiscal_year: number
          fixed_asset_id: string
          id: string
          journal_entry_id: string | null
          net_book_value: number
          period_end: string
          period_start: string
          posted_date: string | null
          status: string | null
        }
        Insert: {
          accumulated_depreciation: number
          company_id: string
          created_at?: string | null
          depreciation_amount: number
          fiscal_year: number
          fixed_asset_id: string
          id?: string
          journal_entry_id?: string | null
          net_book_value: number
          period_end: string
          period_start: string
          posted_date?: string | null
          status?: string | null
        }
        Update: {
          accumulated_depreciation?: number
          company_id?: string
          created_at?: string | null
          depreciation_amount?: number
          fiscal_year?: number
          fixed_asset_id?: string
          id?: string
          journal_entry_id?: string | null
          net_book_value?: number
          period_end?: string
          period_start?: string
          posted_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "depreciation_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depreciation_schedules_fixed_asset_id_fkey"
            columns: ["fixed_asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depreciation_schedules_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_actions: {
        Row: {
          action_date: string
          action_description: string
          action_type: string
          affects_probation: boolean | null
          affects_promotion_eligibility: boolean | null
          appeal_date: string | null
          appeal_outcome: string | null
          company_id: string
          conditions_for_improvement: string | null
          created_at: string | null
          employee_acknowledgment_date: string | null
          employee_agrees: boolean | null
          employee_id: string
          employee_response: string | null
          hr_representative: string | null
          id: string
          incident_date: string
          incident_description: string
          is_paid_suspension: boolean | null
          issued_by: string
          next_review_date: string | null
          policy_violated: string | null
          retention_period_years: number | null
          review_period_months: number | null
          severity_level: string | null
          status: string | null
          suspension_end_date: string | null
          suspension_start_date: string | null
          updated_at: string | null
          witness_statements: string | null
        }
        Insert: {
          action_date?: string
          action_description: string
          action_type: string
          affects_probation?: boolean | null
          affects_promotion_eligibility?: boolean | null
          appeal_date?: string | null
          appeal_outcome?: string | null
          company_id: string
          conditions_for_improvement?: string | null
          created_at?: string | null
          employee_acknowledgment_date?: string | null
          employee_agrees?: boolean | null
          employee_id: string
          employee_response?: string | null
          hr_representative?: string | null
          id?: string
          incident_date: string
          incident_description: string
          is_paid_suspension?: boolean | null
          issued_by: string
          next_review_date?: string | null
          policy_violated?: string | null
          retention_period_years?: number | null
          review_period_months?: number | null
          severity_level?: string | null
          status?: string | null
          suspension_end_date?: string | null
          suspension_start_date?: string | null
          updated_at?: string | null
          witness_statements?: string | null
        }
        Update: {
          action_date?: string
          action_description?: string
          action_type?: string
          affects_probation?: boolean | null
          affects_promotion_eligibility?: boolean | null
          appeal_date?: string | null
          appeal_outcome?: string | null
          company_id?: string
          conditions_for_improvement?: string | null
          created_at?: string | null
          employee_acknowledgment_date?: string | null
          employee_agrees?: boolean | null
          employee_id?: string
          employee_response?: string | null
          hr_representative?: string | null
          id?: string
          incident_date?: string
          incident_description?: string
          is_paid_suspension?: boolean | null
          issued_by?: string
          next_review_date?: string | null
          policy_violated?: string | null
          retention_period_years?: number | null
          review_period_months?: number | null
          severity_level?: string | null
          status?: string | null
          suspension_end_date?: string | null
          suspension_start_date?: string | null
          updated_at?: string | null
          witness_statements?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_actions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_actions_hr_representative_fkey"
            columns: ["hr_representative"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_actions_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_benefits: {
        Row: {
          beneficiaries: Json | null
          benefit_id: string
          company_id: string
          created_at: string | null
          custom_amount: number | null
          effective_date: string
          employee_contribution: number | null
          employee_id: string
          end_date: string | null
          enrolled_by: string | null
          enrollment_date: string
          id: string
          status: string | null
          suspension_reason: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          beneficiaries?: Json | null
          benefit_id: string
          company_id: string
          created_at?: string | null
          custom_amount?: number | null
          effective_date: string
          employee_contribution?: number | null
          employee_id: string
          end_date?: string | null
          enrolled_by?: string | null
          enrollment_date?: string
          id?: string
          status?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          beneficiaries?: Json | null
          benefit_id?: string
          company_id?: string
          created_at?: string | null
          custom_amount?: number | null
          effective_date?: string
          employee_contribution?: number | null
          employee_id?: string
          end_date?: string | null
          enrolled_by?: string | null
          enrollment_date?: string
          id?: string
          status?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_enrolled_by_fkey"
            columns: ["enrolled_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_certifications: {
        Row: {
          created_at: string | null
          credential_id: string | null
          credential_url: string | null
          document_url: string | null
          employee_id: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          document_url?: string | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          document_url?: string | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_contracts: {
        Row: {
          base_salary: number
          benefits_eligible: boolean | null
          company_id: string
          contract_number: string
          contract_type: string
          created_at: string | null
          currency: string | null
          department_id: string
          employee_id: string
          employment_status: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          is_full_time: boolean | null
          position_id: string
          probation_end_date: string | null
          salary_frequency: string | null
          sick_days_per_year: number | null
          start_date: string
          updated_at: string | null
          vacation_days_per_year: number | null
          working_hours_per_week: number | null
        }
        Insert: {
          base_salary: number
          benefits_eligible?: boolean | null
          company_id: string
          contract_number: string
          contract_type?: string
          created_at?: string | null
          currency?: string | null
          department_id: string
          employee_id: string
          employment_status?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          is_full_time?: boolean | null
          position_id: string
          probation_end_date?: string | null
          salary_frequency?: string | null
          sick_days_per_year?: number | null
          start_date: string
          updated_at?: string | null
          vacation_days_per_year?: number | null
          working_hours_per_week?: number | null
        }
        Update: {
          base_salary?: number
          benefits_eligible?: boolean | null
          company_id?: string
          contract_number?: string
          contract_type?: string
          created_at?: string | null
          currency?: string | null
          department_id?: string
          employee_id?: string
          employment_status?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          is_full_time?: boolean | null
          position_id?: string
          probation_end_date?: string | null
          salary_frequency?: string | null
          sick_days_per_year?: number | null
          start_date?: string
          updated_at?: string | null
          vacation_days_per_year?: number | null
          working_hours_per_week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_contracts_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_contracts_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          company_id: string
          created_at: string | null
          document_name: string
          document_type: string
          employee_id: string
          expiry_date: string | null
          file_path: string | null
          file_size: number | null
          id: string
          is_confidential: boolean | null
          is_required: boolean | null
          issue_date: string | null
          mime_type: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          document_name: string
          document_type: string
          employee_id: string
          expiry_date?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_confidential?: boolean | null
          is_required?: boolean | null
          issue_date?: string | null
          mime_type?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          document_name?: string
          document_type?: string
          employee_id?: string
          expiry_date?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_confidential?: boolean | null
          is_required?: boolean | null
          issue_date?: string | null
          mime_type?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_surveys: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string
          id: string
          is_anonymous: boolean | null
          is_mandatory: boolean | null
          questions: Json
          response_rate: number | null
          start_date: string
          status: string | null
          survey_type: string | null
          target_audience: string | null
          target_departments: string[] | null
          target_employee_ids: string[] | null
          target_positions: string[] | null
          title: string
          total_invitations: number | null
          total_responses: number | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          is_anonymous?: boolean | null
          is_mandatory?: boolean | null
          questions?: Json
          response_rate?: number | null
          start_date: string
          status?: string | null
          survey_type?: string | null
          target_audience?: string | null
          target_departments?: string[] | null
          target_employee_ids?: string[] | null
          target_positions?: string[] | null
          title: string
          total_invitations?: number | null
          total_responses?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          is_anonymous?: boolean | null
          is_mandatory?: boolean | null
          questions?: Json
          response_rate?: number | null
          start_date?: string
          status?: string | null
          survey_type?: string | null
          target_audience?: string | null
          target_departments?: string[] | null
          target_employee_ids?: string[] | null
          target_positions?: string[] | null
          title?: string
          total_invitations?: number | null
          total_responses?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_surveys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          base_salary: number | null
          birth_date: string | null
          city: string | null
          company_id: string
          contract_type: string | null
          country: string | null
          created_at: string | null
          department: string | null
          email: string | null
          employee_number: string
          employment_type: string | null
          end_date: string | null
          first_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          job_title: string | null
          last_name: string
          leave_balance: number | null
          manager_id: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          salary_currency: string | null
          salary_period: string | null
          salary_type: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          base_salary?: number | null
          birth_date?: string | null
          city?: string | null
          company_id: string
          contract_type?: string | null
          country?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_number: string
          employment_type?: string | null
          end_date?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          last_name: string
          leave_balance?: number | null
          manager_id?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          salary_currency?: string | null
          salary_period?: string | null
          salary_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          base_salary?: number | null
          birth_date?: string | null
          city?: string | null
          company_id?: string
          contract_type?: string | null
          country?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_number?: string
          employment_type?: string | null
          end_date?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          last_name?: string
          leave_balance?: number | null
          manager_id?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          salary_currency?: string | null
          salary_period?: string | null
          salary_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_keys: {
        Row: {
          access_log: Json | null
          algorithm: string
          compromised_at: string | null
          created_at: string | null
          created_by: string
          encrypted_key: string
          id: string
          key_hash: string
          key_name: string
          key_size: number
          key_type: string
          last_rotated_at: string | null
          last_used_at: string | null
          next_rotation_at: string | null
          revoked_at: string | null
          revoked_by: string | null
          rotation_period: number | null
          status: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          access_log?: Json | null
          algorithm?: string
          compromised_at?: string | null
          created_at?: string | null
          created_by: string
          encrypted_key: string
          id?: string
          key_hash: string
          key_name: string
          key_size?: number
          key_type: string
          last_rotated_at?: string | null
          last_used_at?: string | null
          next_rotation_at?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          rotation_period?: number | null
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          access_log?: Json | null
          algorithm?: string
          compromised_at?: string | null
          created_at?: string | null
          created_by?: string
          encrypted_key?: string
          id?: string
          key_hash?: string
          key_name?: string
          key_size?: number
          key_type?: string
          last_rotated_at?: string | null
          last_used_at?: string | null
          next_rotation_at?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          rotation_period?: number | null
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      expense_reports: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          company_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          employee_id: string
          expense_date: string
          id: string
          receipt_url: string | null
          reimbursed_at: string | null
          status: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          company_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          employee_id: string
          expense_date: string
          id?: string
          receipt_url?: string | null
          reimbursed_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          company_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          employee_id?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          reimbursed_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_reports_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_reports_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          company_id: string | null
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          flag_name: string
          id: string
          is_enabled: boolean | null
          rollout_percentage: number | null
          start_date: string | null
          target_audience: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          flag_name: string
          id?: string
          is_enabled?: boolean | null
          rollout_percentage?: number | null
          start_date?: string | null
          target_audience?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          flag_name?: string
          id?: string
          is_enabled?: boolean | null
          rollout_percentage?: number | null
          start_date?: string | null
          target_audience?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage_tracking: {
        Row: {
          company_id: string | null
          created_at: string | null
          feature_name: string
          id: string
          last_used: string | null
          metadata: Json | null
          session_id: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          feature_name: string
          id?: string
          last_used?: string | null
          metadata?: Json | null
          session_id?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          feature_name?: string
          id?: string
          last_used?: string | null
          metadata?: Json | null
          session_id?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_usage_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fec_exports: {
        Row: {
          checksum: string | null
          company_id: string
          created_at: string | null
          download_count: number | null
          end_date: string
          expires_at: string | null
          export_year: number
          file_size: number | null
          file_url: string | null
          generated_at: string | null
          id: string
          include_documents: boolean | null
          last_downloaded_at: string | null
          requested_by: string
          start_date: string
          status: string | null
        }
        Insert: {
          checksum?: string | null
          company_id: string
          created_at?: string | null
          download_count?: number | null
          end_date: string
          expires_at?: string | null
          export_year: number
          file_size?: number | null
          file_url?: string | null
          generated_at?: string | null
          id?: string
          include_documents?: boolean | null
          last_downloaded_at?: string | null
          requested_by: string
          start_date: string
          status?: string | null
        }
        Update: {
          checksum?: string | null
          company_id?: string
          created_at?: string | null
          download_count?: number | null
          end_date?: string
          expires_at?: string | null
          export_year?: number
          file_size?: number | null
          file_url?: string | null
          generated_at?: string | null
          id?: string
          include_documents?: boolean | null
          last_downloaded_at?: string | null
          requested_by?: string
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fec_exports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      file_uploads: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          deleted_at: string | null
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          file_hash: string | null
          file_path: string
          file_size_bytes: number
          file_url: string | null
          filename: string
          id: string
          is_public: boolean
          mime_type: string
          original_filename: string
          storage_bucket: string
          uploaded_by: string | null
          virus_scan_at: string | null
          virus_scan_status: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          deleted_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          file_hash?: string | null
          file_path: string
          file_size_bytes: number
          file_url?: string | null
          filename: string
          id?: string
          is_public?: boolean
          mime_type: string
          original_filename: string
          storage_bucket?: string
          uploaded_by?: string | null
          virus_scan_at?: string | null
          virus_scan_status?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          file_hash?: string | null
          file_path?: string
          file_size_bytes?: number
          file_url?: string | null
          filename?: string
          id?: string
          is_public?: boolean
          mime_type?: string
          original_filename?: string
          storage_bucket?: string
          uploaded_by?: string | null
          virus_scan_at?: string | null
          virus_scan_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports: {
        Row: {
          access_level: string | null
          company_id: string
          created_at: string | null
          currency: string | null
          data: Json | null
          download_count: number | null
          file_format: string | null
          file_path: string | null
          file_size: number | null
          file_url: string | null
          format: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          include_charts: boolean | null
          include_notes: boolean | null
          last_downloaded_at: string | null
          name: string
          period_end: string | null
          period_start: string | null
          show_variance: boolean | null
          status: string | null
          storage_uploaded: boolean | null
          type: string
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          company_id: string
          created_at?: string | null
          currency?: string | null
          data?: Json | null
          download_count?: number | null
          file_format?: string | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          format?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          include_charts?: boolean | null
          include_notes?: boolean | null
          last_downloaded_at?: string | null
          name: string
          period_end?: string | null
          period_start?: string | null
          show_variance?: boolean | null
          status?: string | null
          storage_uploaded?: boolean | null
          type: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          company_id?: string
          created_at?: string | null
          currency?: string | null
          data?: Json | null
          download_count?: number | null
          file_format?: string | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          format?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          include_charts?: boolean | null
          include_notes?: boolean | null
          last_downloaded_at?: string | null
          name?: string
          period_end?: string | null
          period_start?: string | null
          show_variance?: boolean | null
          status?: string | null
          storage_uploaded?: boolean | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_country_templates: {
        Row: {
          accounting_standard: string
          compliance_requirements: Json
          country_code: string
          country_name: string
          created_at: string | null
          default_currency: string
          default_tax_accounts: Json
          default_vat_config: Json
          depreciation_rates: Json
          fiscal_year_end: string
          id: string
          is_active: boolean | null
          payroll_tax_config: Json
          updated_at: string | null
        }
        Insert: {
          accounting_standard: string
          compliance_requirements?: Json
          country_code: string
          country_name: string
          created_at?: string | null
          default_currency: string
          default_tax_accounts?: Json
          default_vat_config?: Json
          depreciation_rates?: Json
          fiscal_year_end?: string
          id?: string
          is_active?: boolean | null
          payroll_tax_config?: Json
          updated_at?: string | null
        }
        Update: {
          accounting_standard?: string
          compliance_requirements?: Json
          country_code?: string
          country_name?: string
          created_at?: string | null
          default_currency?: string
          default_tax_accounts?: Json
          default_vat_config?: Json
          depreciation_rates?: Json
          fiscal_year_end?: string
          id?: string
          is_active?: boolean | null
          payroll_tax_config?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      fixed_assets: {
        Row: {
          accumulated_depreciation: number | null
          acquisition_cost: number
          acquisition_date: string
          asset_account_id: string | null
          asset_number: string | null
          category: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          depreciation_account_id: string | null
          depreciation_method: string
          depreciation_rate: number | null
          description: string | null
          disposal_amount: number | null
          disposal_date: string | null
          end_depreciation_date: string | null
          expense_account_id: string | null
          id: string
          name: string
          salvage_value: number | null
          start_depreciation_date: string
          status: string | null
          updated_at: string | null
          useful_life_years: number
        }
        Insert: {
          accumulated_depreciation?: number | null
          acquisition_cost: number
          acquisition_date: string
          asset_account_id?: string | null
          asset_number?: string | null
          category?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          depreciation_account_id?: string | null
          depreciation_method: string
          depreciation_rate?: number | null
          description?: string | null
          disposal_amount?: number | null
          disposal_date?: string | null
          end_depreciation_date?: string | null
          expense_account_id?: string | null
          id?: string
          name: string
          salvage_value?: number | null
          start_depreciation_date: string
          status?: string | null
          updated_at?: string | null
          useful_life_years: number
        }
        Update: {
          accumulated_depreciation?: number | null
          acquisition_cost?: number
          acquisition_date?: string
          asset_account_id?: string | null
          asset_number?: string | null
          category?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          depreciation_account_id?: string | null
          depreciation_method?: string
          depreciation_rate?: number | null
          description?: string | null
          disposal_amount?: number | null
          disposal_date?: string | null
          end_depreciation_date?: string | null
          expense_account_id?: string | null
          id?: string
          name?: string
          salvage_value?: number | null
          start_depreciation_date?: string
          status?: string | null
          updated_at?: string | null
          useful_life_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_asset_account_id_fkey"
            columns: ["asset_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_depreciation_account_id_fkey"
            columns: ["depreciation_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_expense_account_id_fkey"
            columns: ["expense_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_line_items: {
        Row: {
          amount: number
          cash_flow_type: string | null
          category: string
          confidence_level: string | null
          created_at: string | null
          description: string | null
          forecast_id: string
          growth_rate: number | null
          id: string
          is_recurring: boolean | null
          item_type: string
          probability: number | null
          seasonality_factor: number | null
          subcategory: string | null
          timing: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          cash_flow_type?: string | null
          category: string
          confidence_level?: string | null
          created_at?: string | null
          description?: string | null
          forecast_id: string
          growth_rate?: number | null
          id?: string
          is_recurring?: boolean | null
          item_type: string
          probability?: number | null
          seasonality_factor?: number | null
          subcategory?: string | null
          timing?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          cash_flow_type?: string | null
          category?: string
          confidence_level?: string | null
          created_at?: string | null
          description?: string | null
          forecast_id?: string
          growth_rate?: number | null
          id?: string
          is_recurring?: boolean | null
          item_type?: string
          probability?: number | null
          seasonality_factor?: number | null
          subcategory?: string | null
          timing?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forecast_line_items_forecast_id_fkey"
            columns: ["forecast_id"]
            isOneToOne: false
            referencedRelation: "forecasts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forecast_line_items_forecast_id_fkey"
            columns: ["forecast_id"]
            isOneToOne: false
            referencedRelation: "forecasts_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_periods: {
        Row: {
          company_id: string
          created_at: string | null
          end_date: string
          id: string
          name: string
          period_type: string
          start_date: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          period_type: string
          start_date: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          period_type?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecast_periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_scenarios: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          growth_rate: number | null
          id: string
          market_conditions: string | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          growth_rate?: number | null
          id?: string
          market_conditions?: string | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          growth_rate?: number | null
          id?: string
          market_conditions?: string | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forecast_scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      forecasts: {
        Row: {
          break_even_point: number | null
          cash_flow_items: Json | null
          company_id: string
          created_at: string | null
          created_by: string | null
          expense_items: Json | null
          gross_margin: number | null
          id: string
          key_assumptions: Json | null
          name: string
          net_cash_flow: number | null
          net_margin: number | null
          opportunities: Json | null
          period_id: string
          revenue_items: Json | null
          risk_factors: Json | null
          scenario_id: string
          status: string
          total_expenses: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          break_even_point?: number | null
          cash_flow_items?: Json | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          expense_items?: Json | null
          gross_margin?: number | null
          id?: string
          key_assumptions?: Json | null
          name: string
          net_cash_flow?: number | null
          net_margin?: number | null
          opportunities?: Json | null
          period_id: string
          revenue_items?: Json | null
          risk_factors?: Json | null
          scenario_id: string
          status?: string
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          break_even_point?: number | null
          cash_flow_items?: Json | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          expense_items?: Json | null
          gross_margin?: number | null
          id?: string
          key_assumptions?: Json | null
          name?: string
          net_cash_flow?: number | null
          net_margin?: number | null
          opportunities?: Json | null
          period_id?: string
          revenue_items?: Json | null
          risk_factors?: Json | null
          scenario_id?: string
          status?: string
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forecasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forecasts_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "forecast_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forecasts_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "forecast_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_contracts: {
        Row: {
          archive_reference: string | null
          archived_at: string | null
          can_be_destroyed: boolean | null
          company_id: string
          contract_data: Json | null
          contract_format: string
          contract_name: string
          contract_type: string
          contract_value: number | null
          created_at: string | null
          currency: string | null
          end_date: string | null
          file_format: string | null
          file_path: string | null
          file_size_bytes: number | null
          file_url: string | null
          generated_at: string | null
          generated_by: string | null
          generation_config: Json | null
          id: string
          is_archived: boolean | null
          notes: string | null
          party_name: string | null
          type: string | null
          retention_until: string | null
          signature_date: string | null
          signed_at: string | null
          signed_by: string | null
          start_date: string
          status: string
          storage_bucket: string | null
          tags: string[] | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          archive_reference?: string | null
          archived_at?: string | null
          can_be_destroyed?: boolean | null
          company_id: string
          contract_data?: Json | null
          contract_format?: string
          contract_name: string
          contract_type: string
          contract_value?: number | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          file_format?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          generation_config?: Json | null
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          party_name?: string | null
          type?: string | null
          retention_until?: string | null
          signature_date?: string | null
          signed_at?: string | null
          signed_by?: string | null
          start_date: string
          status?: string
          storage_bucket?: string | null
          tags?: string[] | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          archive_reference?: string | null
          archived_at?: string | null
          can_be_destroyed?: boolean | null
          company_id?: string
          contract_data?: Json | null
          contract_format?: string
          contract_name?: string
          contract_type?: string
          contract_value?: number | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          file_format?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          generation_config?: Json | null
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          party_name?: string | null
          type?: string | null
          retention_until?: string | null
          signature_date?: string | null
          signed_at?: string | null
          signed_by?: string | null
          start_date?: string
          status?: string
          storage_bucket?: string | null
          tags?: string[] | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          archive_reference: string | null
          archived_at: string | null
          can_be_destroyed: boolean | null
          company_id: string
          created_at: string | null
          currency: string | null
          delivery_date: string | null
          file_format: string | null
          file_path: string | null
          file_size_bytes: number | null
          file_url: string | null
          generated_at: string | null
          generated_by: string | null
          generation_config: Json | null
          id: string
          is_archived: boolean | null
          notes: string | null
          order_data: Json | null
          order_date: string
          order_name: string
          order_number: string | null
          order_type: string
          payment_due_date: string | null
          retention_until: string | null
          status: string
          storage_bucket: string | null
          subtotal: number | null
          supplier_id: string | null
          supplier_name: string
          tags: string[] | null
          tax_amount: number | null
          template_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          archive_reference?: string | null
          archived_at?: string | null
          can_be_destroyed?: boolean | null
          company_id: string
          created_at?: string | null
          currency?: string | null
          delivery_date?: string | null
          file_format?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          generation_config?: Json | null
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          order_data?: Json | null
          order_date: string
          order_name: string
          order_number?: string | null
          order_type?: string
          payment_due_date?: string | null
          retention_until?: string | null
          status?: string
          storage_bucket?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          supplier_name: string
          tags?: string[] | null
          tax_amount?: number | null
          template_id?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          archive_reference?: string | null
          archived_at?: string | null
          can_be_destroyed?: boolean | null
          company_id?: string
          created_at?: string | null
          currency?: string | null
          delivery_date?: string | null
          file_format?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          generation_config?: Json | null
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          order_data?: Json | null
          order_date?: string
          order_name?: string
          order_number?: string | null
          order_type?: string
          payment_due_date?: string | null
          retention_until?: string | null
          status?: string
          storage_bucket?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          supplier_name?: string
          tags?: string[] | null
          tax_amount?: number | null
          template_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reports: {
        Row: {
          access_level: string | null
          approved_at: string | null
          approved_by: string | null
          archive_reference: string | null
          archived_at: string | null
          can_be_destroyed: boolean | null
          company_id: string
          created_at: string | null
          file_format: string | null
          file_path: string | null
          file_size_bytes: number | null
          file_url: string | null
          fiscal_year: number | null
          generated_at: string | null
          generated_by: string | null
          generation_config: Json | null
          id: string
          is_archived: boolean | null
          notes: string | null
          period_end: string
          period_start: string
          report_data: Json | null
          report_format: string
          report_name: string
          report_type: string
          retention_until: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shared_with: string[] | null
          status: string
          storage_bucket: string | null
          tags: string[] | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          approved_at?: string | null
          approved_by?: string | null
          archive_reference?: string | null
          archived_at?: string | null
          can_be_destroyed?: boolean | null
          company_id: string
          created_at?: string | null
          file_format?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          fiscal_year?: number | null
          generated_at?: string | null
          generated_by?: string | null
          generation_config?: Json | null
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          period_end: string
          period_start: string
          report_data?: Json | null
          report_format?: string
          report_name: string
          report_type: string
          retention_until?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shared_with?: string[] | null
          status?: string
          storage_bucket?: string | null
          tags?: string[] | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          approved_at?: string | null
          approved_by?: string | null
          archive_reference?: string | null
          archived_at?: string | null
          can_be_destroyed?: boolean | null
          company_id?: string
          created_at?: string | null
          file_format?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          fiscal_year?: number | null
          generated_at?: string | null
          generated_by?: string | null
          generation_config?: Json | null
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          period_end?: string
          period_start?: string
          report_data?: Json | null
          report_format?: string
          report_name?: string
          report_type?: string
          retention_until?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shared_with?: string[] | null
          status?: string
          storage_bucket?: string | null
          tags?: string[] | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_tax_declarations: {
        Row: {
          archive_reference: string | null
          archived_at: string | null
          can_be_destroyed: boolean | null
          company_id: string
          created_at: string | null
          declaration_data: Json | null
          declaration_format: string
          declaration_name: string
          declaration_period: string | null
          declaration_type: string
          file_format: string | null
          file_path: string | null
          file_size_bytes: number | null
          file_url: string | null
          fiscal_year: number
          generated_at: string | null
          generated_by: string | null
          generation_config: Json | null
          id: string
          is_archived: boolean | null
          notes: string | null
          period_end: string
          period_start: string
          retention_until: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_bucket: string | null
          submission_reference: string | null
          submitted_at: string | null
          submitted_by: string | null
          tags: string[] | null
          tax_amount: number | null
          tax_base: number | null
          tax_credit: number | null
          tax_due: number | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          archive_reference?: string | null
          archived_at?: string | null
          can_be_destroyed?: boolean | null
          company_id: string
          created_at?: string | null
          declaration_data?: Json | null
          declaration_format?: string
          declaration_name: string
          declaration_period?: string | null
          declaration_type: string
          file_format?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          fiscal_year: number
          generated_at?: string | null
          generated_by?: string | null
          generation_config?: Json | null
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          period_end: string
          period_start: string
          retention_until?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_bucket?: string | null
          submission_reference?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          tags?: string[] | null
          tax_amount?: number | null
          tax_base?: number | null
          tax_credit?: number | null
          tax_due?: number | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          archive_reference?: string | null
          archived_at?: string | null
          can_be_destroyed?: boolean | null
          company_id?: string
          created_at?: string | null
          declaration_data?: Json | null
          declaration_format?: string
          declaration_name?: string
          declaration_period?: string | null
          declaration_type?: string
          file_format?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          fiscal_year?: number
          generated_at?: string | null
          generated_by?: string | null
          generation_config?: Json | null
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          period_end?: string
          period_start?: string
          retention_until?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_bucket?: string | null
          submission_reference?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          tags?: string[] | null
          tax_amount?: number | null
          tax_base?: number | null
          tax_credit?: number | null
          tax_due?: number | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_tax_declarations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_certifications: {
        Row: {
          certificate_url: string | null
          certification_name: string
          certification_type: string | null
          company_id: string
          created_at: string
          credential_id: string | null
          credential_url: string | null
          employee_id: string
          expiry_date: string | null
          id: string
          is_active: boolean | null
          issue_date: string
          issuing_organization: string
          training_enrollment_id: string | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          certificate_url?: string | null
          certification_name: string
          certification_type?: string | null
          company_id: string
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date: string
          issuing_organization: string
          training_enrollment_id?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          certificate_url?: string | null
          certification_name?: string
          certification_type?: string | null
          company_id?: string
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string
          issuing_organization?: string
          training_enrollment_id?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_certifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_certifications_training_enrollment_id_fkey"
            columns: ["training_enrollment_id"]
            isOneToOne: false
            referencedRelation: "hr_training_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_document_archive: {
        Row: {
          archive_reference: string
          archive_type: string
          archived_at: string | null
          archived_by: string | null
          can_be_destroyed: boolean | null
          checksum: string | null
          company_id: string
          created_at: string | null
          document_date: string
          document_id: string | null
          document_name: string
          employee_id: string | null
          file_size_bytes: number | null
          id: string
          notes: string | null
          retention_until: string | null
          retention_years: number | null
          storage_path: string
          storage_url: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          archive_reference: string
          archive_type: string
          archived_at?: string | null
          archived_by?: string | null
          can_be_destroyed?: boolean | null
          checksum?: string | null
          company_id: string
          created_at?: string | null
          document_date: string
          document_id?: string | null
          document_name: string
          employee_id?: string | null
          file_size_bytes?: number | null
          id?: string
          notes?: string | null
          retention_until?: string | null
          retention_years?: number | null
          storage_path: string
          storage_url: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          archive_reference?: string
          archive_type?: string
          archived_at?: string | null
          archived_by?: string | null
          can_be_destroyed?: boolean | null
          checksum?: string | null
          company_id?: string
          created_at?: string | null
          document_date?: string
          document_id?: string | null
          document_name?: string
          employee_id?: string | null
          file_size_bytes?: number | null
          id?: string
          notes?: string | null
          retention_until?: string | null
          retention_years?: number | null
          storage_path?: string
          storage_url?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_document_archive_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_document_archive_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "hr_generated_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_document_archive_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_document_templates: {
        Row: {
          auto_archive: boolean | null
          category: string
          company_id: string
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          requires_signature: boolean | null
          template_type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          auto_archive?: boolean | null
          category: string
          company_id: string
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          requires_signature?: boolean | null
          template_type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          auto_archive?: boolean | null
          category?: string
          company_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          requires_signature?: boolean | null
          template_type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_document_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_documents: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          document_type: string
          employee_id: string
          expiry_date: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_confidential: boolean
          issue_date: string | null
          mime_type: string | null
          notes: string | null
          previous_version_id: string | null
          requires_signature: boolean
          signed_by: string | null
          signed_date: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string
          version: number
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          document_type: string
          employee_id: string
          expiry_date?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_confidential?: boolean
          issue_date?: string | null
          mime_type?: string | null
          notes?: string | null
          previous_version_id?: string | null
          requires_signature?: boolean
          signed_by?: string | null
          signed_date?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by: string
          version?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          document_type?: string
          employee_id?: string
          expiry_date?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_confidential?: boolean
          issue_date?: string | null
          mime_type?: string | null
          notes?: string | null
          previous_version_id?: string | null
          requires_signature?: boolean
          signed_by?: string | null
          signed_date?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_documents_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "hr_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employees: {
        Row: {
          address: string | null
          city: string | null
          company_id: string
          contract_type: string | null
          country: string | null
          created_at: string
          department: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          end_date: string | null
          first_name: string
          full_name: string | null
          hire_date: string
          id: string
          last_name: string
          manager_id: string | null
          notes: string | null
          phone: string | null
          position: string
          postal_code: string | null
          salary: number | null
          salary_currency: string | null
          social_security_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id: string
          contract_type?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          end_date?: string | null
          first_name: string
          full_name?: string | null
          hire_date: string
          id?: string
          last_name: string
          manager_id?: string | null
          notes?: string | null
          phone?: string | null
          position: string
          postal_code?: string | null
          salary?: number | null
          salary_currency?: string | null
          social_security_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string
          contract_type?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          end_date?: string | null
          first_name?: string
          full_name?: string | null
          hire_date?: string
          id?: string
          last_name?: string
          manager_id?: string | null
          notes?: string | null
          phone?: string | null
          position?: string
          postal_code?: string | null
          salary?: number | null
          salary_currency?: string | null
          social_security_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          company_id: string
          created_at: string
          currency: string
          description: string
          employee_id: string
          expense_date: string
          id: string
          notes: string | null
          receipt_url: string | null
          reimbursed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          company_id: string
          created_at?: string
          currency?: string
          description: string
          employee_id: string
          expense_date: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          reimbursed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          company_id?: string
          created_at?: string
          currency?: string
          description?: string
          employee_id?: string
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          reimbursed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_expenses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_feedback: {
        Row: {
          category: string | null
          company_id: string
          content: string
          created_at: string
          employee_id: string
          feedback_date: string
          feedback_type: string
          from_employee_id: string | null
          from_manager_id: string | null
          id: string
          is_anonymous: boolean | null
          is_private: boolean | null
          response: string | null
          response_date: string | null
          updated_at: string
          visibility: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          content: string
          created_at?: string
          employee_id: string
          feedback_date?: string
          feedback_type: string
          from_employee_id?: string | null
          from_manager_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_private?: boolean | null
          response?: string | null
          response_date?: string | null
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          content?: string
          created_at?: string
          employee_id?: string
          feedback_date?: string
          feedback_type?: string
          from_employee_id?: string | null
          from_manager_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_private?: boolean | null
          response?: string | null
          response_date?: string | null
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_feedback_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_feedback_from_employee_id_fkey"
            columns: ["from_employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_feedback_from_manager_id_fkey"
            columns: ["from_manager_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_generated_documents: {
        Row: {
          archive_reference: string | null
          archived_by: string | null
          archived_date: string | null
          company_id: string
          created_at: string | null
          document_name: string
          document_type: string
          employee_id: string | null
          generated_at: string | null
          generated_by: string | null
          generated_content: string
          id: string
          is_archived: boolean | null
          original_url: string | null
          pdf_url: string | null
          requires_signature: boolean | null
          sent_date: string | null
          signature_data: Json | null
          signature_status: string | null
          signed_by: string | null
          signed_date: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
          variables_data: Json | null
        }
        Insert: {
          archive_reference?: string | null
          archived_by?: string | null
          archived_date?: string | null
          company_id: string
          created_at?: string | null
          document_name: string
          document_type: string
          employee_id?: string | null
          generated_at?: string | null
          generated_by?: string | null
          generated_content: string
          id?: string
          is_archived?: boolean | null
          original_url?: string | null
          pdf_url?: string | null
          requires_signature?: boolean | null
          sent_date?: string | null
          signature_data?: Json | null
          signature_status?: string | null
          signed_by?: string | null
          signed_date?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          variables_data?: Json | null
        }
        Update: {
          archive_reference?: string | null
          archived_by?: string | null
          archived_date?: string | null
          company_id?: string
          created_at?: string | null
          document_name?: string
          document_type?: string
          employee_id?: string | null
          generated_at?: string | null
          generated_by?: string | null
          generated_content?: string
          id?: string
          is_archived?: boolean | null
          original_url?: string | null
          pdf_url?: string | null
          requires_signature?: boolean | null
          sent_date?: string | null
          signature_data?: Json | null
          signature_status?: string | null
          signed_by?: string | null
          signed_date?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          variables_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_generated_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_generated_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_generated_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "hr_document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leaves: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          days_count: number
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          days_count: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          days_count?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_leaves_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_objectives: {
        Row: {
          category: string | null
          company_id: string
          completion_date: string | null
          created_at: string
          current_value: number | null
          cycle_id: string | null
          description: string | null
          due_date: string
          employee_id: string
          id: string
          key_results: Json | null
          manager_id: string | null
          objective: string | null
          parent_objective_id: string | null
          progress_percentage: number | null
          start_date: string
          status: string
          target_value: number | null
          title: string
          type: string | null
          unit: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          category?: string | null
          company_id: string
          completion_date?: string | null
          created_at?: string
          current_value?: number | null
          cycle_id?: string | null
          description?: string | null
          due_date: string
          employee_id: string
          id?: string
          key_results?: Json | null
          manager_id?: string | null
          objective?: string | null
          parent_objective_id?: string | null
          progress_percentage?: number | null
          start_date: string
          status?: string
          target_value?: number | null
          title: string
          type?: string | null
          unit?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          category?: string | null
          company_id?: string
          completion_date?: string | null
          created_at?: string
          current_value?: number | null
          cycle_id?: string | null
          description?: string | null
          due_date?: string
          employee_id?: string
          id?: string
          key_results?: Json | null
          manager_id?: string | null
          objective?: string | null
          parent_objective_id?: string | null
          progress_percentage?: number | null
          start_date?: string
          status?: string
          target_value?: number | null
          title?: string
          type?: string | null
          unit?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_objectives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_objectives_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "hr_performance_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_objectives_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_objectives_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_objectives_parent_objective_id_fkey"
            columns: ["parent_objective_id"]
            isOneToOne: false
            referencedRelation: "hr_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_payroll: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string
          gross_salary: number
          id: string
          journal_entry_id: string | null
          net_salary: number
          notes: string | null
          payment_date: string | null
          payslip_url: string | null
          period_end: string
          period_start: string
          social_charges_employee: number | null
          social_charges_employer: number | null
          status: string
          tax_withholding: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id: string
          gross_salary: number
          id?: string
          journal_entry_id?: string | null
          net_salary: number
          notes?: string | null
          payment_date?: string | null
          payslip_url?: string | null
          period_end: string
          period_start: string
          social_charges_employee?: number | null
          social_charges_employer?: number | null
          status?: string
          tax_withholding?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string
          gross_salary?: number
          id?: string
          journal_entry_id?: string | null
          net_salary?: number
          notes?: string | null
          payment_date?: string | null
          payslip_url?: string | null
          period_end?: string
          period_start?: string
          social_charges_employee?: number | null
          social_charges_employer?: number | null
          status?: string
          tax_withholding?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_payroll_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payroll_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_performance_cycles: {
        Row: {
          company_id: string
          created_at: string
          end_date: string
          id: string
          name: string
          review_deadline: string
          start_date: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          end_date: string
          id?: string
          name: string
          review_deadline: string
          start_date: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          review_deadline?: string
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_performance_cycles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_performance_reviews: {
        Row: {
          achievements: string | null
          acknowledged_date: string | null
          areas_for_improvement: string | null
          collaboration_rating: number | null
          company_id: string
          competencies_ratings: Json | null
          completed_date: string | null
          created_at: string
          cycle_id: string | null
          development_plan: string | null
          employee_comments: string | null
          employee_id: string
          goals_achieved: number | null
          goals_notes: string | null
          goals_total: number | null
          id: string
          initiative_rating: number | null
          leadership_rating: number | null
          manager_comments: string | null
          overall_rating: number | null
          pip_required: boolean | null
          promotion_recommended: boolean | null
          raise_percentage: number | null
          raise_recommended: boolean | null
          review_date: string
          review_type: string
          reviewer_id: string
          soft_skills_rating: number | null
          status: string
          strengths: string | null
          submitted_date: string | null
          technical_skills_rating: number | null
          updated_at: string
        }
        Insert: {
          achievements?: string | null
          acknowledged_date?: string | null
          areas_for_improvement?: string | null
          collaboration_rating?: number | null
          company_id: string
          competencies_ratings?: Json | null
          completed_date?: string | null
          created_at?: string
          cycle_id?: string | null
          development_plan?: string | null
          employee_comments?: string | null
          employee_id: string
          goals_achieved?: number | null
          goals_notes?: string | null
          goals_total?: number | null
          id?: string
          initiative_rating?: number | null
          leadership_rating?: number | null
          manager_comments?: string | null
          overall_rating?: number | null
          pip_required?: boolean | null
          promotion_recommended?: boolean | null
          raise_percentage?: number | null
          raise_recommended?: boolean | null
          review_date: string
          review_type: string
          reviewer_id: string
          soft_skills_rating?: number | null
          status?: string
          strengths?: string | null
          submitted_date?: string | null
          technical_skills_rating?: number | null
          updated_at?: string
        }
        Update: {
          achievements?: string | null
          acknowledged_date?: string | null
          areas_for_improvement?: string | null
          collaboration_rating?: number | null
          company_id?: string
          competencies_ratings?: Json | null
          completed_date?: string | null
          created_at?: string
          cycle_id?: string | null
          development_plan?: string | null
          employee_comments?: string | null
          employee_id?: string
          goals_achieved?: number | null
          goals_notes?: string | null
          goals_total?: number | null
          id?: string
          initiative_rating?: number | null
          leadership_rating?: number | null
          manager_comments?: string | null
          overall_rating?: number | null
          pip_required?: boolean | null
          promotion_recommended?: boolean | null
          raise_percentage?: number | null
          raise_recommended?: boolean | null
          review_date?: string
          review_type?: string
          reviewer_id?: string
          soft_skills_rating?: number | null
          status?: string
          strengths?: string | null
          submitted_date?: string | null
          technical_skills_rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_performance_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_performance_reviews_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "hr_performance_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_skills_matrix: {
        Row: {
          certifications: string[] | null
          company_id: string
          created_at: string
          development_plan: string | null
          employee_id: string
          id: string
          last_used_date: string | null
          manager_validated: boolean | null
          proficiency_level: string
          proficiency_score: number | null
          projects: string[] | null
          self_assessed: boolean | null
          skill_category: string | null
          skill_name: string
          target_level: string | null
          updated_at: string
          validated_by: string | null
          validation_date: string | null
          years_of_experience: number | null
        }
        Insert: {
          certifications?: string[] | null
          company_id: string
          created_at?: string
          development_plan?: string | null
          employee_id: string
          id?: string
          last_used_date?: string | null
          manager_validated?: boolean | null
          proficiency_level: string
          proficiency_score?: number | null
          projects?: string[] | null
          self_assessed?: boolean | null
          skill_category?: string | null
          skill_name: string
          target_level?: string | null
          updated_at?: string
          validated_by?: string | null
          validation_date?: string | null
          years_of_experience?: number | null
        }
        Update: {
          certifications?: string[] | null
          company_id?: string
          created_at?: string
          development_plan?: string | null
          employee_id?: string
          id?: string
          last_used_date?: string | null
          manager_validated?: boolean | null
          proficiency_level?: string
          proficiency_score?: number | null
          projects?: string[] | null
          self_assessed?: boolean | null
          skill_category?: string | null
          skill_name?: string
          target_level?: string | null
          updated_at?: string
          validated_by?: string | null
          validation_date?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_skills_matrix_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_skills_matrix_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_skills_matrix_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_time_tracking: {
        Row: {
          break_minutes: number | null
          company_id: string
          created_at: string
          employee_id: string
          hours_worked: number
          id: string
          overtime_hours: number | null
          project: string | null
          status: string
          task_description: string | null
          updated_at: string
          work_date: string
        }
        Insert: {
          break_minutes?: number | null
          company_id: string
          created_at?: string
          employee_id: string
          hours_worked?: number
          id?: string
          overtime_hours?: number | null
          project?: string | null
          status?: string
          task_description?: string | null
          updated_at?: string
          work_date: string
        }
        Update: {
          break_minutes?: number | null
          company_id?: string
          created_at?: string
          employee_id?: string
          hours_worked?: number
          id?: string
          overtime_hours?: number | null
          project?: string | null
          status?: string
          task_description?: string | null
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_time_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_time_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_training_catalog: {
        Row: {
          category: string | null
          certification_name: string | null
          certification_validity_months: number | null
          company_id: string
          cost_per_participant: number | null
          created_at: string
          currency: string | null
          description: string | null
          duration_hours: number
          format: string | null
          id: string
          is_mandatory: boolean | null
          materials_url: string | null
          max_participants: number | null
          objectives: string[] | null
          prerequisites: string | null
          program: string | null
          provider: string | null
          provides_certification: boolean | null
          required_level: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          certification_name?: string | null
          certification_validity_months?: number | null
          company_id: string
          cost_per_participant?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_hours: number
          format?: string | null
          id?: string
          is_mandatory?: boolean | null
          materials_url?: string | null
          max_participants?: number | null
          objectives?: string[] | null
          prerequisites?: string | null
          program?: string | null
          provider?: string | null
          provides_certification?: boolean | null
          required_level?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          certification_name?: string | null
          certification_validity_months?: number | null
          company_id?: string
          cost_per_participant?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_hours?: number
          format?: string | null
          id?: string
          is_mandatory?: boolean | null
          materials_url?: string | null
          max_participants?: number | null
          objectives?: string[] | null
          prerequisites?: string | null
          program?: string | null
          provider?: string | null
          provides_certification?: boolean | null
          required_level?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_training_catalog_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_training_enrollments: {
        Row: {
          attendance_date: string | null
          certificate_issued_date: string | null
          certificate_url: string | null
          company_id: string
          completion_date: string | null
          cost: number | null
          created_at: string
          employee_id: string
          enrolled_by: string | null
          feedback: string | null
          id: string
          passed: boolean | null
          rating: number | null
          registration_date: string
          reimbursement_status: string | null
          score: number | null
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attendance_date?: string | null
          certificate_issued_date?: string | null
          certificate_url?: string | null
          company_id: string
          completion_date?: string | null
          cost?: number | null
          created_at?: string
          employee_id: string
          enrolled_by?: string | null
          feedback?: string | null
          id?: string
          passed?: boolean | null
          rating?: number | null
          registration_date?: string
          reimbursement_status?: string | null
          score?: number | null
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string | null
          certificate_issued_date?: string | null
          certificate_url?: string | null
          company_id?: string
          completion_date?: string | null
          cost?: number | null
          created_at?: string
          employee_id?: string
          enrolled_by?: string | null
          feedback?: string | null
          id?: string
          passed?: boolean | null
          rating?: number | null
          registration_date?: string
          reimbursement_status?: string | null
          score?: number | null
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_training_enrollments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_training_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_training_enrollments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "hr_training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_training_sessions: {
        Row: {
          attended_count: number | null
          average_rating: number | null
          budget_code: string | null
          company_id: string
          created_at: string
          end_date: string
          end_time: string | null
          feedback_count: number | null
          id: string
          location: string | null
          max_participants: number | null
          meeting_link: string | null
          registered_count: number | null
          session_name: string
          start_date: string
          start_time: string | null
          status: string
          timezone: string | null
          total_cost: number | null
          trainer_id: string | null
          trainer_name: string | null
          training_id: string
          updated_at: string
        }
        Insert: {
          attended_count?: number | null
          average_rating?: number | null
          budget_code?: string | null
          company_id: string
          created_at?: string
          end_date: string
          end_time?: string | null
          feedback_count?: number | null
          id?: string
          location?: string | null
          max_participants?: number | null
          meeting_link?: string | null
          registered_count?: number | null
          session_name: string
          start_date: string
          start_time?: string | null
          status?: string
          timezone?: string | null
          total_cost?: number | null
          trainer_id?: string | null
          trainer_name?: string | null
          training_id: string
          updated_at?: string
        }
        Update: {
          attended_count?: number | null
          average_rating?: number | null
          budget_code?: string | null
          company_id?: string
          created_at?: string
          end_date?: string
          end_time?: string | null
          feedback_count?: number | null
          id?: string
          location?: string | null
          max_participants?: number | null
          meeting_link?: string | null
          registered_count?: number | null
          session_name?: string
          start_date?: string
          start_time?: string | null
          status?: string
          timezone?: string | null
          total_cost?: number | null
          trainer_id?: string | null
          trainer_name?: string | null
          training_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_training_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_training_sessions_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_training_sessions_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "hr_training_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustments: {
        Row: {
          adjustment_reference: string | null
          adjustment_type: string
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string | null
          created_by: string
          id: string
          location_id: string | null
          notes: string | null
          product_id: string
          product_variant_id: string | null
          quantity_adjusted: number | null
          quantity_after: number
          quantity_before: number
          reason: string
          status: string | null
          unit_cost: number | null
          updated_at: string | null
          value_impact: number | null
          warehouse_id: string
        }
        Insert: {
          adjustment_reference?: string | null
          adjustment_type: string
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string | null
          created_by: string
          id?: string
          location_id?: string | null
          notes?: string | null
          product_id: string
          product_variant_id?: string | null
          quantity_adjusted?: number | null
          quantity_after: number
          quantity_before: number
          reason: string
          status?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          value_impact?: number | null
          warehouse_id: string
        }
        Update: {
          adjustment_reference?: string | null
          adjustment_type?: string
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          product_id?: string
          product_variant_id?: string | null
          quantity_adjusted?: number | null
          quantity_after?: number
          quantity_before?: number
          reason?: string
          status?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          value_impact?: number | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          available_quantity: number | null
          company_id: string
          created_at: string | null
          id: string
          last_count_date: string | null
          last_movement_date: string | null
          location_id: string | null
          maximum_stock: number | null
          minimum_stock: number | null
          product_id: string
          product_variant_id: string | null
          quantity_on_hand: number
          reorder_point: number | null
          reorder_quantity: number | null
          reserved_quantity: number | null
          total_value: number | null
          unit_cost: number | null
          updated_at: string | null
          warehouse_id: string
        }
        Insert: {
          available_quantity?: number | null
          company_id: string
          created_at?: string | null
          id?: string
          last_count_date?: string | null
          last_movement_date?: string | null
          location_id?: string | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          product_id: string
          product_variant_id?: string | null
          quantity_on_hand?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          reserved_quantity?: number | null
          total_value?: number | null
          unit_cost?: number | null
          updated_at?: string | null
          warehouse_id: string
        }
        Update: {
          available_quantity?: number | null
          company_id?: string
          created_at?: string | null
          id?: string
          last_count_date?: string | null
          last_movement_date?: string | null
          location_id?: string | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          product_id?: string
          product_variant_id?: string | null
          quantity_on_hand?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          reserved_quantity?: number | null
          total_value?: number | null
          unit_cost?: number | null
          updated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_locations: {
        Row: {
          accepts_all_products: boolean | null
          aisle: string | null
          bay: string | null
          bin: string | null
          code: string
          company_id: string
          created_at: string | null
          current_capacity: number | null
          description: string | null
          id: string
          is_active: boolean | null
          level: string | null
          max_capacity: number | null
          name: string
          restricted_to_categories: string[] | null
          updated_at: string | null
          warehouse_id: string
        }
        Insert: {
          accepts_all_products?: boolean | null
          aisle?: string | null
          bay?: string | null
          bin?: string | null
          code: string
          company_id: string
          created_at?: string | null
          current_capacity?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          max_capacity?: number | null
          name: string
          restricted_to_categories?: string[] | null
          updated_at?: string | null
          warehouse_id: string
        }
        Update: {
          accepts_all_products?: boolean | null
          aisle?: string | null
          bay?: string | null
          bin?: string | null
          code?: string
          company_id?: string
          created_at?: string | null
          current_capacity?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          max_capacity?: number | null
          name?: string
          restricted_to_categories?: string[] | null
          updated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          batch_number: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          direction: string
          expiry_date: string | null
          id: string
          location_id: string | null
          movement_date: string
          movement_type: string
          notes: string | null
          product_id: string
          product_variant_id: string | null
          quantity: number
          reference_id: string | null
          reference_number: string | null
          reference_type: string | null
          serial_number: string | null
          total_cost: number | null
          unit_cost: number | null
          warehouse_id: string
        }
        Insert: {
          batch_number?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          direction: string
          expiry_date?: string | null
          id?: string
          location_id?: string | null
          movement_date?: string
          movement_type: string
          notes?: string | null
          product_id: string
          product_variant_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string | null
          serial_number?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          warehouse_id: string
        }
        Update: {
          batch_number?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          direction?: string
          expiry_date?: string | null
          id?: string
          location_id?: string | null
          movement_date?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          product_variant_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string | null
          serial_number?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string | null
          discount_rate: number | null
          id: string
          invoice_id: string
          item_type: string | null
          line_order: number | null
          line_total: number | null
          name: string
          notes: string | null
          quantity: number | null
          quote_item_id: string | null
          sku: string | null
          tax_rate: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_rate?: number | null
          id?: string
          invoice_id: string
          item_type?: string | null
          line_order?: number | null
          line_total?: number | null
          name: string
          notes?: string | null
          quantity?: number | null
          quote_item_id?: string | null
          sku?: string | null
          tax_rate?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_rate?: number | null
          id?: string
          invoice_id?: string
          item_type?: string | null
          line_order?: number | null
          line_total?: number | null
          name?: string
          notes?: string | null
          quantity?: number | null
          quote_item_id?: string | null
          sku?: string | null
          tax_rate?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_balances"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_quote_item_id_fkey"
            columns: ["quote_item_id"]
            isOneToOne: false
            referencedRelation: "quote_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          account_id: string | null
          created_at: string | null
          description: string
          discount_amount: number | null
          discount_percent: number | null
          id: string
          invoice_id: string
          line_order: number | null
          line_total_excl_tax: number
          line_total_incl_tax: number
          product_id: string | null
          quantity: number
          tax_amount: number | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          description: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          invoice_id: string
          line_order?: number | null
          line_total_excl_tax?: number
          line_total_incl_tax?: number
          product_id?: string | null
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          description?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          invoice_id?: string
          line_order?: number | null
          line_total_excl_tax?: number
          line_total_incl_tax?: number
          product_id?: string | null
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_balances"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payment_allocations: {
        Row: {
          allocated_amount: number
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string
          payment_id: string
        }
        Insert: {
          allocated_amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id: string
          payment_id: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_balances"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          template_data: Json
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          template_data?: Json
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_id: string | null
          discount_amount: number | null
          due_date: string
          id: string
          internal_notes: string | null
          invoice_date: string
          invoice_number: string
          invoice_type: string
          journal_entry_id: string | null
          notes: string | null
          paid_amount: number
          paid_at: string | null
          payment_date: string | null
          payment_terms: number | null
          quote_id: string | null
          remaining_amount: number
          sent_at: string | null
          status: string
          subtotal_amount: number | null
          subtotal_excl_tax: number
          tax_amount: number | null
          tax_rate: number | null
          third_party_id: string
          title: string | null
          total_amount: number | null
          total_incl_tax: number
          total_tax_amount: number
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          due_date: string
          id?: string
          internal_notes?: string | null
          invoice_date: string
          invoice_number: string
          invoice_type: string
          journal_entry_id?: string | null
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          payment_date?: string | null
          payment_terms?: number | null
          quote_id?: string | null
          remaining_amount?: number
          sent_at?: string | null
          status?: string
          subtotal_amount?: number | null
          subtotal_excl_tax?: number
          tax_amount?: number | null
          tax_rate?: number | null
          third_party_id: string
          title?: string | null
          total_amount?: number | null
          total_incl_tax?: number
          total_tax_amount?: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          due_date?: string
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string
          journal_entry_id?: string | null
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          payment_date?: string | null
          payment_terms?: number | null
          quote_id?: string | null
          remaining_amount?: number
          sent_at?: string | null
          status?: string
          subtotal_amount?: number | null
          subtotal_excl_tax?: number
          tax_amount?: number | null
          tax_rate?: number | null
          third_party_id?: string
          title?: string | null
          total_amount?: number | null
          total_incl_tax?: number
          total_tax_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_third_party_id_fkey"
            columns: ["third_party_id"]
            isOneToOne: false
            referencedRelation: "third_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices_stripe: {
        Row: {
          amount_paid: number
          created_at: string | null
          currency: string
          id: string
          invoice_pdf: string | null
          invoice_url: string | null
          period_end: string | null
          period_start: string | null
          status: string
          stripe_customer_id: string | null
          stripe_invoice_id: string
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          currency?: string
          id?: string
          invoice_pdf?: string | null
          invoice_url?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_invoice_id: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          currency?: string
          id?: string
          invoice_pdf?: string | null
          invoice_url?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_invoice_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          accounting_period_id: string | null
          company_id: string
          created_at: string | null
          description: string
          entry_date: string
          entry_number: string | null
          fec_entry_num: string | null
          fec_journal_code: string | null
          id: string
          imported_from_fec: boolean | null
          journal_id: string
          original_fec_data: Json | null
          reference_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          accounting_period_id?: string | null
          company_id: string
          created_at?: string | null
          description: string
          entry_date: string
          entry_number?: string | null
          fec_entry_num?: string | null
          fec_journal_code?: string | null
          id?: string
          imported_from_fec?: boolean | null
          journal_id: string
          original_fec_data?: Json | null
          reference_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          accounting_period_id?: string | null
          company_id?: string
          created_at?: string | null
          description?: string
          entry_date?: string
          entry_number?: string | null
          fec_entry_num?: string | null
          fec_journal_code?: string | null
          id?: string
          imported_from_fec?: boolean | null
          journal_id?: string
          original_fec_data?: Json | null
          reference_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_accounting_period_id_fkey"
            columns: ["accounting_period_id"]
            isOneToOne: false
            referencedRelation: "accounting_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journals"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_items: {
        Row: {
          account_id: string
          company_id: string
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          journal_entry_id: string
          line_number: number | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          company_id: string
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id: string
          line_number?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          company_id?: string
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string
          line_number?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_items_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_items_backup: {
        Row: {
          account_id: string | null
          company_id: string | null
          created_at: string | null
          credit_amount: number | null
          currency: string | null
          debit_amount: number | null
          description: string | null
          id: string | null
          journal_entry_id: string | null
        }
        Insert: {
          account_id?: string | null
          company_id?: string | null
          created_at?: string | null
          credit_amount?: number | null
          currency?: string | null
          debit_amount?: number | null
          description?: string | null
          id?: string | null
          journal_entry_id?: string | null
        }
        Update: {
          account_id?: string | null
          company_id?: string | null
          created_at?: string | null
          credit_amount?: number | null
          currency?: string | null
          debit_amount?: number | null
          description?: string | null
          id?: string | null
          journal_entry_id?: string | null
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          account_name: string | null
          account_number: string | null
          auxiliary_account: string | null
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string
          id: string
          journal_entry_id: string
          line_order: number | null
        }
        Insert: {
          account_id: string
          account_name?: string | null
          account_number?: string | null
          auxiliary_account?: string | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description: string
          id?: string
          journal_entry_id: string
          line_order?: number | null
        }
        Update: {
          account_id?: string
          account_name?: string | null
          account_number?: string | null
          auxiliary_account?: string | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string
          id?: string
          journal_entry_id?: string
          line_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_templates: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          lines: Json
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lines?: Json
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lines?: Json
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journals: {
        Row: {
          code: string
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          imported_from_fec: boolean | null
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          imported_from_fec?: boolean | null
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          imported_from_fec?: boolean | null
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      languages_catalog: {
        Row: {
          completion_percentage: number | null
          country_codes: string[] | null
          created_at: string | null
          date_format: string | null
          id: string
          is_active: boolean | null
          is_rtl: boolean | null
          is_supported: boolean | null
          language_code: string
          language_name: string
          language_name_native: string | null
          number_format: string | null
          priority_order: number | null
          time_format: string | null
          updated_at: string | null
        }
        Insert: {
          completion_percentage?: number | null
          country_codes?: string[] | null
          created_at?: string | null
          date_format?: string | null
          id?: string
          is_active?: boolean | null
          is_rtl?: boolean | null
          is_supported?: boolean | null
          language_code: string
          language_name: string
          language_name_native?: string | null
          number_format?: string | null
          priority_order?: number | null
          time_format?: string | null
          updated_at?: string | null
        }
        Update: {
          completion_percentage?: number | null
          country_codes?: string[] | null
          created_at?: string | null
          date_format?: string | null
          id?: string
          is_active?: boolean | null
          is_rtl?: boolean | null
          is_supported?: boolean | null
          language_code?: string
          language_name?: string
          language_name_native?: string | null
          number_format?: string | null
          priority_order?: number | null
          time_format?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string | null
          days_requested: number
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          rejection_reason: string | null
          request_date: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string | null
          days_requested: number
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          rejection_reason?: string | null
          request_date?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string | null
          days_requested?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          rejection_reason?: string | null
          request_date?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          code: string
          color: string | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          max_consecutive_days: number | null
          max_days_per_year: number | null
          min_notice_days: number | null
          name: string
          requires_approval: boolean | null
          updated_at: string | null
        }
        Insert: {
          code: string
          color?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          max_consecutive_days?: number | null
          max_days_per_year?: number | null
          min_notice_days?: number | null
          name: string
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          color?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          max_consecutive_days?: number | null
          max_days_per_year?: number | null
          min_notice_days?: number | null
          name?: string
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_archives: {
        Row: {
          access_log: Json | null
          archive_expires_at: string
          archived_at: string | null
          archived_data: Json
          created_at: string | null
          documents_archive_url: string | null
          encryption_key_id: string | null
          entity_id: string
          entity_type: string
          fec_export_url: string | null
          id: string
          is_encrypted: boolean | null
          legal_basis: string | null
          original_name: string
          status: string | null
        }
        Insert: {
          access_log?: Json | null
          archive_expires_at?: string
          archived_at?: string | null
          archived_data: Json
          created_at?: string | null
          documents_archive_url?: string | null
          encryption_key_id?: string | null
          entity_id: string
          entity_type: string
          fec_export_url?: string | null
          id?: string
          is_encrypted?: boolean | null
          legal_basis?: string | null
          original_name: string
          status?: string | null
        }
        Update: {
          access_log?: Json | null
          archive_expires_at?: string
          archived_at?: string | null
          archived_data?: Json
          created_at?: string | null
          documents_archive_url?: string | null
          encryption_key_id?: string | null
          entity_id?: string
          entity_type?: string
          fec_export_url?: string | null
          id?: string
          is_encrypted?: boolean | null
          legal_basis?: string | null
          original_name?: string
          status?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_type: string
          created_at: string | null
          device_fingerprint: string | null
          email: string
          failure_reason: string | null
          id: string
          ip_address: unknown
          location: Json | null
          mfa_required: boolean | null
          mfa_success: boolean | null
          user_agent: string | null
        }
        Insert: {
          attempt_type: string
          created_at?: string | null
          device_fingerprint?: string | null
          email: string
          failure_reason?: string | null
          id?: string
          ip_address: unknown
          location?: Json | null
          mfa_required?: boolean | null
          mfa_success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string | null
          device_fingerprint?: string | null
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          location?: Json | null
          mfa_required?: boolean | null
          mfa_success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      module_catalog: {
        Row: {
          category: string | null
          conflicts_with: string[] | null
          created_at: string | null
          default_access_level: string | null
          default_enabled: boolean | null
          default_storage_gb: number | null
          default_user_limit: number | null
          deprecation_date: string | null
          description_en: string | null
          description_fr: string | null
          display_name_en: string | null
          display_name_fr: string
          icon_color: string | null
          icon_name: string | null
          is_active: boolean | null
          is_beta: boolean | null
          is_core_module: boolean | null
          module_key: string
          release_date: string | null
          requires_modules: string[] | null
          requires_plan: string | null
          requires_subscription: boolean | null
          sort_order: number | null
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          conflicts_with?: string[] | null
          created_at?: string | null
          default_access_level?: string | null
          default_enabled?: boolean | null
          default_storage_gb?: number | null
          default_user_limit?: number | null
          deprecation_date?: string | null
          description_en?: string | null
          description_fr?: string | null
          display_name_en?: string | null
          display_name_fr: string
          icon_color?: string | null
          icon_name?: string | null
          is_active?: boolean | null
          is_beta?: boolean | null
          is_core_module?: boolean | null
          module_key: string
          release_date?: string | null
          requires_modules?: string[] | null
          requires_plan?: string | null
          requires_subscription?: boolean | null
          sort_order?: number | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          conflicts_with?: string[] | null
          created_at?: string | null
          default_access_level?: string | null
          default_enabled?: boolean | null
          default_storage_gb?: number | null
          default_user_limit?: number | null
          deprecation_date?: string | null
          description_en?: string | null
          description_fr?: string | null
          display_name_en?: string | null
          display_name_fr?: string
          icon_color?: string | null
          icon_name?: string | null
          is_active?: boolean | null
          is_beta?: boolean | null
          is_core_module?: boolean | null
          module_key?: string
          release_date?: string | null
          requires_modules?: string[] | null
          requires_plan?: string | null
          requires_subscription?: boolean | null
          sort_order?: number | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      module_configurations: {
        Row: {
          company_id: string | null
          configuration: Json
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_accessed: string | null
          license_info: Json | null
          module_name: string
          permissions: Json | null
          updated_at: string | null
          updated_by: string | null
          usage_limits: Json | null
        }
        Insert: {
          company_id?: string | null
          configuration?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_accessed?: string | null
          license_info?: Json | null
          module_name: string
          permissions?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          usage_limits?: Json | null
        }
        Update: {
          company_id?: string | null
          configuration?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_accessed?: string | null
          license_info?: Json | null
          module_name?: string
          permissions?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          usage_limits?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "module_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_channels: {
        Row: {
          channel_name: string
          channel_type: string
          company_id: string | null
          configuration: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          rate_limit_per_hour: number | null
          updated_at: string | null
        }
        Insert: {
          channel_name: string
          channel_type: string
          company_id?: string | null
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          rate_limit_per_hour?: number | null
          updated_at?: string | null
        }
        Update: {
          channel_name?: string
          channel_type?: string
          company_id?: string | null
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          rate_limit_per_hour?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_channels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_history: {
        Row: {
          id: string
          message: string | null
          metadata: Json | null
          notification_type: string
          read_at: string | null
          sent_at: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          billing_notifications: boolean | null
          created_at: string | null
          email_enabled: boolean | null
          email_frequency: string | null
          feature_notifications: boolean | null
          general_notifications: boolean | null
          id: string
          in_app_enabled: boolean | null
          push_enabled: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          security_notifications: boolean | null
          system_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_notifications?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          email_frequency?: string | null
          feature_notifications?: boolean | null
          general_notifications?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          security_notifications?: boolean | null
          system_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_notifications?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          email_frequency?: string | null
          feature_notifications?: boolean | null
          general_notifications?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          security_notifications?: boolean | null
          system_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          company_id: string | null
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          event_trigger: string
          id: string
          is_active: boolean | null
          subject_template: string | null
          template_name: string
          template_type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_template: string
          company_id?: string | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          event_trigger: string
          id?: string
          is_active?: boolean | null
          subject_template?: string | null
          template_name: string
          template_type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_template?: string
          company_id?: string | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          event_trigger?: string
          id?: string
          is_active?: boolean | null
          subject_template?: string | null
          template_name?: string
          template_type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          archived: boolean
          archived_at: string | null
          category: string | null
          company_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string
          read: boolean
          read_at: string | null
          scheduled_for: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          archived?: boolean
          archived_at?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string
          read?: boolean
          read_at?: string | null
          scheduled_for?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          archived?: boolean
          archived_at?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          read?: boolean
          read_at?: string | null
          scheduled_for?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_providers: {
        Row: {
          authorization_url: string
          client_id: string
          client_secret: string
          company_id: string | null
          configuration: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          is_enabled: boolean | null
          provider_name: string
          redirect_uri: string
          scope: string | null
          token_url: string
          updated_at: string | null
        }
        Insert: {
          authorization_url: string
          client_id: string
          client_secret: string
          company_id?: string | null
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_enabled?: boolean | null
          provider_name: string
          redirect_uri: string
          scope?: string | null
          token_url: string
          updated_at?: string | null
        }
        Update: {
          authorization_url?: string
          client_id?: string
          client_secret?: string
          company_id?: string | null
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_enabled?: boolean | null
          provider_name?: string
          redirect_uri?: string
          scope?: string | null
          token_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_providers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_history: {
        Row: {
          api_calls_count: number | null
          api_errors_count: number | null
          browser_info: Json | null
          company_id: string
          completion_status: string | null
          completion_time: string | null
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: unknown
          page_load_time_ms: number | null
          retry_count: number | null
          screen_resolution: string | null
          session_id: string | null
          step_data: Json | null
          step_name: string
          step_order: number
          time_spent_seconds: number | null
          user_agent: string | null
          user_id: string
          validation_errors: Json | null
          validation_warnings: Json | null
        }
        Insert: {
          api_calls_count?: number | null
          api_errors_count?: number | null
          browser_info?: Json | null
          company_id: string
          completion_status?: string | null
          completion_time?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown
          page_load_time_ms?: number | null
          retry_count?: number | null
          screen_resolution?: string | null
          session_id?: string | null
          step_data?: Json | null
          step_name: string
          step_order: number
          time_spent_seconds?: number | null
          user_agent?: string | null
          user_id: string
          validation_errors?: Json | null
          validation_warnings?: Json | null
        }
        Update: {
          api_calls_count?: number | null
          api_errors_count?: number | null
          browser_info?: Json | null
          company_id?: string
          completion_status?: string | null
          completion_time?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown
          page_load_time_ms?: number | null
          retry_count?: number | null
          screen_resolution?: string | null
          session_id?: string | null
          step_data?: Json | null
          step_name?: string
          step_order?: number
          time_spent_seconds?: number | null
          user_agent?: string | null
          user_id?: string
          validation_errors?: Json | null
          validation_warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_sessions: {
        Row: {
          abandoned_at: string | null
          company_id: string | null
          completed_at: string | null
          completed_steps: number | null
          created_at: string | null
          current_step: string | null
          draft_data: Json | null
          final_data: Json | null
          final_status: string | null
          id: string
          initial_data: Json | null
          is_active: boolean | null
          is_draft: boolean | null
          last_saved_at: string | null
          progress: number | null
          session_data: Json | null
          session_token: string
          started_at: string | null
          total_steps: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          abandoned_at?: string | null
          company_id?: string | null
          completed_at?: string | null
          completed_steps?: number | null
          created_at?: string | null
          current_step?: string | null
          draft_data?: Json | null
          final_data?: Json | null
          final_status?: string | null
          id?: string
          initial_data?: Json | null
          is_active?: boolean | null
          is_draft?: boolean | null
          last_saved_at?: string | null
          progress?: number | null
          session_data?: Json | null
          session_token: string
          started_at?: string | null
          total_steps?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          abandoned_at?: string | null
          company_id?: string | null
          completed_at?: string | null
          completed_steps?: number | null
          created_at?: string | null
          current_step?: string | null
          draft_data?: Json | null
          final_data?: Json | null
          final_status?: string | null
          id?: string
          initial_data?: Json | null
          is_active?: boolean | null
          is_draft?: boolean | null
          last_saved_at?: string | null
          progress?: number | null
          session_data?: Json | null
          session_token?: string
          started_at?: string | null
          total_steps?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      password_policies: {
        Row: {
          company_id: string | null
          complexity_rules: Json | null
          created_at: string | null
          created_by: string | null
          history_count: number | null
          id: string
          is_active: boolean | null
          lockout_attempts: number | null
          lockout_duration_minutes: number | null
          max_age_days: number | null
          min_length: number | null
          policy_name: string
          require_lowercase: boolean | null
          require_numbers: boolean | null
          require_special_chars: boolean | null
          require_uppercase: boolean | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          complexity_rules?: Json | null
          created_at?: string | null
          created_by?: string | null
          history_count?: number | null
          id?: string
          is_active?: boolean | null
          lockout_attempts?: number | null
          lockout_duration_minutes?: number | null
          max_age_days?: number | null
          min_length?: number | null
          policy_name?: string
          require_lowercase?: boolean | null
          require_numbers?: boolean | null
          require_special_chars?: boolean | null
          require_uppercase?: boolean | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          complexity_rules?: Json | null
          created_at?: string | null
          created_by?: string | null
          history_count?: number | null
          id?: string
          is_active?: boolean | null
          lockout_attempts?: number | null
          lockout_duration_minutes?: number | null
          max_age_days?: number | null
          min_length?: number | null
          policy_name?: string
          require_lowercase?: boolean | null
          require_numbers?: boolean | null
          require_special_chars?: boolean | null
          require_uppercase?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          bank_details: Json | null
          code: string
          company_id: string | null
          created_at: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          is_default: boolean | null
          name: string
          requires_reference: boolean | null
          updated_at: string | null
        }
        Insert: {
          bank_details?: Json | null
          code: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          requires_reference?: boolean | null
          updated_at?: string | null
        }
        Update: {
          bank_details?: Json | null
          code?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          requires_reference?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_reference: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_id: string
          description: string | null
          id: string
          invoice_id: string
          journal_entry_id: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_method_id: string | null
          payment_number: string | null
          received_date: string | null
          reference: string | null
          status: string | null
          third_party_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id: string
          description?: string | null
          id?: string
          invoice_id: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_number?: string | null
          received_date?: string | null
          reference?: string | null
          status?: string | null
          third_party_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          invoice_id?: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_number?: string | null
          received_date?: string | null
          reference?: string | null
          status?: string | null
          third_party_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_balances"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_third_party_id_fkey"
            columns: ["third_party_id"]
            isOneToOne: false
            referencedRelation: "third_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          company_id: string
          contract_id: string
          created_at: string | null
          currency: string | null
          employee_id: string
          gross_salary: number
          id: string
          net_salary: number
          overtime_hours: number | null
          pay_date: string
          pay_period_end: string
          pay_period_start: string
          payroll_number: string
          processed_by: string | null
          regular_hours: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          contract_id: string
          created_at?: string | null
          currency?: string | null
          employee_id: string
          gross_salary?: number
          id?: string
          net_salary?: number
          overtime_hours?: number | null
          pay_date: string
          pay_period_end: string
          pay_period_start: string
          payroll_number: string
          processed_by?: string | null
          regular_hours?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          contract_id?: string
          created_at?: string | null
          currency?: string | null
          employee_id?: string
          gross_salary?: number
          id?: string
          net_salary?: number
          overtime_hours?: number | null
          pay_date?: string
          pay_period_end?: string
          pay_period_start?: string
          payroll_number?: string
          processed_by?: string | null
          regular_hours?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "employee_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_account_mapping: {
        Row: {
          bonuses_account_id: string | null
          company_id: string
          created_at: string | null
          employees_due_account_id: string | null
          employer_contributions_account_id: string | null
          gross_salary_account_id: string | null
          id: string
          income_tax_account_id: string | null
          pension_account_id: string | null
          social_security_account_id: string | null
          unemployment_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          bonuses_account_id?: string | null
          company_id: string
          created_at?: string | null
          employees_due_account_id?: string | null
          employer_contributions_account_id?: string | null
          gross_salary_account_id?: string | null
          id?: string
          income_tax_account_id?: string | null
          pension_account_id?: string | null
          social_security_account_id?: string | null
          unemployment_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bonuses_account_id?: string | null
          company_id?: string
          created_at?: string | null
          employees_due_account_id?: string | null
          employer_contributions_account_id?: string | null
          gross_salary_account_id?: string | null
          id?: string
          income_tax_account_id?: string | null
          pension_account_id?: string | null
          social_security_account_id?: string | null
          unemployment_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_account_mapping_bonuses_account_id_fkey"
            columns: ["bonuses_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_account_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_account_mapping_employees_due_account_id_fkey"
            columns: ["employees_due_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_account_mapping_employer_contributions_account_id_fkey"
            columns: ["employer_contributions_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_account_mapping_gross_salary_account_id_fkey"
            columns: ["gross_salary_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_account_mapping_income_tax_account_id_fkey"
            columns: ["income_tax_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_account_mapping_pension_account_id_fkey"
            columns: ["pension_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_account_mapping_social_security_account_id_fkey"
            columns: ["social_security_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_account_mapping_unemployment_account_id_fkey"
            columns: ["unemployment_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          amount: number
          calculation_base: number | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_social_security_base: boolean | null
          is_taxable: boolean | null
          item_code: string
          item_name: string
          item_type: string
          payroll_id: string
          rate: number | null
        }
        Insert: {
          amount: number
          calculation_base?: number | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_social_security_base?: boolean | null
          is_taxable?: boolean | null
          item_code: string
          item_name: string
          item_type: string
          payroll_id: string
          rate?: number | null
        }
        Update: {
          amount?: number
          calculation_base?: number | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_social_security_base?: boolean | null
          is_taxable?: boolean | null
          item_code?: string
          item_name?: string
          item_type?: string
          payroll_id?: string
          rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_slips: {
        Row: {
          advances: number | null
          benefits_in_kind: number | null
          bonuses: number | null
          company_id: string
          created_at: string | null
          created_by: string | null
          employee_health: number | null
          employee_id: string
          employee_pension: number | null
          employee_social_contributions: number | null
          employee_unemployment: number | null
          employer_accident: number | null
          employer_health: number | null
          employer_pension: number | null
          employer_social_contributions: number | null
          employer_unemployment: number | null
          gross_salary: number
          id: string
          income_tax_withheld: number | null
          journal_entry_id: string | null
          net_salary: number
          net_taxable: number
          other_deductions: number | null
          overtime: number | null
          paid_at: string | null
          payment_date: string
          period_month: number
          period_year: number
          status: string | null
          total_employee_contributions: number | null
          total_employer_contributions: number | null
          total_employer_cost: number
          total_gross: number
          updated_at: string | null
          validated_at: string | null
        }
        Insert: {
          advances?: number | null
          benefits_in_kind?: number | null
          bonuses?: number | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          employee_health?: number | null
          employee_id: string
          employee_pension?: number | null
          employee_social_contributions?: number | null
          employee_unemployment?: number | null
          employer_accident?: number | null
          employer_health?: number | null
          employer_pension?: number | null
          employer_social_contributions?: number | null
          employer_unemployment?: number | null
          gross_salary: number
          id?: string
          income_tax_withheld?: number | null
          journal_entry_id?: string | null
          net_salary: number
          net_taxable: number
          other_deductions?: number | null
          overtime?: number | null
          paid_at?: string | null
          payment_date: string
          period_month: number
          period_year: number
          status?: string | null
          total_employee_contributions?: number | null
          total_employer_contributions?: number | null
          total_employer_cost: number
          total_gross: number
          updated_at?: string | null
          validated_at?: string | null
        }
        Update: {
          advances?: number | null
          benefits_in_kind?: number | null
          bonuses?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          employee_health?: number | null
          employee_id?: string
          employee_pension?: number | null
          employee_social_contributions?: number | null
          employee_unemployment?: number | null
          employer_accident?: number | null
          employer_health?: number | null
          employer_pension?: number | null
          employer_social_contributions?: number | null
          employer_unemployment?: number | null
          gross_salary?: number
          id?: string
          income_tax_withheld?: number | null
          journal_entry_id?: string | null
          net_salary?: number
          net_taxable?: number
          other_deductions?: number | null
          overtime?: number | null
          paid_at?: string | null
          payment_date?: string
          period_month?: number
          period_year?: number
          status?: string | null
          total_employee_contributions?: number | null
          total_employer_contributions?: number | null
          total_employer_cost?: number
          total_gross?: number
          updated_at?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_slips_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_slips_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          areas_for_improvement: string[] | null
          career_aspirations: string | null
          company_id: string
          competencies_scores: Json | null
          created_at: string | null
          development_plan: string | null
          employee_id: string
          employee_signature_date: string | null
          goals_achieved: string[] | null
          goals_not_achieved: string[] | null
          id: string
          is_visible_to_employee: boolean | null
          manager_approval_date: string | null
          manager_id: string | null
          new_goals: string[] | null
          next_review_date: string | null
          overall_comments: string | null
          overall_rating: number | null
          review_date: string | null
          review_period_end: string
          review_period_start: string
          review_type: string | null
          reviewer_id: string
          reviewer_signature_date: string | null
          status: string | null
          strengths: string[] | null
          training_recommendations: string[] | null
          updated_at: string | null
        }
        Insert: {
          areas_for_improvement?: string[] | null
          career_aspirations?: string | null
          company_id: string
          competencies_scores?: Json | null
          created_at?: string | null
          development_plan?: string | null
          employee_id: string
          employee_signature_date?: string | null
          goals_achieved?: string[] | null
          goals_not_achieved?: string[] | null
          id?: string
          is_visible_to_employee?: boolean | null
          manager_approval_date?: string | null
          manager_id?: string | null
          new_goals?: string[] | null
          next_review_date?: string | null
          overall_comments?: string | null
          overall_rating?: number | null
          review_date?: string | null
          review_period_end: string
          review_period_start: string
          review_type?: string | null
          reviewer_id: string
          reviewer_signature_date?: string | null
          status?: string | null
          strengths?: string[] | null
          training_recommendations?: string[] | null
          updated_at?: string | null
        }
        Update: {
          areas_for_improvement?: string[] | null
          career_aspirations?: string | null
          company_id?: string
          competencies_scores?: Json | null
          created_at?: string | null
          development_plan?: string | null
          employee_id?: string
          employee_signature_date?: string | null
          goals_achieved?: string[] | null
          goals_not_achieved?: string[] | null
          id?: string
          is_visible_to_employee?: boolean | null
          manager_approval_date?: string | null
          manager_id?: string | null
          new_goals?: string[] | null
          next_review_date?: string | null
          overall_comments?: string | null
          overall_rating?: number | null
          review_date?: string | null
          review_period_end?: string
          review_period_start?: string
          review_type?: string | null
          reviewer_id?: string
          reviewer_signature_date?: string | null
          status?: string | null
          strengths?: string[] | null
          training_recommendations?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_settings: {
        Row: {
          category: string
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          impact_level: string | null
          last_optimized: string | null
          recommended_value: Json | null
          requires_restart: boolean | null
          setting_name: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          impact_level?: string | null
          last_optimized?: string | null
          recommended_value?: Json | null
          requires_restart?: boolean | null
          setting_name: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          impact_level?: string | null
          last_optimized?: string | null
          recommended_value?: Json | null
          requires_restart?: boolean | null
          setting_name?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          category: string | null
          company_id: string | null
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          resource: string
        }
        Insert: {
          action: string
          category?: string | null
          company_id?: string | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          resource: string
        }
        Update: {
          action?: string
          category?: string | null
          company_id?: string | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          resource?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          code: string
          company_id: string
          created_at: string | null
          department_id: string
          description: string | null
          employment_type: string | null
          id: string
          is_active: boolean | null
          level_grade: string | null
          max_headcount: number | null
          reports_to_position_id: string | null
          requires_travel: boolean | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string | null
          department_id: string
          description?: string | null
          employment_type?: string | null
          id?: string
          is_active?: boolean | null
          level_grade?: string | null
          max_headcount?: number | null
          reports_to_position_id?: string | null
          requires_travel?: boolean | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string | null
          department_id?: string
          description?: string | null
          employment_type?: string | null
          id?: string
          is_active?: boolean | null
          level_grade?: string | null
          max_headcount?: number | null
          reports_to_position_id?: string | null
          requires_travel?: boolean | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_reports_to_position_id_fkey"
            columns: ["reports_to_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_path: string | null
          code: string
          company_id: string
          created_at: string | null
          default_unit: string | null
          description: string | null
          id: string
          is_active: boolean | null
          level: number | null
          name: string
          parent_category_id: string | null
          requires_expiry_date: boolean | null
          requires_serial_number: boolean | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category_path?: string | null
          code: string
          company_id: string
          created_at?: string | null
          default_unit?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          name: string
          parent_category_id?: string | null
          requires_expiry_date?: boolean | null
          requires_serial_number?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category_path?: string | null
          code?: string
          company_id?: string
          created_at?: string | null
          default_unit?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          name?: string
          parent_category_id?: string | null
          requires_expiry_date?: boolean | null
          requires_serial_number?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          barcode: string | null
          color: string | null
          company_id: string
          created_at: string | null
          custom_attributes: Json | null
          dimensions: Json | null
          id: string
          is_active: boolean | null
          material: string | null
          product_id: string
          size: string | null
          sku: string
          style: string | null
          track_inventory: boolean | null
          updated_at: string | null
          variant_cost: number | null
          variant_name: string
          variant_price: number | null
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          color?: string | null
          company_id: string
          created_at?: string | null
          custom_attributes?: Json | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          material?: string | null
          product_id: string
          size?: string | null
          sku: string
          style?: string | null
          track_inventory?: boolean | null
          updated_at?: string | null
          variant_cost?: number | null
          variant_name: string
          variant_price?: number | null
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          color?: string | null
          company_id?: string
          created_at?: string | null
          custom_attributes?: Json | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          material?: string | null
          product_id?: string
          size?: string | null
          sku?: string
          style?: string | null
          track_inventory?: boolean | null
          updated_at?: string | null
          variant_cost?: number | null
          variant_name?: string
          variant_price?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_components: {
        Row: {
          allocated: number | null
          created_at: string | null
          id: string
          inventory_item_id: string
          needed: number
          production_order_id: string
          updated_at: string | null
        }
        Insert: {
          allocated?: number | null
          created_at?: string | null
          id?: string
          inventory_item_id: string
          needed: number
          production_order_id: string
          updated_at?: string | null
        }
        Update: {
          allocated?: number | null
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          needed?: number
          production_order_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_order_components_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_components_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          company_id: string
          completed_date: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          expected_date: string
          id: string
          notes: string | null
          priority: string | null
          product_name: string
          quantity: number
          responsible: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          expected_date: string
          id?: string
          notes?: string | null
          priority?: string | null
          product_name: string
          quantity: number
          responsible?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          expected_date?: string
          id?: string
          notes?: string | null
          priority?: string | null
          product_name?: string
          quantity?: number
          responsible?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          code: string
          company_id: string
          cost_price: number | null
          created_at: string | null
          current_stock: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_stockable: boolean | null
          minimum_stock: number | null
          name: string
          purchase_account_id: string | null
          purchase_price: number | null
          purchase_tax_rate: number | null
          sale_price: number | null
          sale_tax_rate: number | null
          sales_account_id: string | null
          stock_account_id: string | null
          stock_unit: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          company_id: string
          cost_price?: number | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_stockable?: boolean | null
          minimum_stock?: number | null
          name: string
          purchase_account_id?: string | null
          purchase_price?: number | null
          purchase_tax_rate?: number | null
          sale_price?: number | null
          sale_tax_rate?: number | null
          sales_account_id?: string | null
          stock_account_id?: string | null
          stock_unit?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          company_id?: string
          cost_price?: number | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_stockable?: boolean | null
          minimum_stock?: number | null
          name?: string
          purchase_account_id?: string | null
          purchase_price?: number | null
          purchase_tax_rate?: number | null
          sale_price?: number | null
          sale_tax_rate?: number | null
          sales_account_id?: string | null
          stock_account_id?: string | null
          stock_unit?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_purchase_account_id_fkey"
            columns: ["purchase_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_sales_account_id_fkey"
            columns: ["sales_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_stock_account_id_fkey"
            columns: ["stock_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      project_baselines: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          baseline_cost: number | null
          baseline_date: string
          baseline_duration_days: number
          baseline_end_date: string
          baseline_hours: number | null
          baseline_name: string
          baseline_start_date: string
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_approved: boolean | null
          is_current_baseline: boolean | null
          milestones_snapshot: Json | null
          project_id: string
          resources_snapshot: Json | null
          tasks_snapshot: Json
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          baseline_cost?: number | null
          baseline_date: string
          baseline_duration_days: number
          baseline_end_date: string
          baseline_hours?: number | null
          baseline_name: string
          baseline_start_date: string
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_approved?: boolean | null
          is_current_baseline?: boolean | null
          milestones_snapshot?: Json | null
          project_id: string
          resources_snapshot?: Json | null
          tasks_snapshot?: Json
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          baseline_cost?: number | null
          baseline_date?: string
          baseline_duration_days?: number
          baseline_end_date?: string
          baseline_hours?: number | null
          baseline_name?: string
          baseline_start_date?: string
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_approved?: boolean | null
          is_current_baseline?: boolean | null
          milestones_snapshot?: Json | null
          project_id?: string
          resources_snapshot?: Json | null
          tasks_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "project_baselines_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_baselines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_billing_rates: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          effective_from: string
          effective_until: string | null
          employee_id: string | null
          holiday_rate: number | null
          hourly_rate: number
          id: string
          is_billable: boolean | null
          markup_percentage: number | null
          overtime_rate: number | null
          project_id: string
          role_id: string | null
          updated_at: string | null
          weekend_rate: number | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          effective_from: string
          effective_until?: string | null
          employee_id?: string | null
          holiday_rate?: number | null
          hourly_rate: number
          id?: string
          is_billable?: boolean | null
          markup_percentage?: number | null
          overtime_rate?: number | null
          project_id: string
          role_id?: string | null
          updated_at?: string | null
          weekend_rate?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          employee_id?: string | null
          holiday_rate?: number | null
          hourly_rate?: number
          id?: string
          is_billable?: boolean | null
          markup_percentage?: number | null
          overtime_rate?: number | null
          project_id?: string
          role_id?: string | null
          updated_at?: string | null
          weekend_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_billing_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_billing_rates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_billing_rates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_billing_rates_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budgets: {
        Row: {
          actual_amount: number | null
          approved_at: string | null
          approved_by: string | null
          budget_type: string
          company_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          last_updated_from_expenses_at: string | null
          metadata: Json | null
          name: string
          notes: string | null
          period_end: string | null
          period_start: string | null
          planned_amount: number
          project_id: string
          status: string
          updated_at: string
          variance_amount: number | null
          variance_percentage: number | null
        }
        Insert: {
          actual_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          budget_type: string
          company_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          last_updated_from_expenses_at?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          planned_amount: number
          project_id: string
          status?: string
          updated_at?: string
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Update: {
          actual_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          budget_type?: string
          company_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          last_updated_from_expenses_at?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          planned_amount?: number
          project_id?: string
          status?: string
          updated_at?: string
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_categories: {
        Row: {
          color: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          default_budget: number | null
          default_duration_days: number | null
          default_hourly_rate: number | null
          default_statuses: Json | null
          default_task_types: Json | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          level: number | null
          name: string
          parent_category_id: string | null
          sort_order: number | null
          template_config: Json | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          default_budget?: number | null
          default_duration_days?: number | null
          default_hourly_rate?: number | null
          default_statuses?: Json | null
          default_task_types?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          name: string
          parent_category_id?: string | null
          sort_order?: number | null
          template_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          default_budget?: number | null
          default_duration_days?: number | null
          default_hourly_rate?: number | null
          default_statuses?: Json | null
          default_task_types?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          name?: string
          parent_category_id?: string | null
          sort_order?: number | null
          template_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "project_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      project_discussions: {
        Row: {
          category: string | null
          company_id: string
          content: string
          content_type: string | null
          created_at: string | null
          created_by: string
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          is_resolved: boolean | null
          last_activity_at: string | null
          participants: string[] | null
          project_id: string
          reply_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
          watchers: string[] | null
        }
        Insert: {
          category?: string | null
          company_id: string
          content: string
          content_type?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          last_activity_at?: string | null
          participants?: string[] | null
          project_id: string
          reply_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
          watchers?: string[] | null
        }
        Update: {
          category?: string | null
          company_id?: string
          content?: string
          content_type?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          last_activity_at?: string | null
          participants?: string[] | null
          project_id?: string
          reply_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
          watchers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "project_discussions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_discussions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          category: string
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          description: string
          expense_date: string
          id: string
          invoice_number: string | null
          metadata: Json | null
          notes: string | null
          payment_status: string | null
          project_budget_id: string | null
          project_id: string
          receipt_url: string | null
          rejection_reason: string | null
          requires_approval: boolean | null
          supplier_name: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          category: string
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          expense_date?: string
          id?: string
          invoice_number?: string | null
          metadata?: Json | null
          notes?: string | null
          payment_status?: string | null
          project_budget_id?: string | null
          project_id: string
          receipt_url?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          supplier_name?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          expense_date?: string
          id?: string
          invoice_number?: string | null
          metadata?: Json | null
          notes?: string | null
          payment_status?: string | null
          project_budget_id?: string | null
          project_id?: string
          receipt_url?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          supplier_name?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_project_budget_id_fkey"
            columns: ["project_budget_id"]
            isOneToOne: false
            referencedRelation: "project_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_forecasts: {
        Row: {
          calculated_by: string | null
          company_id: string
          confidence_interval_days: number | null
          cost_at_completion: number | null
          cost_variance: number | null
          created_at: string | null
          data_completeness: number | null
          estimate_to_complete: number | null
          forecast_accuracy: number | null
          forecast_date: string
          forecast_horizon_days: number
          forecast_method: string
          forecasted_completion_date: string | null
          forecasted_duration_days: number | null
          forecasted_final_cost: number | null
          forecasted_total_hours: number | null
          id: string
          mitigation_strategies: Json | null
          model_confidence: number | null
          model_version: string | null
          most_likely_scenario: Json | null
          optimistic_scenario: Json | null
          peak_resource_demand: number | null
          pessimistic_scenario: Json | null
          probability_success: number | null
          project_id: string
          remaining_effort_hours: number | null
          resource_bottlenecks: Json | null
          risk_factors: Json | null
          schedule_variance_days: number | null
        }
        Insert: {
          calculated_by?: string | null
          company_id: string
          confidence_interval_days?: number | null
          cost_at_completion?: number | null
          cost_variance?: number | null
          created_at?: string | null
          data_completeness?: number | null
          estimate_to_complete?: number | null
          forecast_accuracy?: number | null
          forecast_date?: string
          forecast_horizon_days?: number
          forecast_method?: string
          forecasted_completion_date?: string | null
          forecasted_duration_days?: number | null
          forecasted_final_cost?: number | null
          forecasted_total_hours?: number | null
          id?: string
          mitigation_strategies?: Json | null
          model_confidence?: number | null
          model_version?: string | null
          most_likely_scenario?: Json | null
          optimistic_scenario?: Json | null
          peak_resource_demand?: number | null
          pessimistic_scenario?: Json | null
          probability_success?: number | null
          project_id: string
          remaining_effort_hours?: number | null
          resource_bottlenecks?: Json | null
          risk_factors?: Json | null
          schedule_variance_days?: number | null
        }
        Update: {
          calculated_by?: string | null
          company_id?: string
          confidence_interval_days?: number | null
          cost_at_completion?: number | null
          cost_variance?: number | null
          created_at?: string | null
          data_completeness?: number | null
          estimate_to_complete?: number | null
          forecast_accuracy?: number | null
          forecast_date?: string
          forecast_horizon_days?: number
          forecast_method?: string
          forecasted_completion_date?: string | null
          forecasted_duration_days?: number | null
          forecasted_final_cost?: number | null
          forecasted_total_hours?: number | null
          id?: string
          mitigation_strategies?: Json | null
          model_confidence?: number | null
          model_version?: string | null
          most_likely_scenario?: Json | null
          optimistic_scenario?: Json | null
          peak_resource_demand?: number | null
          pessimistic_scenario?: Json | null
          probability_success?: number | null
          project_id?: string
          remaining_effort_hours?: number | null
          resource_bottlenecks?: Json | null
          risk_factors?: Json | null
          schedule_variance_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_forecasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_forecasts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_gantt_data: {
        Row: {
          bar_style: Json | null
          calculated_end: string | null
          calculated_start: string | null
          company_id: string
          created_at: string | null
          critical_path: boolean | null
          duration_days: number
          earliest_start: string | null
          end_date: string
          id: string
          last_calculated_at: string | null
          latest_finish: string | null
          progress_percentage: number | null
          project_id: string
          schedule_variance_days: number | null
          slack_days: number | null
          start_date: string
          task_id: string | null
          updated_at: string | null
        }
        Insert: {
          bar_style?: Json | null
          calculated_end?: string | null
          calculated_start?: string | null
          company_id: string
          created_at?: string | null
          critical_path?: boolean | null
          duration_days: number
          earliest_start?: string | null
          end_date: string
          id?: string
          last_calculated_at?: string | null
          latest_finish?: string | null
          progress_percentage?: number | null
          project_id: string
          schedule_variance_days?: number | null
          slack_days?: number | null
          start_date: string
          task_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bar_style?: Json | null
          calculated_end?: string | null
          calculated_start?: string | null
          company_id?: string
          created_at?: string | null
          critical_path?: boolean | null
          duration_days?: number
          earliest_start?: string | null
          end_date?: string
          id?: string
          last_calculated_at?: string | null
          latest_finish?: string | null
          progress_percentage?: number | null
          project_id?: string
          schedule_variance_days?: number | null
          slack_days?: number | null
          start_date?: string
          task_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_gantt_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_gantt_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_gantt_data_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_kpis: {
        Row: {
          actual_cost: number | null
          actual_hours: number | null
          actual_progress: number | null
          calculated_by: string | null
          calculation_method: string | null
          company_id: string
          cost_performance_index: number | null
          created_at: string | null
          customer_satisfaction: number | null
          data_quality_score: number | null
          defects_found: number | null
          earned_value: number | null
          estimated_completion_date: string | null
          estimated_final_cost: number | null
          id: string
          measurement_date: string
          measurement_period: string | null
          overall_health_score: number | null
          overtime_hours: number | null
          planned_cost: number | null
          planned_hours: number | null
          planned_progress: number | null
          probability_on_budget: number | null
          probability_on_time: number | null
          project_id: string
          remaining_budget: number | null
          remaining_hours: number | null
          resource_conflicts: number | null
          rework_hours: number | null
          risk_score: number | null
          schedule_performance_index: number | null
          tasks_completed: number | null
          tasks_overdue: number | null
          team_utilization: number | null
        }
        Insert: {
          actual_cost?: number | null
          actual_hours?: number | null
          actual_progress?: number | null
          calculated_by?: string | null
          calculation_method?: string | null
          company_id: string
          cost_performance_index?: number | null
          created_at?: string | null
          customer_satisfaction?: number | null
          data_quality_score?: number | null
          defects_found?: number | null
          earned_value?: number | null
          estimated_completion_date?: string | null
          estimated_final_cost?: number | null
          id?: string
          measurement_date?: string
          measurement_period?: string | null
          overall_health_score?: number | null
          overtime_hours?: number | null
          planned_cost?: number | null
          planned_hours?: number | null
          planned_progress?: number | null
          probability_on_budget?: number | null
          probability_on_time?: number | null
          project_id: string
          remaining_budget?: number | null
          remaining_hours?: number | null
          resource_conflicts?: number | null
          rework_hours?: number | null
          risk_score?: number | null
          schedule_performance_index?: number | null
          tasks_completed?: number | null
          tasks_overdue?: number | null
          team_utilization?: number | null
        }
        Update: {
          actual_cost?: number | null
          actual_hours?: number | null
          actual_progress?: number | null
          calculated_by?: string | null
          calculation_method?: string | null
          company_id?: string
          cost_performance_index?: number | null
          created_at?: string | null
          customer_satisfaction?: number | null
          data_quality_score?: number | null
          defects_found?: number | null
          earned_value?: number | null
          estimated_completion_date?: string | null
          estimated_final_cost?: number | null
          id?: string
          measurement_date?: string
          measurement_period?: string | null
          overall_health_score?: number | null
          overtime_hours?: number | null
          planned_cost?: number | null
          planned_hours?: number | null
          planned_progress?: number | null
          probability_on_budget?: number | null
          probability_on_time?: number | null
          project_id?: string
          remaining_budget?: number | null
          remaining_hours?: number | null
          resource_conflicts?: number | null
          rework_hours?: number | null
          risk_score?: number | null
          schedule_performance_index?: number | null
          tasks_completed?: number | null
          tasks_overdue?: number | null
          team_utilization?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_kpis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          allocation_percentage: number | null
          can_edit_project: boolean | null
          can_edit_tasks: boolean | null
          can_manage_team: boolean | null
          can_view_budget: boolean | null
          company_id: string
          created_at: string | null
          created_by: string | null
          employee_id: string
          end_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          project_id: string
          role: string
          role_id: string | null
          start_date: string
          total_budget: number | null
          updated_at: string | null
        }
        Insert: {
          allocation_percentage?: number | null
          can_edit_project?: boolean | null
          can_edit_tasks?: boolean | null
          can_manage_team?: boolean | null
          can_view_budget?: boolean | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          employee_id: string
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          project_id: string
          role?: string
          role_id?: string | null
          start_date: string
          total_budget?: number | null
          updated_at?: string | null
        }
        Update: {
          allocation_percentage?: number | null
          can_edit_project?: boolean | null
          can_edit_tasks?: boolean | null
          can_manage_team?: boolean | null
          can_view_budget?: boolean | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          employee_id?: string
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          role?: string
          role_id?: string | null
          start_date?: string
          total_budget?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          actual_cost: number | null
          approved_at: string | null
          approved_by: string | null
          blocking_reason: string | null
          budget_amount: number | null
          company_id: string
          completed_date: string | null
          completion_criteria: string | null
          created_at: string
          deliverables: Json | null
          depends_on_milestone_id: string | null
          description: string | null
          due_date: string
          id: string
          metadata: Json | null
          milestone_order: number
          name: string
          progress: number | null
          project_id: string
          requires_approval: boolean | null
          responsible_user_id: string | null
          start_date: string | null
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          approved_at?: string | null
          approved_by?: string | null
          blocking_reason?: string | null
          budget_amount?: number | null
          company_id: string
          completed_date?: string | null
          completion_criteria?: string | null
          created_at?: string
          deliverables?: Json | null
          depends_on_milestone_id?: string | null
          description?: string | null
          due_date: string
          id?: string
          metadata?: Json | null
          milestone_order?: number
          name: string
          progress?: number | null
          project_id: string
          requires_approval?: boolean | null
          responsible_user_id?: string | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          approved_at?: string | null
          approved_by?: string | null
          blocking_reason?: string | null
          budget_amount?: number | null
          company_id?: string
          completed_date?: string | null
          completion_criteria?: string | null
          created_at?: string
          deliverables?: Json | null
          depends_on_milestone_id?: string | null
          description?: string | null
          due_date?: string
          id?: string
          metadata?: Json | null
          milestone_order?: number
          name?: string
          progress?: number | null
          project_id?: string
          requires_approval?: boolean | null
          responsible_user_id?: string | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_depends_on_milestone_id_fkey"
            columns: ["depends_on_milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notifications: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          dismissed_at: string | null
          id: string
          message: string
          notification_type: string
          priority: string | null
          project_id: string
          read_at: string | null
          recipient_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          send_email: boolean | null
          send_push: boolean | null
          sent_at: string | null
          status: string | null
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          dismissed_at?: string | null
          id?: string
          message: string
          notification_type: string
          priority?: string | null
          project_id: string
          read_at?: string | null
          recipient_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          send_email?: boolean | null
          send_push?: boolean | null
          sent_at?: string | null
          status?: string | null
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          dismissed_at?: string | null
          id?: string
          message?: string
          notification_type?: string
          priority?: string | null
          project_id?: string
          read_at?: string | null
          recipient_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          send_email?: boolean | null
          send_push?: boolean | null
          sent_at?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          actual_budget: number | null
          actual_hours: number | null
          company_id: string
          created_at: string | null
          created_by: string | null
          deliverables: Json | null
          depends_on_phases: string[] | null
          description: string | null
          end_date: string | null
          estimated_budget: number | null
          estimated_hours: number | null
          id: string
          is_critical: boolean | null
          is_milestone: boolean | null
          name: string
          phase_number: number
          progress: number | null
          project_id: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_budget?: number | null
          actual_hours?: number | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          deliverables?: Json | null
          depends_on_phases?: string[] | null
          description?: string | null
          end_date?: string | null
          estimated_budget?: number | null
          estimated_hours?: number | null
          id?: string
          is_critical?: boolean | null
          is_milestone?: boolean | null
          name: string
          phase_number: number
          progress?: number | null
          project_id: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_budget?: number | null
          actual_hours?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          deliverables?: Json | null
          depends_on_phases?: string[] | null
          description?: string | null
          end_date?: string | null
          estimated_budget?: number | null
          estimated_hours?: number | null
          id?: string
          is_critical?: boolean | null
          is_milestone?: boolean | null
          name?: string
          phase_number?: number
          progress?: number | null
          project_id?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_resources: {
        Row: {
          allocation_percentage: number | null
          available_from: string | null
          available_until: string | null
          company_id: string
          constraints: Json | null
          cost_unit: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          project_id: string
          resource_name: string
          resource_type: string
          role: string | null
          specifications: Json | null
          start_date: string | null
          total_allocated: number | null
          total_available: number | null
          unit_cost: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allocation_percentage?: number | null
          available_from?: string | null
          available_until?: string | null
          company_id: string
          constraints?: Json | null
          cost_unit?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          project_id: string
          resource_name: string
          resource_type: string
          role?: string | null
          specifications?: Json | null
          start_date?: string | null
          total_allocated?: number | null
          total_available?: number | null
          unit_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allocation_percentage?: number | null
          available_from?: string | null
          available_until?: string | null
          company_id?: string
          constraints?: Json | null
          cost_unit?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          resource_name?: string
          resource_type?: string
          role?: string | null
          specifications?: Json | null
          start_date?: string | null
          total_allocated?: number | null
          total_available?: number | null
          unit_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_roles: {
        Row: {
          company_id: string | null
          created_at: string | null
          default_hourly_rate: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          permissions: Json
          requires_approval: boolean | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          default_hourly_rate?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          permissions?: Json
          requires_approval?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          default_hourly_rate?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          permissions?: Json
          requires_approval?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_schedules: {
        Row: {
          auto_schedule: boolean | null
          baseline_locked: boolean | null
          company_id: string
          created_at: string | null
          created_by: string | null
          end_time: string | null
          holidays: Json | null
          id: string
          is_active: boolean | null
          project_id: string
          schedule_forward: boolean | null
          schedule_name: string | null
          special_work_days: Json | null
          start_time: string | null
          updated_at: string | null
          work_days: number[] | null
          work_hours_per_day: number | null
        }
        Insert: {
          auto_schedule?: boolean | null
          baseline_locked?: boolean | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          holidays?: Json | null
          id?: string
          is_active?: boolean | null
          project_id: string
          schedule_forward?: boolean | null
          schedule_name?: string | null
          special_work_days?: Json | null
          start_time?: string | null
          updated_at?: string | null
          work_days?: number[] | null
          work_hours_per_day?: number | null
        }
        Update: {
          auto_schedule?: boolean | null
          baseline_locked?: boolean | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          holidays?: Json | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          schedule_forward?: boolean | null
          schedule_name?: string | null
          special_work_days?: Json | null
          start_time?: string | null
          updated_at?: string | null
          work_days?: number[] | null
          work_hours_per_day?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_statuses: {
        Row: {
          allows_time_tracking: boolean | null
          color: string
          company_id: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_cancelled: boolean | null
          is_final: boolean | null
          is_initial: boolean | null
          is_system: boolean | null
          name: string
          next_statuses: string[] | null
          required_permissions: Json | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          allows_time_tracking?: boolean | null
          color?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_cancelled?: boolean | null
          is_final?: boolean | null
          is_initial?: boolean | null
          is_system?: boolean | null
          name: string
          next_statuses?: string[] | null
          required_permissions?: Json | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          allows_time_tracking?: boolean | null
          color?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_cancelled?: boolean | null
          is_final?: boolean | null
          is_initial?: boolean | null
          is_system?: boolean | null
          name?: string
          next_statuses?: string[] | null
          required_permissions?: Json | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_statuses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_cost: number | null
          actual_hours: number | null
          assigned_date: string | null
          assigned_to: string | null
          company_id: string
          constraint_type: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          depends_on: string[] | null
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          estimated_hours: number | null
          hourly_rate: number | null
          id: string
          lag_days: number | null
          parent_task_id: string | null
          priority: string
          progress: number | null
          project_id: string
          start_date: string | null
          status: string
          tags: string[] | null
          task_number: string | null
          title: string
          type_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_hours?: number | null
          assigned_date?: string | null
          assigned_to?: string | null
          company_id: string
          constraint_type?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          depends_on?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string
          lag_days?: number | null
          parent_task_id?: string | null
          priority?: string
          progress?: number | null
          project_id: string
          start_date?: string | null
          status?: string
          tags?: string[] | null
          task_number?: string | null
          title: string
          type_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_hours?: number | null
          assigned_date?: string | null
          assigned_to?: string | null
          company_id?: string
          constraint_type?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          depends_on?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string
          lag_days?: number | null
          parent_task_id?: string | null
          priority?: string
          progress?: number | null
          project_id?: string
          start_date?: string | null
          status?: string
          tags?: string[] | null
          task_number?: string | null
          title?: string
          type_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          category_id: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          default_settings: Json | null
          dependencies: Json | null
          description: string | null
          estimated_budget: number | null
          estimated_duration_days: number | null
          estimated_hours: number | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          last_used_at: string | null
          milestones: Json | null
          name: string
          phases: Json | null
          required_roles: Json | null
          resources: Json | null
          tasks: Json | null
          updated_at: string | null
          usage_count: number | null
          version: string | null
        }
        Insert: {
          category_id?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          default_settings?: Json | null
          dependencies?: Json | null
          description?: string | null
          estimated_budget?: number | null
          estimated_duration_days?: number | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          last_used_at?: string | null
          milestones?: Json | null
          name: string
          phases?: Json | null
          required_roles?: Json | null
          resources?: Json | null
          tasks?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          version?: string | null
        }
        Update: {
          category_id?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          default_settings?: Json | null
          dependencies?: Json | null
          description?: string | null
          estimated_budget?: number | null
          estimated_duration_days?: number | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          last_used_at?: string | null
          milestones?: Json | null
          name?: string
          phases?: Json | null
          required_roles?: Json | null
          resources?: Json | null
          tasks?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "project_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_timesheets: {
        Row: {
          activity_type: string | null
          approved_at: string | null
          approved_by: string | null
          billable_hours: number | null
          billed_at: string | null
          break_duration_minutes: number | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          employee_id: string
          end_time: string | null
          hourly_rate: number | null
          hours_worked: number
          id: string
          invoice_id: string | null
          is_billable: boolean | null
          overtime_hours: number | null
          project_id: string
          rejection_reason: string | null
          start_time: string | null
          status: string | null
          submitted_at: string | null
          task_id: string | null
          total_amount: number | null
          updated_at: string | null
          work_date: string
        }
        Insert: {
          activity_type?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billable_hours?: number | null
          billed_at?: string | null
          break_duration_minutes?: number | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employee_id: string
          end_time?: string | null
          hourly_rate?: number | null
          hours_worked: number
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          overtime_hours?: number | null
          project_id: string
          rejection_reason?: string | null
          start_time?: string | null
          status?: string | null
          submitted_at?: string | null
          task_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          work_date: string
        }
        Update: {
          activity_type?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billable_hours?: number | null
          billed_at?: string | null
          break_duration_minutes?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employee_id?: string
          end_time?: string | null
          hourly_rate?: number | null
          hours_worked?: number
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          overtime_hours?: number | null
          project_id?: string
          rejection_reason?: string | null
          start_time?: string | null
          status?: string | null
          submitted_at?: string | null
          task_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_timesheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timesheets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timesheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timesheets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_cost: number | null
          actual_end_date: string | null
          billing_type: string | null
          budget_amount: number | null
          budget_currency: string | null
          code: string | null
          color: string | null
          company_id: string
          created_at: string | null
          customer_id: string | null
          deadline: string | null
          description: string | null
          end_date: string | null
          hourly_rate: number | null
          id: string
          invoiced_amount: number | null
          is_billable: boolean | null
          manager_id: string | null
          name: string
          priority: string | null
          project_number: string
          start_date: string | null
          status: string | null
          tags: string[] | null
          third_party_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_end_date?: string | null
          billing_type?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          code?: string | null
          color?: string | null
          company_id: string
          created_at?: string | null
          customer_id?: string | null
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          invoiced_amount?: number | null
          is_billable?: boolean | null
          manager_id?: string | null
          name: string
          priority?: string | null
          project_number: string
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          third_party_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_end_date?: string | null
          billing_type?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          code?: string | null
          color?: string | null
          company_id?: string
          created_at?: string | null
          customer_id?: string | null
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          invoiced_amount?: number | null
          is_billable?: boolean | null
          manager_id?: string | null
          name?: string
          priority?: string | null
          project_number?: string
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          third_party_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "third_parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_third_party_id_fkey"
            columns: ["third_party_id"]
            isOneToOne: false
            referencedRelation: "third_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          company_id: string
          created_at: string | null
          discount_rate: number | null
          id: string
          item_description: string | null
          item_name: string
          item_type: string | null
          line_total: number | null
          purchase_id: string
          quantity: number
          sku: string | null
          supplier_reference: string | null
          tax_rate: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          discount_rate?: number | null
          id?: string
          item_description?: string | null
          item_name: string
          item_type?: string | null
          line_total?: number | null
          purchase_id: string
          quantity?: number
          sku?: string | null
          supplier_reference?: string | null
          tax_rate?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          discount_rate?: number | null
          id?: string
          item_description?: string | null
          item_name?: string
          item_type?: string | null
          line_total?: number | null
          purchase_id?: string
          quantity?: number
          sku?: string | null
          supplier_reference?: string | null
          tax_rate?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          company_id: string
          confirmed_delivery_date: string | null
          created_at: string | null
          currency: string | null
          delivery_instructions: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          purchase_id: string | null
          requested_delivery_date: string | null
          status: string | null
          subtotal: number | null
          supplier_id: string
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          company_id: string
          confirmed_delivery_date?: string | null
          created_at?: string | null
          currency?: string | null
          delivery_instructions?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          purchase_id?: string | null
          requested_delivery_date?: string | null
          status?: string | null
          subtotal?: number | null
          supplier_id: string
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          company_id?: string
          confirmed_delivery_date?: string | null
          created_at?: string | null
          currency?: string | null
          delivery_instructions?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          purchase_id?: string | null
          requested_delivery_date?: string | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders_archive: {
        Row: {
          access_log: Json | null
          archive_category: string | null
          archive_file_path: string
          archive_file_url: string
          archive_reference: string
          archived_at: string | null
          archived_by: string | null
          can_be_destroyed: boolean | null
          company_id: string
          created_at: string | null
          file_format: string
          file_hash: string | null
          file_size_bytes: number | null
          generated_order_id: string | null
          id: string
          importance_level: string | null
          keywords: unknown
          last_accessed_at: string | null
          last_accessed_by: string | null
          legal_requirement: string | null
          notes: string | null
          order_data_snapshot: Json | null
          order_date: string
          order_name: string
          order_number: string | null
          order_type: string
          original_approved_at: string | null
          original_generated_at: string | null
          retention_until: string
          retention_years: number | null
          supplier_name: string | null
          tags: string[] | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          access_log?: Json | null
          archive_category?: string | null
          archive_file_path: string
          archive_file_url: string
          archive_reference: string
          archived_at?: string | null
          archived_by?: string | null
          can_be_destroyed?: boolean | null
          company_id: string
          created_at?: string | null
          file_format: string
          file_hash?: string | null
          file_size_bytes?: number | null
          generated_order_id?: string | null
          id?: string
          importance_level?: string | null
          keywords?: unknown
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          legal_requirement?: string | null
          notes?: string | null
          order_data_snapshot?: Json | null
          order_date: string
          order_name: string
          order_number?: string | null
          order_type: string
          original_approved_at?: string | null
          original_generated_at?: string | null
          retention_until: string
          retention_years?: number | null
          supplier_name?: string | null
          tags?: string[] | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          access_log?: Json | null
          archive_category?: string | null
          archive_file_path?: string
          archive_file_url?: string
          archive_reference?: string
          archived_at?: string | null
          archived_by?: string | null
          can_be_destroyed?: boolean | null
          company_id?: string
          created_at?: string | null
          file_format?: string
          file_hash?: string | null
          file_size_bytes?: number | null
          generated_order_id?: string | null
          id?: string
          importance_level?: string | null
          keywords?: unknown
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          legal_requirement?: string | null
          notes?: string | null
          order_data_snapshot?: Json | null
          order_date?: string
          order_name?: string
          order_number?: string | null
          order_type?: string
          original_approved_at?: string | null
          original_generated_at?: string | null
          retention_until?: string
          retention_years?: number | null
          supplier_name?: string | null
          tags?: string[] | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_archive_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_archive_generated_order_id_fkey"
            columns: ["generated_order_id"]
            isOneToOne: false
            referencedRelation: "generated_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipts: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          notes: string | null
          purchase_id: string | null
          purchase_order_id: string | null
          receipt_date: string
          receipt_number: string
          received_by: string | null
          status: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          purchase_id?: string | null
          purchase_order_id?: string | null
          receipt_date?: string
          receipt_number: string
          received_by?: string | null
          status?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          purchase_id?: string | null
          purchase_order_id?: string | null
          receipt_date?: string
          receipt_number?: string
          received_by?: string | null
          status?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          delivery_date: string | null
          description: string | null
          discount_amount: number | null
          discount_rate: number | null
          due_date: string | null
          id: string
          internal_notes: string | null
          invoice_number: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_status: string | null
          purchase_date: string
          purchase_number: string
          received_at: string | null
          sent_at: string | null
          status: string | null
          subtotal_amount: number | null
          supplier_id: string
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          delivery_date?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_rate?: number | null
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          purchase_date?: string
          purchase_number: string
          received_at?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal_amount?: number | null
          supplier_id: string
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          delivery_date?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_rate?: number | null
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          purchase_date?: string
          purchase_number?: string
          received_at?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal_amount?: number | null
          supplier_id?: string
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string | null
          description: string | null
          discount_rate: number | null
          id: string
          item_type: string | null
          line_order: number | null
          line_total: number | null
          name: string
          notes: string | null
          quantity: number | null
          quote_id: string
          sku: string | null
          tax_rate: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_rate?: number | null
          id?: string
          item_type?: string | null
          line_order?: number | null
          line_total?: number | null
          name: string
          notes?: string | null
          quantity?: number | null
          quote_id: string
          sku?: string | null
          tax_rate?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_rate?: number | null
          id?: string
          item_type?: string | null
          line_order?: number | null
          line_total?: number | null
          name?: string
          notes?: string | null
          quantity?: number | null
          quote_id?: string
          sku?: string | null
          tax_rate?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_id: string
          description: string | null
          discount_amount: number | null
          id: string
          internal_notes: string | null
          notes: string | null
          payment_terms: number | null
          quote_date: string | null
          quote_number: string
          rejected_at: string | null
          sent_at: string | null
          status: string | null
          subtotal_amount: number | null
          tax_amount: number | null
          tax_rate: number | null
          title: string | null
          total_amount: number | null
          updated_at: string | null
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id: string
          description?: string | null
          discount_amount?: number | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          payment_terms?: number | null
          quote_date?: string | null
          quote_number: string
          rejected_at?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal_amount?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          title?: string | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string
          description?: string | null
          discount_amount?: number | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          payment_terms?: number | null
          quote_date?: string | null
          quote_number?: string
          rejected_at?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal_amount?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          title?: string | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      report_cache: {
        Row: {
          cache_key: string
          company_id: string | null
          created_at: string
          expires_at: string
          id: number
          report_id: string
          result: Json
        }
        Insert: {
          cache_key: string
          company_id?: string | null
          created_at?: string
          expires_at: string
          id?: number
          report_id: string
          result: Json
        }
        Update: {
          cache_key?: string
          company_id?: string | null
          created_at?: string
          expires_at?: string
          id?: number
          report_id?: string
          result?: Json
        }
        Relationships: []
      }
      report_comparisons: {
        Row: {
          base_report_id: string
          company_id: string
          compare_report_id: string
          comparison_data: Json | null
          comparison_name: string
          created_at: string | null
          created_by: string | null
          id: string
          key_changes: string[] | null
          notes: string | null
          report_type: string
          variance_percentage: number | null
        }
        Insert: {
          base_report_id: string
          company_id: string
          compare_report_id: string
          comparison_data?: Json | null
          comparison_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          key_changes?: string[] | null
          notes?: string | null
          report_type: string
          variance_percentage?: number | null
        }
        Update: {
          base_report_id?: string
          company_id?: string
          compare_report_id?: string
          comparison_data?: Json | null
          comparison_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          key_changes?: string[] | null
          notes?: string | null
          report_type?: string
          variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_comparisons_base_report_id_fkey"
            columns: ["base_report_id"]
            isOneToOne: false
            referencedRelation: "generated_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_comparisons_base_report_id_fkey"
            columns: ["base_report_id"]
            isOneToOne: false
            referencedRelation: "v_recent_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_comparisons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_comparisons_compare_report_id_fkey"
            columns: ["compare_report_id"]
            isOneToOne: false
            referencedRelation: "generated_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_comparisons_compare_report_id_fkey"
            columns: ["compare_report_id"]
            isOneToOne: false
            referencedRelation: "v_recent_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_executions: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          parameters: Json
          progress: number
          report_id: string
          result: Json | null
          status: string
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          parameters: Json
          progress?: number
          report_id: string
          result?: Json | null
          status: string
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          parameters?: Json
          progress?: number
          report_id?: string
          result?: Json | null
          status?: string
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          day_of_month: number | null
          day_of_week: number | null
          frequency: string
          id: string
          is_active: boolean | null
          last_run: string | null
          last_status: string | null
          name: string
          next_run: string | null
          recipients: Json | null
          report_template_id: string
          time_of_day: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          last_status?: string | null
          name: string
          next_run?: string | null
          recipients?: Json | null
          report_template_id: string
          time_of_day?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          last_status?: string | null
          name?: string
          next_run?: string | null
          recipients?: Json | null
          report_template_id?: string
          time_of_day?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedules_report_template_id_fkey"
            columns: ["report_template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_schedules_executions: {
        Row: {
          company_id: string
          created_at: string | null
          error_message: string | null
          executed_at: string | null
          execution_duration_ms: number | null
          generated_report_id: string | null
          id: string
          notifications_sent: number | null
          reports_generated: number | null
          schedule_id: string
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          execution_duration_ms?: number | null
          generated_report_id?: string | null
          id?: string
          notifications_sent?: number | null
          reports_generated?: number | null
          schedule_id: string
          status: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          execution_duration_ms?: number | null
          generated_report_id?: string | null
          id?: string
          notifications_sent?: number | null
          reports_generated?: number | null
          schedule_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_executions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedules_executions_generated_report_id_fkey"
            columns: ["generated_report_id"]
            isOneToOne: false
            referencedRelation: "generated_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedules_executions_generated_report_id_fkey"
            columns: ["generated_report_id"]
            isOneToOne: false
            referencedRelation: "v_recent_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedules_executions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "report_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          company_id: string | null
          config: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      reports_archive: {
        Row: {
          access_log: Json | null
          archive_category: string | null
          archive_file_path: string
          archive_file_url: string
          archive_reference: string
          archived_at: string | null
          archived_by: string | null
          can_be_destroyed: boolean | null
          company_id: string
          created_at: string | null
          destruction_date: string | null
          file_format: string
          file_hash: string | null
          file_size_bytes: number | null
          fiscal_year: number
          generated_report_id: string | null
          id: string
          importance_level: string | null
          keywords: unknown
          last_accessed_at: string | null
          last_accessed_by: string | null
          legal_requirement: string | null
          notes: string | null
          original_generated_at: string | null
          original_generated_by: string | null
          report_data_snapshot: Json | null
          report_date: string
          report_name: string
          report_type: string
          retention_until: string
          retention_years: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          access_log?: Json | null
          archive_category?: string | null
          archive_file_path: string
          archive_file_url: string
          archive_reference: string
          archived_at?: string | null
          archived_by?: string | null
          can_be_destroyed?: boolean | null
          company_id: string
          created_at?: string | null
          destruction_date?: string | null
          file_format: string
          file_hash?: string | null
          file_size_bytes?: number | null
          fiscal_year: number
          generated_report_id?: string | null
          id?: string
          importance_level?: string | null
          keywords?: unknown
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          legal_requirement?: string | null
          notes?: string | null
          original_generated_at?: string | null
          original_generated_by?: string | null
          report_data_snapshot?: Json | null
          report_date: string
          report_name: string
          report_type: string
          retention_until: string
          retention_years?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          access_log?: Json | null
          archive_category?: string | null
          archive_file_path?: string
          archive_file_url?: string
          archive_reference?: string
          archived_at?: string | null
          archived_by?: string | null
          can_be_destroyed?: boolean | null
          company_id?: string
          created_at?: string | null
          destruction_date?: string | null
          file_format?: string
          file_hash?: string | null
          file_size_bytes?: number | null
          fiscal_year?: number
          generated_report_id?: string | null
          id?: string
          importance_level?: string | null
          keywords?: unknown
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          legal_requirement?: string | null
          notes?: string | null
          original_generated_at?: string | null
          original_generated_by?: string | null
          report_data_snapshot?: Json | null
          report_date?: string
          report_name?: string
          report_type?: string
          retention_until?: string
          retention_years?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_archive_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_archive_generated_report_id_fkey"
            columns: ["generated_report_id"]
            isOneToOne: false
            referencedRelation: "generated_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_archive_generated_report_id_fkey"
            columns: ["generated_report_id"]
            isOneToOne: false
            referencedRelation: "v_recent_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_allocations: {
        Row: {
          allocation_percentage: number | null
          company_id: string
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          project_id: string
          quantity_allocated: number
          resource_id: string
          start_date: string
          status: string | null
          task_id: string | null
          total_cost: number | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          allocation_percentage?: number | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          project_id: string
          quantity_allocated: number
          resource_id: string
          start_date: string
          status?: string | null
          task_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          allocation_percentage?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          project_id?: string
          quantity_allocated?: number
          resource_id?: string
          start_date?: string
          status?: string | null
          task_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_allocations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_allocations_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "project_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_allocations_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      rfa_calculations: {
        Row: {
          adjustments: Json | null
          base_amount: number | null
          bonuses: Json | null
          calculated_by: string | null
          calculation_details: Json | null
          calculation_method: string | null
          calculation_notes: string | null
          calculation_period: string
          company_id: string
          contract_id: string
          created_at: string | null
          currency: string | null
          dispute_reason: string | null
          id: string
          invoice_date: string | null
          invoice_id: string | null
          invoiced: boolean | null
          paid: boolean | null
          payment_date: string | null
          payment_due_date: string | null
          period_end: string
          period_start: string
          reference_documents: string[] | null
          rfa_amount: number
          rfa_percentage: number | null
          status: string | null
          turnover_amount: number
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          adjustments?: Json | null
          base_amount?: number | null
          bonuses?: Json | null
          calculated_by?: string | null
          calculation_details?: Json | null
          calculation_method?: string | null
          calculation_notes?: string | null
          calculation_period: string
          company_id: string
          contract_id: string
          created_at?: string | null
          currency?: string | null
          dispute_reason?: string | null
          id?: string
          invoice_date?: string | null
          invoice_id?: string | null
          invoiced?: boolean | null
          paid?: boolean | null
          payment_date?: string | null
          payment_due_date?: string | null
          period_end: string
          period_start: string
          reference_documents?: string[] | null
          rfa_amount: number
          rfa_percentage?: number | null
          status?: string | null
          turnover_amount: number
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          adjustments?: Json | null
          base_amount?: number | null
          bonuses?: Json | null
          calculated_by?: string | null
          calculation_details?: Json | null
          calculation_method?: string | null
          calculation_notes?: string | null
          calculation_period?: string
          company_id?: string
          contract_id?: string
          created_at?: string | null
          currency?: string | null
          dispute_reason?: string | null
          id?: string
          invoice_date?: string | null
          invoice_id?: string | null
          invoiced?: boolean | null
          paid?: boolean | null
          payment_date?: string | null
          payment_due_date?: string | null
          period_end?: string
          period_start?: string
          reference_documents?: string[] | null
          rfa_amount?: number
          rfa_percentage?: number | null
          status?: string | null
          turnover_amount?: number
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfa_calculations_calculated_by_fkey"
            columns: ["calculated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfa_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfa_calculations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfa_calculations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_balances"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "rfa_calculations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfa_calculations_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      rgpd_consents: {
        Row: {
          consent_given: boolean
          consent_method: string | null
          consent_source: string | null
          consent_type: string
          consent_version: string
          created_at: string
          granted_at: string | null
          id: string
          ip_address: unknown
          revoked_at: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_given?: boolean
          consent_method?: string | null
          consent_source?: string | null
          consent_type: string
          consent_version?: string
          created_at?: string
          granted_at?: string | null
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_given?: boolean
          consent_method?: string | null
          consent_source?: string | null
          consent_type?: string
          consent_version?: string
          created_at?: string
          granted_at?: string | null
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rgpd_logs: {
        Row: {
          action: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          operation_status: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          operation_status?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          operation_status?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          is_system: boolean | null
          level: number | null
          name: string
          permissions_count: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          level?: number | null
          name: string
          permissions_count?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          level?: number | null
          name?: string
          permissions_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors_catalog: {
        Row: {
          category: string
          common_modules: string[] | null
          company_count: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          last_usage_date: string | null
          parent_sector_code: string | null
          priority_order: number | null
          regulatory_requirements: string[] | null
          sector_code: string
          sector_name: string
          sector_name_english: string | null
          subcategory: string | null
          typical_size_ranges: string[] | null
          updated_at: string | null
        }
        Insert: {
          category: string
          common_modules?: string[] | null
          company_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          last_usage_date?: string | null
          parent_sector_code?: string | null
          priority_order?: number | null
          regulatory_requirements?: string[] | null
          sector_code: string
          sector_name: string
          sector_name_english?: string | null
          subcategory?: string | null
          typical_size_ranges?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          common_modules?: string[] | null
          company_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          last_usage_date?: string | null
          parent_sector_code?: string | null
          priority_order?: number | null
          regulatory_requirements?: string[] | null
          sector_code?: string
          sector_name?: string
          sector_name_english?: string | null
          subcategory?: string | null
          typical_size_ranges?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sectors_catalog_parent_sector_code_fkey"
            columns: ["parent_sector_code"]
            isOneToOne: false
            referencedRelation: "sectors_catalog"
            referencedColumns: ["sector_code"]
          },
        ]
      }
      security_configurations: {
        Row: {
          company_id: string | null
          compliance_standard: string | null
          config_name: string
          config_type: string
          configuration: Json
          created_at: string | null
          id: string
          is_enforced: boolean | null
          last_reviewed: string | null
          review_frequency_days: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          company_id?: string | null
          compliance_standard?: string | null
          config_name: string
          config_type: string
          configuration?: Json
          created_at?: string | null
          id?: string
          is_enforced?: boolean | null
          last_reviewed?: string | null
          review_frequency_days?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          company_id?: string | null
          compliance_standard?: string | null
          config_name?: string
          config_type?: string
          configuration?: Json
          created_at?: string | null
          id?: string
          is_enforced?: boolean | null
          last_reviewed?: string | null
          review_frequency_days?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          alert_recipients: string[] | null
          alert_sent: boolean | null
          city: string | null
          company_id: string | null
          correlation_id: string | null
          country_code: string | null
          created_at: string | null
          event_category: string
          event_code: string
          event_description: string
          event_details: Json | null
          event_timestamp: string | null
          id: string
          impact_assessment: string | null
          ip_address: unknown
          is_false_positive: boolean | null
          region: string | null
          related_events: string[] | null
          request_method: string | null
          request_path: string | null
          requires_investigation: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          response_actions: string[] | null
          response_status: number | null
          session_id: string | null
          severity_level: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          alert_recipients?: string[] | null
          alert_sent?: boolean | null
          city?: string | null
          company_id?: string | null
          correlation_id?: string | null
          country_code?: string | null
          created_at?: string | null
          event_category: string
          event_code: string
          event_description: string
          event_details?: Json | null
          event_timestamp?: string | null
          id?: string
          impact_assessment?: string | null
          ip_address?: unknown
          is_false_positive?: boolean | null
          region?: string | null
          related_events?: string[] | null
          request_method?: string | null
          request_path?: string | null
          requires_investigation?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_actions?: string[] | null
          response_status?: number | null
          session_id?: string | null
          severity_level: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          alert_recipients?: string[] | null
          alert_sent?: boolean | null
          city?: string | null
          company_id?: string | null
          correlation_id?: string | null
          country_code?: string | null
          created_at?: string | null
          event_category?: string
          event_code?: string
          event_description?: string
          event_details?: Json | null
          event_timestamp?: string | null
          id?: string
          impact_assessment?: string | null
          ip_address?: unknown
          is_false_positive?: boolean | null
          region?: string | null
          related_events?: string[] | null
          request_method?: string | null
          request_path?: string | null
          requires_investigation?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_actions?: string[] | null
          response_status?: number | null
          session_id?: string | null
          severity_level?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sepa_exports: {
        Row: {
          bank_account_id: string | null
          company_id: string | null
          created_at: string | null
          currency: string | null
          execution_date: string
          file_name: string
          generated_at: string | null
          generated_by: string | null
          id: string
          message_id: string
          nb_of_transactions: number
          processed_at: string | null
          sent_at: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          xml_content: string | null
        }
        Insert: {
          bank_account_id?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          execution_date: string
          file_name: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          message_id: string
          nb_of_transactions: number
          processed_at?: string | null
          sent_at?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          xml_content?: string | null
        }
        Update: {
          bank_account_id?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          execution_date?: string
          file_name?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          message_id?: string
          nb_of_transactions?: number
          processed_at?: string | null
          sent_at?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sepa_exports_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sepa_exports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sepa_payments: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string | null
          creditor_bic: string
          creditor_iban: string
          creditor_name: string
          currency: string | null
          id: string
          reference: string
          remittance_info: string | null
          sepa_export_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string | null
          creditor_bic: string
          creditor_iban: string
          creditor_name: string
          currency?: string | null
          id?: string
          reference: string
          remittance_info?: string | null
          sepa_export_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string | null
          creditor_bic?: string
          creditor_iban?: string
          creditor_name?: string
          currency?: string | null
          id?: string
          reference?: string
          remittance_info?: string | null
          sepa_export_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sepa_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sepa_payments_sepa_export_id_fkey"
            columns: ["sepa_export_id"]
            isOneToOne: false
            referencedRelation: "sepa_exports"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_numbers: {
        Row: {
          batch_number: string | null
          company_id: string
          created_at: string | null
          customer_id: string | null
          expiry_date: string | null
          id: string
          lot_number: string | null
          manufacture_date: string | null
          product_id: string
          product_variant_id: string | null
          purchase_reference: string | null
          received_date: string | null
          sale_reference: string | null
          serial_number: string
          sold_date: string | null
          status: string | null
          supplier_id: string | null
          updated_at: string | null
          warehouse_id: string
        }
        Insert: {
          batch_number?: string | null
          company_id: string
          created_at?: string | null
          customer_id?: string | null
          expiry_date?: string | null
          id?: string
          lot_number?: string | null
          manufacture_date?: string | null
          product_id: string
          product_variant_id?: string | null
          purchase_reference?: string | null
          received_date?: string | null
          sale_reference?: string | null
          serial_number: string
          sold_date?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          warehouse_id: string
        }
        Update: {
          batch_number?: string | null
          company_id?: string
          created_at?: string | null
          customer_id?: string | null
          expiry_date?: string | null
          id?: string
          lot_number?: string | null
          manufacture_date?: string | null
          product_id?: string
          product_variant_id?: string | null
          purchase_reference?: string | null
          received_date?: string | null
          sale_reference?: string | null
          serial_number?: string
          sold_date?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "serial_numbers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_accounts: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used: string | null
          name: string
          permissions: Json | null
          rate_limits: Json | null
          service_type: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          name: string
          permissions?: Json | null
          rate_limits?: Json | null
          service_type?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          name?: string
          permissions?: Json | null
          rate_limits?: Json | null
          service_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_assessments: {
        Row: {
          assessment_date: string
          assessment_method: string | null
          assessor_id: string | null
          certification_reference: string | null
          company_id: string
          created_at: string | null
          current_score: number
          employee_id: string
          evidence_provided: string | null
          id: string
          improvement_plan: string | null
          recommended_actions: string[] | null
          skill_category: string | null
          skill_level: string
          skill_name: string
          target_achievement_date: string | null
          target_score: number | null
          updated_at: string | null
          validated_by: string | null
          validation_date: string | null
        }
        Insert: {
          assessment_date?: string
          assessment_method?: string | null
          assessor_id?: string | null
          certification_reference?: string | null
          company_id: string
          created_at?: string | null
          current_score: number
          employee_id: string
          evidence_provided?: string | null
          id?: string
          improvement_plan?: string | null
          recommended_actions?: string[] | null
          skill_category?: string | null
          skill_level: string
          skill_name: string
          target_achievement_date?: string | null
          target_score?: number | null
          updated_at?: string | null
          validated_by?: string | null
          validation_date?: string | null
        }
        Update: {
          assessment_date?: string
          assessment_method?: string | null
          assessor_id?: string | null
          certification_reference?: string | null
          company_id?: string
          created_at?: string | null
          current_score?: number
          employee_id?: string
          evidence_provided?: string | null
          id?: string
          improvement_plan?: string | null
          recommended_actions?: string[] | null
          skill_category?: string | null
          skill_level?: string
          skill_name?: string
          target_achievement_date?: string | null
          target_score?: number | null
          updated_at?: string | null
          validated_by?: string | null
          validation_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessments_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_alerts: {
        Row: {
          ai_model_used: string | null
          alert_data: Json | null
          alert_type: string
          auto_resolve: boolean | null
          company_id: string
          confidence_score: number | null
          created_at: string | null
          data_source: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          suggested_actions: Json | null
          title: string
          triggered_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_model_used?: string | null
          alert_data?: Json | null
          alert_type: string
          auto_resolve?: boolean | null
          company_id: string
          confidence_score?: number | null
          created_at?: string | null
          data_source?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          suggested_actions?: Json | null
          title: string
          triggered_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_model_used?: string | null
          alert_data?: Json | null
          alert_type?: string
          auto_resolve?: boolean | null
          company_id?: string
          confidence_score?: number | null
          created_at?: string | null
          data_source?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          suggested_actions?: Json | null
          title?: string
          triggered_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          company_id: string
          created_at: string | null
          current_stock: number
          id: string
          is_acknowledged: boolean | null
          is_active: boolean | null
          product_id: string
          product_variant_id: string | null
          severity: string
          threshold_stock: number
          triggered_at: string | null
          warehouse_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          company_id: string
          created_at?: string | null
          current_stock: number
          id?: string
          is_acknowledged?: boolean | null
          is_active?: boolean | null
          product_id: string
          product_variant_id?: string | null
          severity?: string
          threshold_stock: number
          triggered_at?: string | null
          warehouse_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          company_id?: string
          created_at?: string | null
          current_stock?: number
          id?: string
          is_acknowledged?: boolean | null
          is_active?: boolean | null
          product_id?: string
          product_variant_id?: string | null
          severity?: string
          threshold_stock?: number
          triggered_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          customer_email: string | null
          id: string
          stripe_customer_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          id?: string
          stripe_customer_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          id?: string
          stripe_customer_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string | null
          currency: string
          description: string | null
          features: Json | null
          id: string
          interval_type: string
          is_active: boolean | null
          is_trial: boolean | null
          limits_per_month: Json | null
          max_clients: number | null
          max_users: number | null
          name: string
          price: number
          sort_order: number | null
          storage_limit: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          support_level: string | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          billing_period?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id: string
          interval_type: string
          is_active?: boolean | null
          is_trial?: boolean | null
          limits_per_month?: Json | null
          max_clients?: number | null
          max_users?: number | null
          name: string
          price?: number
          sort_order?: number | null
          storage_limit?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          support_level?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_period?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval_type?: string
          is_active?: boolean | null
          is_trial?: boolean | null
          limits_per_month?: Json | null
          max_clients?: number | null
          max_users?: number | null
          name?: string
          price?: number
          sort_order?: number | null
          storage_limit?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          support_level?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          cancel_reason: string | null
          canceled_at: string | null
          company_id: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          cancel_reason?: string | null
          canceled_at?: string | null
          company_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          cancel_reason?: string | null
          canceled_at?: string | null
          company_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_contact_persons: {
        Row: {
          company_id: string
          created_at: string | null
          department: string | null
          email: string | null
          first_name: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          job_title: string | null
          last_name: string
          mobile: string | null
          notes: string | null
          phone: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          department?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          job_title?: string | null
          last_name: string
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          department?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          job_title?: string | null
          last_name?: string
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contact_persons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_contact_persons_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          bank_reference: string | null
          company_id: string
          created_at: string | null
          currency: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          purchase_id: string
          reference: string | null
          status: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          company_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          purchase_id: string
          reference?: string | null
          status?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          company_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          purchase_id?: string
          reference?: string | null
          status?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          account_balance: number | null
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          category: string | null
          company_id: string
          company_name: string | null
          created_at: string | null
          currency: string | null
          delivery_time: string | null
          discount: number | null
          discount_rate: number | null
          email: string | null
          id: string
          internal_notes: string | null
          is_active: boolean | null
          min_order: number | null
          name: string
          notes: string | null
          payment_terms: number | null
          phone: string | null
          rating: number | null
          registration_number: string | null
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_postal_code: string | null
          siret: string | null
          supplier_number: string
          supplier_type: string | null
          tax_number: string | null
          updated_at: string | null
        }
        Insert: {
          account_balance?: number | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          category?: string | null
          company_id: string
          company_name?: string | null
          created_at?: string | null
          currency?: string | null
          delivery_time?: string | null
          discount?: number | null
          discount_rate?: number | null
          email?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean | null
          min_order?: number | null
          name: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          rating?: number | null
          registration_number?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          siret?: string | null
          supplier_number: string
          supplier_type?: string | null
          tax_number?: string | null
          updated_at?: string | null
        }
        Update: {
          account_balance?: number | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          category?: string | null
          company_id?: string
          company_name?: string | null
          created_at?: string | null
          currency?: string | null
          delivery_time?: string | null
          discount?: number | null
          discount_rate?: number | null
          email?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean | null
          min_order?: number | null
          name?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          rating?: number | null
          registration_number?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          siret?: string | null
          supplier_number?: string
          supplier_type?: string | null
          tax_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          attachments: Json | null
          author_email: string | null
          author_name: string
          created_at: string
          id: string
          is_internal: boolean
          is_staff: boolean
          message: string
          message_html: string | null
          status_change_from: string | null
          status_change_to: string | null
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          author_email?: string | null
          author_name: string
          created_at?: string
          id?: string
          is_internal?: boolean
          is_staff?: boolean
          message: string
          message_html?: string | null
          status_change_from?: string | null
          status_change_to?: string | null
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          author_email?: string | null
          author_name?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          is_staff?: boolean
          message?: string
          message_html?: string | null
          status_change_from?: string | null
          status_change_to?: string | null
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          category: string | null
          closed_at: string | null
          company_id: string
          created_at: string
          created_by: string
          description: string
          first_response_at: string | null
          first_response_sla_breach: boolean | null
          id: string
          metadata: Json | null
          priority: string
          resolution_notes: string | null
          resolution_sla_breach: boolean | null
          resolution_sla_deadline: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          subject: string
          tags: string[] | null
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string | null
          closed_at?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description: string
          first_response_at?: string | null
          first_response_sla_breach?: boolean | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolution_notes?: string | null
          resolution_sla_breach?: boolean | null
          resolution_sla_deadline?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject: string
          tags?: string[] | null
          ticket_number: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string | null
          closed_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string
          first_response_at?: string | null
          first_response_sla_breach?: boolean | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolution_notes?: string | null
          resolution_sla_breach?: boolean | null
          resolution_sla_deadline?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject?: string
          tags?: string[] | null
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          company_id: string
          completion_percentage: number | null
          completion_time_minutes: number | null
          created_at: string | null
          employee_id: string | null
          id: string
          ip_address: unknown
          is_complete: boolean | null
          response_date: string | null
          responses: Json
          survey_id: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          company_id: string
          completion_percentage?: number | null
          completion_time_minutes?: number | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          ip_address?: unknown
          is_complete?: boolean | null
          response_date?: string | null
          responses?: Json
          survey_id: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          company_id?: string
          completion_percentage?: number | null
          completion_time_minutes?: number | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          ip_address?: unknown
          is_complete?: boolean | null
          response_date?: string | null
          responses?: Json
          survey_id?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "employee_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configurations: {
        Row: {
          category: string
          company_id: string | null
          config_key: string
          config_value: Json
          created_at: string | null
          created_by: string | null
          data_type: string
          description: string | null
          id: string
          is_active: boolean | null
          is_encrypted: boolean | null
          requires_restart: boolean | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          category?: string
          company_id?: string | null
          config_key: string
          config_value: Json
          created_at?: string | null
          created_by?: string | null
          data_type?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_encrypted?: boolean | null
          requires_restart?: boolean | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          category?: string
          company_id?: string | null
          config_key?: string
          config_value?: Json
          created_at?: string | null
          created_by?: string | null
          data_type?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_encrypted?: boolean | null
          requires_restart?: boolean | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "system_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          download_count: number | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_latest_version: boolean | null
          is_public: boolean | null
          mime_type: string
          original_name: string
          project_id: string
          tags: string[] | null
          task_id: string
          uploaded_by: string
          version: number | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          is_latest_version?: boolean | null
          is_public?: boolean | null
          mime_type: string
          original_name: string
          project_id: string
          tags?: string[] | null
          task_id: string
          uploaded_by: string
          version?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_latest_version?: boolean | null
          is_public?: boolean | null
          mime_type?: string
          original_name?: string
          project_id?: string
          tags?: string[] | null
          task_id?: string
          uploaded_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklists: {
        Row: {
          blocks_task_completion: boolean | null
          company_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_completed: boolean | null
          is_required: boolean | null
          item_order: number
          item_text: string
          project_id: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          blocks_task_completion?: boolean | null
          company_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_completed?: boolean | null
          is_required?: boolean | null
          item_order?: number
          item_text: string
          project_id: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          blocks_task_completion?: boolean | null
          company_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_completed?: boolean | null
          is_required?: boolean | null
          item_order?: number
          item_text?: string
          project_id?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklists_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          company_id: string
          content: string
          content_type: string | null
          created_at: string | null
          created_by: string
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          is_internal: boolean | null
          is_system: boolean | null
          mention_users: string[] | null
          parent_comment_id: string | null
          project_id: string
          reactions: Json | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          content: string
          content_type?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_internal?: boolean | null
          is_system?: boolean | null
          mention_users?: string[] | null
          parent_comment_id?: string | null
          project_id: string
          reactions?: Json | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          content?: string
          content_type?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_internal?: boolean | null
          is_system?: boolean | null
          mention_users?: string[] | null
          parent_comment_id?: string | null
          project_id?: string
          reactions?: Json | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string | null
          created_by: string | null
          dependency_type: string
          id: string
          is_active: boolean | null
          lag_days: number | null
          predecessor_task_id: string
          project_id: string
          successor_task_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dependency_type?: string
          id?: string
          is_active?: boolean | null
          lag_days?: number | null
          predecessor_task_id: string
          project_id: string
          successor_task_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dependency_type?: string
          id?: string
          is_active?: boolean | null
          lag_days?: number | null
          predecessor_task_id?: string
          project_id?: string
          successor_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_predecessor_task_id_fkey"
            columns: ["predecessor_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_successor_task_id_fkey"
            columns: ["successor_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_statuses: {
        Row: {
          auto_complete_subtasks: boolean | null
          color: string
          company_id: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_cancelled: boolean | null
          is_final: boolean | null
          is_initial: boolean | null
          name: string
          progress_percentage: number | null
          sort_order: number | null
          stops_time_tracking: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_complete_subtasks?: boolean | null
          color?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_cancelled?: boolean | null
          is_final?: boolean | null
          is_initial?: boolean | null
          name: string
          progress_percentage?: number | null
          sort_order?: number | null
          stops_time_tracking?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_complete_subtasks?: boolean | null
          color?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_cancelled?: boolean | null
          is_final?: boolean | null
          is_initial?: boolean | null
          name?: string
          progress_percentage?: number | null
          sort_order?: number | null
          stops_time_tracking?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_statuses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          allowed_statuses: string[] | null
          color: string
          company_id: string | null
          created_at: string | null
          default_estimated_hours: number | null
          default_hourly_rate: number | null
          default_status: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          requires_approval: boolean | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_statuses?: string[] | null
          color?: string
          company_id?: string | null
          created_at?: string | null
          default_estimated_hours?: number | null
          default_hourly_rate?: number | null
          default_status?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          requires_approval?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_statuses?: string[] | null
          color?: string
          company_id?: string | null
          created_at?: string | null
          default_estimated_hours?: number | null
          default_hourly_rate?: number | null
          default_status?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          requires_approval?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          action_required: string | null
          auto_resolve_date: string | null
          company_id: string
          created_at: string | null
          declaration_id: string | null
          due_date: string | null
          id: string
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          title: string
          trigger_date: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_required?: string | null
          auto_resolve_date?: string | null
          company_id: string
          created_at?: string | null
          declaration_id?: string | null
          due_date?: string | null
          id?: string
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title: string
          trigger_date?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_required?: string | null
          auto_resolve_date?: string | null
          company_id?: string
          created_at?: string | null
          declaration_id?: string | null
          due_date?: string | null
          id?: string
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title?: string
          trigger_date?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_alerts_declaration_id_fkey"
            columns: ["declaration_id"]
            isOneToOne: false
            referencedRelation: "tax_declarations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_calendar_events: {
        Row: {
          all_day: boolean | null
          amount: number | null
          company_id: string
          created_at: string | null
          created_by: string | null
          declaration_id: string | null
          description: string | null
          end_date: string | null
          id: string
          priority: string
          reminders: Json | null
          start_date: string
          status: string
          tax_type: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          amount?: number | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          declaration_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          priority?: string
          reminders?: Json | null
          start_date: string
          status?: string
          tax_type?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          amount?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          declaration_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          priority?: string
          reminders?: Json | null
          start_date?: string
          status?: string
          tax_type?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_calendar_events_declaration_id_fkey"
            columns: ["declaration_id"]
            isOneToOne: false
            referencedRelation: "tax_declarations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_declarations: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          declaration_data: Json | null
          declaration_type: string
          due_date: string
          id: string
          month: number | null
          period_end: string
          period_start: string
          period_type: string
          quarter: number | null
          status: string | null
          submission_date: string | null
          tax_amount: number | null
          tax_base: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          declaration_data?: Json | null
          declaration_type: string
          due_date: string
          id?: string
          month?: number | null
          period_end: string
          period_start: string
          period_type: string
          quarter?: number | null
          status?: string | null
          submission_date?: string | null
          tax_amount?: number | null
          tax_base?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          declaration_data?: Json | null
          declaration_type?: string
          due_date?: string
          id?: string
          month?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          quarter?: number | null
          status?: string | null
          submission_date?: string | null
          tax_amount?: number | null
          tax_base?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_declarations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_declarations_archive: {
        Row: {
          access_log: Json | null
          archive_category: string | null
          archive_file_path: string
          archive_file_url: string
          archive_reference: string
          archived_at: string | null
          archived_by: string | null
          can_be_destroyed: boolean | null
          company_id: string
          created_at: string | null
          declaration_data_snapshot: Json | null
          declaration_date: string
          declaration_name: string
          declaration_type: string
          file_format: string
          file_hash: string | null
          file_size_bytes: number | null
          fiscal_year: number
          generated_declaration_id: string | null
          id: string
          importance_level: string | null
          keywords: unknown
          last_accessed_at: string | null
          last_accessed_by: string | null
          legal_requirement: string | null
          notes: string | null
          original_generated_at: string | null
          original_submitted_at: string | null
          original_submitted_by: string | null
          retention_until: string
          retention_years: number | null
          submission_reference: string | null
          tags: string[] | null
          tax_amount: number | null
          tax_base: number | null
          tax_due: number | null
          updated_at: string | null
        }
        Insert: {
          access_log?: Json | null
          archive_category?: string | null
          archive_file_path: string
          archive_file_url: string
          archive_reference: string
          archived_at?: string | null
          archived_by?: string | null
          can_be_destroyed?: boolean | null
          company_id: string
          created_at?: string | null
          declaration_data_snapshot?: Json | null
          declaration_date: string
          declaration_name: string
          declaration_type: string
          file_format: string
          file_hash?: string | null
          file_size_bytes?: number | null
          fiscal_year: number
          generated_declaration_id?: string | null
          id?: string
          importance_level?: string | null
          keywords?: unknown
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          legal_requirement?: string | null
          notes?: string | null
          original_generated_at?: string | null
          original_submitted_at?: string | null
          original_submitted_by?: string | null
          retention_until: string
          retention_years?: number | null
          submission_reference?: string | null
          tags?: string[] | null
          tax_amount?: number | null
          tax_base?: number | null
          tax_due?: number | null
          updated_at?: string | null
        }
        Update: {
          access_log?: Json | null
          archive_category?: string | null
          archive_file_path?: string
          archive_file_url?: string
          archive_reference?: string
          archived_at?: string | null
          archived_by?: string | null
          can_be_destroyed?: boolean | null
          company_id?: string
          created_at?: string | null
          declaration_data_snapshot?: Json | null
          declaration_date?: string
          declaration_name?: string
          declaration_type?: string
          file_format?: string
          file_hash?: string | null
          file_size_bytes?: number | null
          fiscal_year?: number
          generated_declaration_id?: string | null
          id?: string
          importance_level?: string | null
          keywords?: unknown
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          legal_requirement?: string | null
          notes?: string | null
          original_generated_at?: string | null
          original_submitted_at?: string | null
          original_submitted_by?: string | null
          retention_until?: string
          retention_years?: number | null
          submission_reference?: string | null
          tags?: string[] | null
          tax_amount?: number | null
          tax_base?: number | null
          tax_due?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_declarations_archive_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_declarations_archive_generated_declaration_id_fkey"
            columns: ["generated_declaration_id"]
            isOneToOne: false
            referencedRelation: "generated_tax_declarations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_filings: {
        Row: {
          company_id: string
          confirmation_number: string | null
          created_at: string | null
          declaration_id: string
          filed_by: string | null
          filing_date: string
          filing_method: string
          id: string
          notes: string | null
          response_data: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          confirmation_number?: string | null
          created_at?: string | null
          declaration_id: string
          filed_by?: string | null
          filing_date?: string
          filing_method: string
          id?: string
          notes?: string | null
          response_data?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          confirmation_number?: string | null
          created_at?: string | null
          declaration_id?: string
          filed_by?: string | null
          filing_date?: string
          filing_method?: string
          id?: string
          notes?: string | null
          response_data?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_filings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_filings_declaration_id_fkey"
            columns: ["declaration_id"]
            isOneToOne: false
            referencedRelation: "tax_declarations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_obligations: {
        Row: {
          advance_notice_days: number
          auto_generate: boolean | null
          company_id: string
          created_at: string | null
          due_day: number
          email_notifications: boolean | null
          frequency: string
          id: string
          is_active: boolean | null
          next_declaration_id: string | null
          next_due_date: string
          notification_emails: string[] | null
          requires_approval: boolean | null
          tax_type_id: string
          tax_type_name: string
          updated_at: string | null
        }
        Insert: {
          advance_notice_days?: number
          auto_generate?: boolean | null
          company_id: string
          created_at?: string | null
          due_day: number
          email_notifications?: boolean | null
          frequency: string
          id?: string
          is_active?: boolean | null
          next_declaration_id?: string | null
          next_due_date: string
          notification_emails?: string[] | null
          requires_approval?: boolean | null
          tax_type_id: string
          tax_type_name: string
          updated_at?: string | null
        }
        Update: {
          advance_notice_days?: number
          auto_generate?: boolean | null
          company_id?: string
          created_at?: string | null
          due_day?: number
          email_notifications?: boolean | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_declaration_id?: string | null
          next_due_date?: string
          notification_emails?: string[] | null
          requires_approval?: boolean | null
          tax_type_id?: string
          tax_type_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_obligations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_obligations_next_declaration_id_fkey"
            columns: ["next_declaration_id"]
            isOneToOne: false
            referencedRelation: "tax_declarations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_optimizations: {
        Row: {
          actual_savings: number | null
          ai_confidence: number | null
          category: string
          company_id: string
          complexity: string | null
          created_at: string | null
          deadline: string | null
          description: string
          detailed_explanation: string | null
          effort_required: string | null
          estimated_time: string | null
          expert_notes: string | null
          id: string
          implementation_steps: Json | null
          implemented_at: string | null
          implemented_by: string | null
          legal_basis: string | null
          optimal_timing: string | null
          optimization_type: string
          potential_savings: number
          requirements: Json | null
          risk_level: string | null
          savings_type: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string | null
          validated_by_expert: boolean | null
        }
        Insert: {
          actual_savings?: number | null
          ai_confidence?: number | null
          category: string
          company_id: string
          complexity?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          detailed_explanation?: string | null
          effort_required?: string | null
          estimated_time?: string | null
          expert_notes?: string | null
          id?: string
          implementation_steps?: Json | null
          implemented_at?: string | null
          implemented_by?: string | null
          legal_basis?: string | null
          optimal_timing?: string | null
          optimization_type: string
          potential_savings?: number
          requirements?: Json | null
          risk_level?: string | null
          savings_type?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
          validated_by_expert?: boolean | null
        }
        Update: {
          actual_savings?: number | null
          ai_confidence?: number | null
          category?: string
          company_id?: string
          complexity?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          detailed_explanation?: string | null
          effort_required?: string | null
          estimated_time?: string | null
          expert_notes?: string | null
          id?: string
          implementation_steps?: Json | null
          implemented_at?: string | null
          implemented_by?: string | null
          legal_basis?: string | null
          optimal_timing?: string | null
          optimization_type?: string
          potential_savings?: number
          requirements?: Json | null
          risk_level?: string | null
          savings_type?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
          validated_by_expert?: boolean | null
        }
        Relationships: []
      }
      tax_payment_schedules: {
        Row: {
          amount_due: number
          amount_paid: number | null
          company_id: string
          created_at: string | null
          declaration_id: string
          due_date: string
          id: string
          installment_number: number
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          company_id: string
          created_at?: string | null
          declaration_id: string
          due_date: string
          id?: string
          installment_number: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          company_id?: string
          created_at?: string | null
          declaration_id?: string
          due_date?: string
          id?: string
          installment_number?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_payment_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_payment_schedules_declaration_id_fkey"
            columns: ["declaration_id"]
            isOneToOne: false
            referencedRelation: "tax_declarations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates_catalog: {
        Row: {
          application_rules: Json | null
          country_code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_threshold: number | null
          min_threshold: number | null
          tax_name: string
          tax_rate: number
          tax_type: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          application_rules?: Json | null
          country_code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_threshold?: number | null
          min_threshold?: number | null
          tax_name: string
          tax_rate: number
          tax_type: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          application_rules?: Json | null
          country_code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_threshold?: number | null
          min_threshold?: number | null
          tax_name?: string
          tax_rate?: number
          tax_type?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_rates_catalog_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
      third_parties: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          client_type: string | null
          code: string
          company_id: string
          country: string | null
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          customer_account_id: string | null
          discount_percent: number | null
          email: string | null
          id: string
          is_active: boolean | null
          legal_name: string | null
          mobile: string | null
          name: string
          payment_terms: number | null
          phone: string | null
          postal_code: string | null
          siret: string | null
          supplier_account_id: string | null
          type: string
          updated_at: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          client_type?: string | null
          code: string
          company_id: string
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          customer_account_id?: string | null
          discount_percent?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          legal_name?: string | null
          mobile?: string | null
          name: string
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          supplier_account_id?: string | null
          type: string
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          client_type?: string | null
          code?: string
          company_id?: string
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          customer_account_id?: string | null
          discount_percent?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          legal_name?: string | null
          mobile?: string | null
          name?: string
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          supplier_account_id?: string | null
          type?: string
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "third_parties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "third_parties_customer_account_id_fkey"
            columns: ["customer_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "third_parties_supplier_account_id_fkey"
            columns: ["supplier_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      third_party_addresses: {
        Row: {
          address_label: string | null
          address_line1: string
          address_line2: string | null
          address_type: string
          city: string
          company_id: string
          country: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          notes: string | null
          postal_code: string
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          address_label?: string | null
          address_line1: string
          address_line2?: string | null
          address_type?: string
          city: string
          company_id: string
          country?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          notes?: string | null
          postal_code: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address_label?: string | null
          address_line1?: string
          address_line2?: string | null
          address_type?: string
          city?: string
          company_id?: string
          country?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          notes?: string | null
          postal_code?: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "third_party_addresses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "third_party_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "third_party_addresses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      third_party_categories: {
        Row: {
          applies_to_customers: boolean | null
          applies_to_suppliers: boolean | null
          code: string
          color: string | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          applies_to_customers?: boolean | null
          applies_to_suppliers?: boolean | null
          code: string
          color?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          applies_to_customers?: boolean | null
          applies_to_suppliers?: boolean | null
          code?: string
          color?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "third_party_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      third_party_documents: {
        Row: {
          company_id: string
          created_at: string | null
          customer_id: string | null
          description: string | null
          document_name: string
          document_type: string
          expiry_date: string | null
          file_path: string | null
          file_size: number | null
          id: string
          is_active: boolean | null
          is_confidential: boolean | null
          mime_type: string | null
          supplier_id: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          document_name: string
          document_type: string
          expiry_date?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          is_confidential?: boolean | null
          mime_type?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          document_name?: string
          document_type?: string
          expiry_date?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          is_confidential?: boolean | null
          mime_type?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "third_party_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "third_party_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "third_party_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      time_tracking: {
        Row: {
          approved_by: string | null
          break_duration_minutes: number | null
          company_id: string
          coordinates: Json | null
          created_at: string | null
          employee_id: string
          end_time: string | null
          entry_type: string | null
          id: string
          is_approved: boolean | null
          location: string | null
          notes: string | null
          start_time: string | null
          total_hours: number | null
          updated_at: string | null
          work_date: string
        }
        Insert: {
          approved_by?: string | null
          break_duration_minutes?: number | null
          company_id: string
          coordinates?: Json | null
          created_at?: string | null
          employee_id: string
          end_time?: string | null
          entry_type?: string | null
          id?: string
          is_approved?: boolean | null
          location?: string | null
          notes?: string | null
          start_time?: string | null
          total_hours?: number | null
          updated_at?: string | null
          work_date: string
        }
        Update: {
          approved_by?: string | null
          break_duration_minutes?: number | null
          company_id?: string
          coordinates?: Json | null
          created_at?: string | null
          employee_id?: string
          end_time?: string | null
          entry_type?: string | null
          id?: string
          is_approved?: boolean | null
          location?: string | null
          notes?: string | null
          start_time?: string | null
          total_hours?: number | null
          updated_at?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string | null
          date: string
          description: string | null
          hourly_rate: number | null
          hours: number
          id: string
          invoice_id: string | null
          is_billable: boolean | null
          project_id: string
          status: string | null
          task_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string | null
          date: string
          description?: string | null
          hourly_rate?: number | null
          hours: number
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          project_id: string
          status?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          hourly_rate?: number | null
          hours?: number
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          project_id?: string
          status?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_balances"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "timesheets_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      timezones_catalog: {
        Row: {
          continent: string | null
          country_codes: string[] | null
          created_at: string | null
          dst_end_rule: string | null
          dst_offset_minutes: number | null
          dst_start_rule: string | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          major_cities: string[] | null
          priority_order: number | null
          timezone_code: string | null
          timezone_display: string
          timezone_name: string
          updated_at: string | null
          utc_offset_minutes: number
        }
        Insert: {
          continent?: string | null
          country_codes?: string[] | null
          created_at?: string | null
          dst_end_rule?: string | null
          dst_offset_minutes?: number | null
          dst_start_rule?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          major_cities?: string[] | null
          priority_order?: number | null
          timezone_code?: string | null
          timezone_display: string
          timezone_name: string
          updated_at?: string | null
          utc_offset_minutes: number
        }
        Update: {
          continent?: string | null
          country_codes?: string[] | null
          created_at?: string | null
          dst_end_rule?: string | null
          dst_offset_minutes?: number | null
          dst_start_rule?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          major_cities?: string[] | null
          priority_order?: number | null
          timezone_code?: string | null
          timezone_display?: string
          timezone_name?: string
          updated_at?: string | null
          utc_offset_minutes?: number
        }
        Relationships: []
      }
      training_enrollments: {
        Row: {
          completion_date: string | null
          employee_id: string
          enrolled_at: string | null
          feedback: string | null
          id: string
          score: number | null
          session_id: string
          status: string | null
        }
        Insert: {
          completion_date?: string | null
          employee_id: string
          enrolled_at?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          session_id: string
          status?: string | null
        }
        Update: {
          completion_date?: string | null
          employee_id?: string
          enrolled_at?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          session_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_records: {
        Row: {
          budget_approved_by: string | null
          business_impact: string | null
          certificate_expiry_date: string | null
          certificate_number: string | null
          certificate_path: string | null
          company_id: string
          competency_improvement: Json | null
          completion_percentage: number | null
          cost: number | null
          created_at: string | null
          currency: string | null
          duration_hours: number | null
          employee_feedback: string | null
          employee_id: string
          employee_rating: number | null
          end_date: string | null
          id: string
          is_mandatory: boolean | null
          manager_feedback: string | null
          max_score: number | null
          next_due_date: string | null
          passed: boolean | null
          renewal_frequency_months: number | null
          renewal_required: boolean | null
          roi_estimated: number | null
          score: number | null
          skills_acquired: string[] | null
          start_date: string
          status: string | null
          trainer_feedback: string | null
          training_category: string | null
          training_provider: string | null
          training_title: string
          training_type: string | null
          updated_at: string | null
        }
        Insert: {
          budget_approved_by?: string | null
          business_impact?: string | null
          certificate_expiry_date?: string | null
          certificate_number?: string | null
          certificate_path?: string | null
          company_id: string
          competency_improvement?: Json | null
          completion_percentage?: number | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          duration_hours?: number | null
          employee_feedback?: string | null
          employee_id: string
          employee_rating?: number | null
          end_date?: string | null
          id?: string
          is_mandatory?: boolean | null
          manager_feedback?: string | null
          max_score?: number | null
          next_due_date?: string | null
          passed?: boolean | null
          renewal_frequency_months?: number | null
          renewal_required?: boolean | null
          roi_estimated?: number | null
          score?: number | null
          skills_acquired?: string[] | null
          start_date: string
          status?: string | null
          trainer_feedback?: string | null
          training_category?: string | null
          training_provider?: string | null
          training_title: string
          training_type?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_approved_by?: string | null
          business_impact?: string | null
          certificate_expiry_date?: string | null
          certificate_number?: string | null
          certificate_path?: string | null
          company_id?: string
          competency_improvement?: Json | null
          completion_percentage?: number | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          duration_hours?: number | null
          employee_feedback?: string | null
          employee_id?: string
          employee_rating?: number | null
          end_date?: string | null
          id?: string
          is_mandatory?: boolean | null
          manager_feedback?: string | null
          max_score?: number | null
          next_due_date?: string | null
          passed?: boolean | null
          renewal_frequency_months?: number | null
          renewal_required?: boolean | null
          roi_estimated?: number | null
          score?: number | null
          skills_acquired?: string[] | null
          start_date?: string
          status?: string | null
          trainer_feedback?: string | null
          training_category?: string | null
          training_provider?: string | null
          training_title?: string
          training_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_records_budget_approved_by_fkey"
            columns: ["budget_approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          location: string | null
          max_participants: number | null
          notes: string | null
          start_date: string
          status: string | null
          trainer_email: string | null
          trainer_name: string | null
          training_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          max_participants?: number | null
          notes?: string | null
          start_date: string
          status?: string | null
          trainer_email?: string | null
          trainer_name?: string | null
          training_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          max_participants?: number | null
          notes?: string | null
          start_date?: string
          status?: string | null
          trainer_email?: string | null
          trainer_name?: string | null
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          category: string | null
          company_id: string
          cost: number | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string
          is_active: boolean | null
          name: string
          provider: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          provider?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          provider?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_engagement_tracking: {
        Row: {
          clicked_upgrade_at: string | null
          clicked_upgrade_cta: boolean | null
          converted_at: string | null
          converted_plan_id: string | null
          converted_to_paid: boolean | null
          created_at: string | null
          id: string
          notified_at_1_day: string | null
          notified_at_15_days: string | null
          notified_at_3_days: string | null
          notified_at_7_days: string | null
          notified_at_expiration: string | null
          subscription_id: string
          updated_at: string | null
          user_id: string
          viewed_pricing_at: string | null
          viewed_pricing_page: boolean | null
        }
        Insert: {
          clicked_upgrade_at?: string | null
          clicked_upgrade_cta?: boolean | null
          converted_at?: string | null
          converted_plan_id?: string | null
          converted_to_paid?: boolean | null
          created_at?: string | null
          id?: string
          notified_at_1_day?: string | null
          notified_at_15_days?: string | null
          notified_at_3_days?: string | null
          notified_at_7_days?: string | null
          notified_at_expiration?: string | null
          subscription_id: string
          updated_at?: string | null
          user_id: string
          viewed_pricing_at?: string | null
          viewed_pricing_page?: boolean | null
        }
        Update: {
          clicked_upgrade_at?: string | null
          clicked_upgrade_cta?: boolean | null
          converted_at?: string | null
          converted_plan_id?: string | null
          converted_to_paid?: boolean | null
          created_at?: string | null
          id?: string
          notified_at_1_day?: string | null
          notified_at_15_days?: string | null
          notified_at_3_days?: string | null
          notified_at_7_days?: string | null
          notified_at_expiration?: string | null
          subscription_id?: string
          updated_at?: string | null
          user_id?: string
          viewed_pricing_at?: string | null
          viewed_pricing_page?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_engagement_tracking_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "active_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_engagement_tracking_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          created_at: string | null
          current_usage: number | null
          feature_name: string
          id: string
          last_reset_at: string | null
          limit_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_usage?: number | null
          feature_name: string
          id?: string
          last_reset_at?: string | null
          limit_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_usage?: number | null
          feature_name?: string
          id?: string
          last_reset_at?: string | null
          limit_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          action: string
          company_id: string
          details: Json | null
          id: string
          ip_address: unknown
          performed_at: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          company_id: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          performed_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          performed_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action: string
          activity_type: string
          company_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          risk_score: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          activity_type: string
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          risk_score?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          activity_type?: string
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          risk_score?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_companies: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          is_default: boolean | null
          last_activity: string | null
          permissions: Json | null
          role: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          last_activity?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          last_activity?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_deletion_requests: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          companies_to_transfer: Json | null
          created_at: string | null
          export_download_url: string | null
          export_generated_at: string | null
          export_requested: boolean | null
          id: string
          processed_at: string | null
          reason: string | null
          requested_at: string | null
          scheduled_deletion_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          companies_to_transfer?: Json | null
          created_at?: string | null
          export_download_url?: string | null
          export_generated_at?: string | null
          export_requested?: boolean | null
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string | null
          scheduled_deletion_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          companies_to_transfer?: Json | null
          created_at?: string | null
          export_download_url?: string | null
          export_generated_at?: string | null
          export_requested?: boolean | null
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string | null
          scheduled_deletion_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string | null
          email_invoices: boolean | null
          email_marketing: boolean | null
          email_new_transactions: boolean | null
          email_payments: boolean | null
          email_reminders: boolean | null
          email_system_updates: boolean | null
          email_weekly_reports: boolean | null
          id: string
          notification_frequency: string | null
          push_alerts: boolean | null
          push_new_transactions: boolean | null
          push_reminders: boolean | null
          push_system_updates: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_invoices?: boolean | null
          email_marketing?: boolean | null
          email_new_transactions?: boolean | null
          email_payments?: boolean | null
          email_reminders?: boolean | null
          email_system_updates?: boolean | null
          email_weekly_reports?: boolean | null
          id?: string
          notification_frequency?: string | null
          push_alerts?: boolean | null
          push_new_transactions?: boolean | null
          push_reminders?: boolean | null
          push_system_updates?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_invoices?: boolean | null
          email_marketing?: boolean | null
          email_new_transactions?: boolean | null
          email_payments?: boolean | null
          email_reminders?: boolean | null
          email_system_updates?: boolean | null
          email_weekly_reports?: boolean | null
          id?: string
          notification_frequency?: string | null
          push_alerts?: boolean | null
          push_new_transactions?: boolean | null
          push_reminders?: boolean | null
          push_system_updates?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          company_id: string
          conditions: Json | null
          created_at: string | null
          description: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          ip_restrictions: unknown[] | null
          is_active: boolean | null
          last_used_at: string | null
          permissions: Json
          resource_scopes: string[] | null
          role: string
          time_restrictions: Json | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          company_id: string
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          ip_restrictions?: unknown[] | null
          is_active?: boolean | null
          last_used_at?: string | null
          permissions?: Json
          resource_scopes?: string[] | null
          role: string
          time_restrictions?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          company_id?: string
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          ip_restrictions?: unknown[] | null
          is_active?: boolean | null
          last_used_at?: string | null
          permissions?: Json
          resource_scopes?: string[] | null
          role?: string
          time_restrictions?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          auto_backup: boolean | null
          auto_save: boolean | null
          compact_view: boolean | null
          company_id: string | null
          created_at: string | null
          currency: string | null
          date_format: string | null
          default_payment_terms: number | null
          email_notifications: boolean | null
          fiscal_year_start: string | null
          id: string
          language: string | null
          notification_frequency: string | null
          number_format: string | null
          push_notifications: boolean | null
          show_tooltips: boolean | null
          sms_notifications: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_backup?: boolean | null
          auto_save?: boolean | null
          compact_view?: boolean | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          default_payment_terms?: number | null
          email_notifications?: boolean | null
          fiscal_year_start?: string | null
          id?: string
          language?: string | null
          notification_frequency?: string | null
          number_format?: string | null
          push_notifications?: boolean | null
          show_tooltips?: boolean | null
          sms_notifications?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_backup?: boolean | null
          auto_save?: boolean | null
          compact_view?: boolean | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          default_payment_terms?: number | null
          email_notifications?: boolean | null
          fiscal_year_start?: string | null
          id?: string
          language?: string | null
          notification_frequency?: string | null
          number_format?: string | null
          push_notifications?: boolean | null
          show_tooltips?: boolean | null
          sms_notifications?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          email: string
          employment_type: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          job_title: string | null
          language: string | null
          language_preference: string | null
          last_login_at: string | null
          last_name: string | null
          linkedin: string | null
          manager_id: string | null
          metadata: Json | null
          phone: string | null
          profile_completion_percentage: number | null
          theme_preference: string | null
          timezone: string | null
          twitter: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email: string
          employment_type?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          language?: string | null
          language_preference?: string | null
          last_login_at?: string | null
          last_name?: string | null
          linkedin?: string | null
          manager_id?: string | null
          metadata?: Json | null
          phone?: string | null
          profile_completion_percentage?: number | null
          theme_preference?: string | null
          timezone?: string | null
          twitter?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string
          employment_type?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          language?: string | null
          language_preference?: string | null
          last_login_at?: string | null
          last_name?: string | null
          linkedin?: string | null
          manager_id?: string | null
          metadata?: Json | null
          phone?: string | null
          profile_completion_percentage?: number | null
          theme_preference?: string | null
          timezone?: string | null
          twitter?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          device_type: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity: string | null
          location: Json | null
          logout_reason: string | null
          session_token: string
          started_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          location?: Json | null
          logout_reason?: string | null
          session_token: string
          started_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          location?: Json | null
          logout_reason?: string | null
          session_token?: string
          started_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          code: string
          company_id: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          postal_code: string | null
          updated_at: string | null
          warehouse_type: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          code: string
          company_id: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          postal_code?: string | null
          updated_at?: string | null
          warehouse_type?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          code?: string
          company_id?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          postal_code?: string | null
          updated_at?: string | null
          warehouse_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempt_number: number
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          payload: Json
          request_body: Json | null
          request_headers: Json | null
          request_url: string
          response_body: string | null
          response_headers: Json | null
          response_status_code: number | null
          status: string
          webhook_id: string
        }
        Insert: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          payload: Json
          request_body?: Json | null
          request_headers?: Json | null
          request_url: string
          response_body?: string | null
          response_headers?: Json | null
          response_status_code?: number | null
          status: string
          webhook_id: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          request_body?: Json | null
          request_headers?: Json | null
          request_url?: string
          response_body?: string | null
          response_headers?: Json | null
          response_status_code?: number | null
          status?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_settings: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          events: string[]
          failure_count: number | null
          headers: Json | null
          id: string
          is_active: boolean | null
          last_triggered: string | null
          name: string
          retry_config: Json | null
          secret_token: string | null
          ssl_verification: boolean | null
          success_count: number | null
          updated_at: string | null
          webhook_url: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          events?: string[]
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          name: string
          retry_config?: Json | null
          secret_token?: string | null
          ssl_verification?: boolean | null
          success_count?: number | null
          updated_at?: string | null
          webhook_url: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          events?: string[]
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          name?: string
          retry_config?: Json | null
          secret_token?: string | null
          ssl_verification?: boolean | null
          success_count?: number | null
          updated_at?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          custom_headers: Json | null
          description: string | null
          events: string[]
          failure_count: number
          filters: Json | null
          id: string
          is_active: boolean
          last_failure_at: string | null
          last_success_at: string | null
          last_triggered_at: string | null
          max_retries: number
          name: string
          retry_delay_seconds: number
          secret_key: string
          timeout_seconds: number
          updated_at: string
          url: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          custom_headers?: Json | null
          description?: string | null
          events: string[]
          failure_count?: number
          filters?: Json | null
          id?: string
          is_active?: boolean
          last_failure_at?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          max_retries?: number
          name: string
          retry_delay_seconds?: number
          secret_key: string
          timeout_seconds?: number
          updated_at?: string
          url: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          custom_headers?: Json | null
          description?: string | null
          events?: string[]
          failure_count?: number
          filters?: Json | null
          id?: string
          is_active?: boolean
          last_failure_at?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          max_retries?: number
          name?: string
          retry_delay_seconds?: number
          secret_key?: string
          timeout_seconds?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          company_id: string
          completed_at: string | null
          error_message: string | null
          execution_log: Json | null
          id: string
          started_at: string | null
          status: string
          template_id: string | null
          trigger_data: Json | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          error_message?: string | null
          execution_log?: Json | null
          id?: string
          started_at?: string | null
          status?: string
          template_id?: string | null
          trigger_data?: Json | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          error_message?: string | null
          execution_log?: Json | null
          id?: string
          started_at?: string | null
          status?: string
          template_id?: string | null
          trigger_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          category: string
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          input_schema: Json | null
          is_active: boolean | null
          is_system: boolean | null
          output_schema: Json | null
          template_name: string
          updated_at: string | null
          usage_count: number | null
          workflow_definition: Json
        }
        Insert: {
          category: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          input_schema?: Json | null
          is_active?: boolean | null
          is_system?: boolean | null
          output_schema?: Json | null
          template_name: string
          updated_at?: string | null
          usage_count?: number | null
          workflow_definition?: Json
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          input_schema?: Json | null
          is_active?: boolean | null
          is_system?: boolean | null
          output_schema?: Json | null
          template_name?: string
          updated_at?: string | null
          usage_count?: number | null
          workflow_definition?: Json
        }
        Relationships: [
          {
            foreignKeyName: "workflow_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          actions: Json
          category: string
          color: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          category: string
          color?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          category?: string
          color?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string | null
          plan_billing_period: string | null
          plan_currency: string | null
          plan_description: string | null
          plan_features: Json | null
          plan_id: string | null
          plan_is_trial: boolean | null
          plan_name: string | null
          plan_price: number | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          company_id: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          health_score: number | null
          id: string | null
          industry: string | null
          name: string | null
          phone: string | null
          status: string | null
          tier: string | null
          total_value: number | null
          type: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          company_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          health_score?: number | null
          id?: string | null
          industry?: string | null
          name?: string | null
          phone?: string | null
          status?: string | null
          tier?: string | null
          total_value?: number | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          company_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          health_score?: number | null
          id?: string | null
          industry?: string | null
          name?: string | null
          phone?: string | null
          status?: string | null
          tier?: string | null
          total_value?: number | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      forecasts_summary: {
        Row: {
          company_id: string | null
          created_at: string | null
          gross_margin: number | null
          id: string | null
          name: string | null
          net_cash_flow: number | null
          net_margin: number | null
          period_end: string | null
          period_name: string | null
          period_start: string | null
          scenario_name: string | null
          scenario_type: string | null
          status: string | null
          total_expenses: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forecasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_balances: {
        Row: {
          balance_due: number | null
          company_id: string | null
          invoice_id: string | null
          invoice_number: string | null
          paid_amount: number | null
          payment_status: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          close_date: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          pipeline_id: string | null
          probability: number | null
          source: string | null
          stage_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          close_date?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          pipeline_id?: string | null
          probability?: number | null
          source?: string | null
          stage_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          close_date?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          pipeline_id?: string | null
          probability?: number | null
          source?: string | null
          stage_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_owner_id_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      report_statistics: {
        Row: {
          avg_size_bytes: number | null
          company_id: string | null
          company_name: string | null
          first_report_date: string | null
          latest_report_date: string | null
          report_type: string | null
          total_downloads: number | null
          total_reports: number | null
          total_size_bytes: number | null
          uploaded_reports: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rgpd_audit_summary: {
        Row: {
          failed_ops: number | null
          last_operation_at: string | null
          successful_ops: number | null
          total_deletions: number | null
          total_exports: number | null
          total_operations: number | null
          user_id: string | null
        }
        Relationships: []
      }
      trial_conversion_analytics: {
        Row: {
          avg_days_to_conversion: number | null
          clicked_upgrade_count: number | null
          conversion_rate_percent: number | null
          converted_count: number | null
          total_trials_started: number | null
          trial_start_date: string | null
          viewed_pricing_count: number | null
        }
        Relationships: []
      }
      unified_third_parties_view: {
        Row: {
          balance: number | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          currency: string | null
          discount_rate: number | null
          email: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          notes: string | null
          party_number: string | null
          type: string | null
          payment_terms: number | null
          phone: string | null
          primary_address_line1: string | null
          city: string | null
          country: string | null
          postal_code: string | null
          tax_number: string | null
          total_amount: number | null
          transaction_count: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_actuals_by_category: {
        Row: {
          amount_actual: number | null
          category_id: string | null
          company_id: string | null
          month: number | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "category_account_map_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_account_map_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_by_category_monthly"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_actuals_monthly: {
        Row: {
          account_number: string | null
          amount_base: number | null
          company_id: string | null
          month: number | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_archive_stats: {
        Row: {
          can_be_destroyed: number | null
          company_id: string | null
          expiring_soon: number | null
          fiscaux: number | null
          newest_archive: string | null
          obligatoires: number | null
          oldest_archive: string | null
          total_archives: number | null
          total_size_bytes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_archive_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_budget_by_category_monthly: {
        Row: {
          amount_budget: number | null
          budget_id: string | null
          category_code: string | null
          category_id: string | null
          category_name: string | null
          category_type: string | null
          company_id: string | null
          month: number | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_recent_reports: {
        Row: {
          access_level: string | null
          approved_at: string | null
          approved_by: string | null
          approved_by_email: string | null
          archive_reference: string | null
          archived_at: string | null
          can_be_destroyed: boolean | null
          company_id: string | null
          created_at: string | null
          file_format: string | null
          file_path: string | null
          file_size_bytes: number | null
          file_url: string | null
          fiscal_year: number | null
          generated_at: string | null
          generated_by: string | null
          generated_by_email: string | null
          generation_config: Json | null
          id: string | null
          is_archived: boolean | null
          notes: string | null
          period_end: string | null
          period_start: string | null
          report_data: Json | null
          report_format: string | null
          report_name: string | null
          report_type: string | null
          retention_until: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_by_email: string | null
          shared_with: string[] | null
          status: string | null
          storage_bucket: string | null
          tags: string[] | null
          template_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      v_tax_archive_stats: {
        Row: {
          can_be_destroyed: number | null
          company_id: string | null
          expiring_soon: number | null
          newest_archive: string | null
          oldest_archive: string | null
          total_archives: number | null
          total_size_bytes: number | null
          total_tax_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_declarations_archive_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      analyze_budget_variances: {
        Args: { p_budget_id: string; p_company_id: string }
        Returns: Json
      }
      analyze_data_quality: {
        Args: never
        Returns: {
          details: Json
          metric_name: string
          metric_value: number
          percentage: number
        }[]
      }
      analyze_training_trends: {
        Args: { p_company_id: string; p_months_back?: number }
        Returns: {
          avg_completion_rate: number
          avg_score: number
          roi_estimate: number
          total_cost: number
          total_trainings: number
          training_category: string
          trend_direction: string
        }[]
      }
      auto_archive_document: {
        Args: { archived_by_user: string; doc_id: string }
        Returns: string
      }
      calculate_automatic_rfa: {
        Args: {
          p_contract_id: string
          p_period_end: string
          p_period_start: string
          p_turnover_amount: number
        }
        Returns: {
          calculation_details: Json
          rfa_amount: number
          rfa_percentage: number
        }[]
      }
      calculate_contract_rfa: {
        Args: {
          p_contract_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: {
          discount_amount: number
          discount_rate: number
          turnover: number
        }[]
      }
      calculate_declining_balance_depreciation: {
        Args: {
          p_depreciation_rate: number
          p_net_book_value: number
          p_period_months?: number
        }
        Returns: number
      }
      calculate_employee_engagement_score: {
        Args: { p_company_id: string }
        Returns: {
          employee_id: string
          engagement_score: number
          factors: Json
        }[]
      }
      calculate_financial_health_score: {
        Args: { p_company_id: string }
        Returns: Json
      }
      calculate_linear_depreciation: {
        Args: {
          p_acquisition_cost: number
          p_period_months?: number
          p_salvage_value: number
          p_useful_life_years: number
        }
        Returns: number
      }
      calculate_purchase_totals: {
        Args: { p_purchase_id: string }
        Returns: Json
      }
      calculate_quote_totals: { Args: { p_quote_id: string }; Returns: Json }
      calculate_retention_date: {
        Args: { p_archived_at: string; p_retention_years: number }
        Returns: string
      }
      can_access_feature: {
        Args: { p_feature_name: string; p_user_id: string }
        Returns: boolean
      }
      can_create_trial: { Args: { p_user_id: string }; Returns: boolean }
      can_user_delete_account: { Args: { p_user_id: string }; Returns: Json }
      cancel_subscription: {
        Args: { p_subscription_id: string; p_user_id: string }
        Returns: boolean
      }
      cancel_trial: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: string
      }
      check_index_usage: {
        Args: never
        Returns: {
          efficiency: string
          index_name: string
          index_size: string
          scans: number
          table_name: string
          tuples_fetched: number
          tuples_read: number
        }[]
      }
      check_rls_health: {
        Args: never
        Returns: {
          policy_count: number
          rls_enabled: boolean
          status: string
          table_name: string
        }[]
      }
      check_user_permission: {
        Args: {
          p_action: string
          p_company_id: string
          p_resource: string
          p_user_id: string
        }
        Returns: boolean
      }
      clean_expired_report_cache: { Args: never; Returns: undefined }
      cleanup_old_reports: {
        Args: { days_to_keep?: number }
        Returns: {
          deleted_count: number
          freed_bytes: number
        }[]
      }
      cleanup_old_rgpd_logs: { Args: never; Returns: number }
      convert_trial_to_paid: {
        Args: {
          p_new_plan_id: string
          p_stripe_customer_id?: string
          p_stripe_subscription_id?: string
          p_user_id: string
        }
        Returns: string
      }
      create_audit_trail: {
        Args: {
          p_action: string
          p_company_id?: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: string
      }
      create_basic_accounts: { Args: { p_company_id: string }; Returns: number }
      create_budget_version: {
        Args: { p_budget_id: string; p_comment?: string }
        Returns: string
      }
      create_budget_with_standard_categories: {
        Args: {
          p_budget_name: string
          p_budget_year: number
          p_company_id: string
          p_country_code?: string
        }
        Returns: string
      }
      create_company_with_defaults: { Args: { p_payload: Json }; Returns: Json }
      create_company_with_user: {
        Args: { p_company_data: Json; p_company_id: string; p_user_id: string }
        Returns: Json
      }
      create_default_entry_templates: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      create_default_forecast_scenarios: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      create_default_journals: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      create_notification:
        | {
            Args: {
              p_category?: string
              p_expires_in_days?: number
              p_link?: string
              p_message: string
              p_metadata?: Json
              p_title: string
              p_type?: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_action_url?: string
              p_category?: string
              p_company_id: string
              p_message: string
              p_metadata?: Json
              p_priority?: string
              p_title: string
              p_type: string
              p_user_id: string
            }
            Returns: string
          }
      create_onboarding_session: {
        Args: { p_company_id: string; p_initial_data?: Json; p_user_id: string }
        Returns: string
      }
      create_trial_subscription: {
        Args: { p_company_id?: string; p_user_id: string }
        Returns: string
      }
      daily_security_report: {
        Args: never
        Returns: {
          report_line: string
        }[]
      }
      detect_suspicious_access: {
        Args: never
        Returns: {
          event_time: string
          operation: string
          risk_level: string
          row_count: number
          table_accessed: string
          user_id: string
        }[]
      }
      detect_suspicious_activity: {
        Args: never
        Returns: {
          risk_score: number
          suspicious_events: number
          user_id: string
        }[]
      }
      enable_company_feature: {
        Args: {
          p_company_id: string
          p_configuration?: Json
          p_feature_name: string
        }
        Returns: {
          feature_id: string
          message: string
          success: boolean
        }[]
      }
      enable_company_module_advanced: {
        Args: {
          p_access_level?: string
          p_company_id: string
          p_custom_settings?: Json
          p_module_key: string
          p_storage_quota_gb?: number
          p_user_limit?: number
        }
        Returns: {
          message: string
          module_id: string
          success: boolean
        }[]
      }
      encrypt_sensitive_data: {
        Args: { p_data: string; p_key_name?: string }
        Returns: string
      }
      expire_old_invitations: { Args: never; Returns: undefined }
      expire_trials: { Args: never; Returns: number }
      export_fec_to_csv: {
        Args: { p_company_id: string; p_end_date: string; p_start_date: string }
        Returns: string
      }
      fix_all_search_paths: {
        Args: never
        Returns: {
          function_name: string
          status: string
        }[]
      }
      generate_archive_reference: {
        Args: { p_company_id: string }
        Returns: string
      }
      generate_balance_sheet: {
        Args: { p_company_id: string; p_end_date: string }
        Returns: Json
      }
      generate_cash_flow_forecast: {
        Args: { p_company_id: string; p_months_ahead?: number }
        Returns: Json
      }
      generate_cash_flow_statement: {
        Args: { p_company_id: string; p_end_date: string; p_start_date: string }
        Returns: Json
      }
      generate_compliance_report: {
        Args: {
          p_company_id: string
          p_period_end: string
          p_period_start: string
          p_report_type: string
        }
        Returns: string
      }
      generate_contract_archive_reference: {
        Args: { p_company_id: string }
        Returns: string
      }
      generate_depreciation_entries: {
        Args: {
          p_auto_post?: boolean
          p_company_id: string
          p_period_date: string
        }
        Returns: Json
      }
      generate_fec_export: {
        Args: { p_company_id: string; p_end_date: string; p_start_date: string }
        Returns: {
          compauxlib: string
          compauxnum: string
          comptelib: string
          comptenum: string
          credit: string
          datelet: string
          debit: string
          ecrituredate: string
          ecriturelet: string
          ecriturelib: string
          ecriturenum: string
          idevise: string
          journalcode: string
          journallib: string
          montantdevise: string
          piecedate: string
          pieceref: string
          validdate: string
        }[]
      }
      generate_form_2050_actif: {
        Args: { p_company_id: string; p_fiscal_year_end: string }
        Returns: Json
      }
      generate_form_2051_passif: {
        Args: { p_company_id: string; p_fiscal_year_end: string }
        Returns: Json
      }
      generate_form_2052_charges: {
        Args: {
          p_company_id: string
          p_fiscal_year_end: string
          p_fiscal_year_start: string
        }
        Returns: Json
      }
      generate_form_2053_produits: {
        Args: {
          p_company_id: string
          p_fiscal_year_end: string
          p_fiscal_year_start: string
        }
        Returns: Json
      }
      generate_general_ledger: {
        Args: {
          p_account_number?: string
          p_company_id: string
          p_end_date: string
          p_start_date: string
        }
        Returns: Json
      }
      generate_income_statement: {
        Args: { p_company_id: string; p_end_date: string; p_start_date: string }
        Returns: Json
      }
      generate_invoice_number_custom: {
        Args: { p_company_id: string }
        Returns: string
      }
      generate_monthly_payroll_entries: {
        Args: { p_company_id: string; p_month: number; p_year: number }
        Returns: Json
      }
      generate_payroll_journal_entry: {
        Args: { p_payroll_slip_id: string }
        Returns: Json
      }
      generate_purchase_archive_reference: {
        Args: { p_company_id: string }
        Returns: string
      }
      generate_purchase_number: {
        Args: { p_company_id: string }
        Returns: string
      }
      generate_quote_number: { Args: { p_company_id: string }; Returns: string }
      generate_sales_report: {
        Args: { p_company_id: string; p_end_date: string; p_start_date: string }
        Returns: Json
      }
      generate_tax_archive_reference: {
        Args: { p_company_id: string }
        Returns: string
      }
      generate_ticket_number: { Args: never; Returns: string }
      generate_trial_balance: {
        Args: { p_company_id: string; p_end_date: string }
        Returns: Json
      }
      generate_vat_declaration: {
        Args: {
          p_company_id: string
          p_declaration_type?: string
          p_end_date: string
          p_start_date: string
        }
        Returns: Json
      }
      get_account_balance_simple: {
        Args: { p_account_id: string; p_date?: string }
        Returns: number
      }
      get_active_stock_alerts: {
        Args: {
          p_company_id: string
          p_limit?: number
          p_warehouse_id?: string
        }
        Returns: {
          alert_id: string
          alert_type: string
          current_stock: number
          product_name: string
          severity: string
          threshold_stock: number
          triggered_at: string
          warehouse_name: string
        }[]
      }
      get_allowed_modules_for_plan: {
        Args: { p_plan_id: string }
        Returns: string[]
      }
      get_balance_sheet_data: {
        Args: { p_company_id: string; p_date_from: string; p_date_to: string }
        Returns: Json
      }
      get_budget_forecast: {
        Args: {
          p_as_of_date: string
          p_budget_id: string
          p_company_id: string
          p_mode?: string
        }
        Returns: {
          amount_actual: number
          amount_budget: number
          amount_forecast: number
          category_code: string
          category_id: string
          category_name: string
          category_type: string
          month: number
          variance_amount: number
          variance_percentage: number
          year: number
        }[]
      }
      get_budget_forecast_kpi: {
        Args: {
          p_as_of_date: string
          p_budget_id: string
          p_company_id: string
        }
        Returns: {
          absorption_rate: number
          total_actual_ytd: number
          total_budget_annual: number
          total_forecast_eoy: number
          variance_percentage: number
          variance_vs_budget: number
        }[]
      }
      get_budget_totals: {
        Args: { p_budget_id: string }
        Returns: {
          margin_percent: number
          net_result: number
          total_expenses: number
          total_revenue: number
        }[]
      }
      get_cash_flow_data: {
        Args: { p_company_id: string; p_date_from: string; p_date_to: string }
        Returns: Json
      }
      get_company_ai_summary: { Args: { p_company_id: string }; Returns: Json }
      get_company_features_detailed: {
        Args: { p_company_id: string }
        Returns: {
          category: string
          configuration: Json
          current_usage: number
          display_name_fr: string
          expires_at: string
          feature_name: string
          is_enabled: boolean
          is_expired: boolean
          usage_limit: number
        }[]
      }
      get_company_modules_config: {
        Args: { p_company_id: string }
        Returns: {
          access_level: string
          configuration: Json
          display_name: string
          is_enabled: boolean
          module_key: string
          usage_stats: Json
        }[]
      }
      get_complete_company_profile: {
        Args: { p_company_id: string }
        Returns: {
          ceo_name: string
          ceo_title: string
          company_size: string
          data_quality_score: number
          id: string
          industry_type: string
          legal_name: string
          name: string
          registration_date: string
          sector: string
          share_capital: number
          siret: string
          status: string
          timezone: string
        }[]
      }
      get_country_config: {
        Args: { country_code_param: string }
        Returns: Json
      }
      get_crm_stats_real: { Args: { company_uuid: string }; Returns: Json }
      get_enterprise_dashboard_data: {
        Args: {
          p_company_id: string
          p_comparison_period?: string
          p_currency?: string
          p_end_date?: string
          p_include_benchmarks?: boolean
          p_include_forecasts?: boolean
          p_period?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_financial_ratios: {
        Args: { p_company_id: string; p_date_from: string; p_date_to: string }
        Returns: Json
      }
      get_fiscal_template_by_country: {
        Args: { p_country_code: string }
        Returns: {
          accounting_standard: string
          compliance: Json
          country_name: string
          default_currency: string
          depreciation: Json
          fiscal_year_end: string
          payroll_taxes: Json
          tax_accounts: Json
          vat_config: Json
        }[]
      }
      get_income_statement_data: {
        Args: { p_company_id: string; p_date_from: string; p_date_to: string }
        Returns: Json
      }
      get_next_archive_reference: { Args: { comp_id: string }; Returns: string }
      get_next_journal_entry_number: {
        Args: { p_company_id: string; p_journal_id?: string }
        Returns: string
      }
      get_onboarding_stats: {
        Args: { p_company_id?: string; p_days_back?: number }
        Returns: {
          abandoned_sessions: number
          avg_completion_time_minutes: number
          completed_sessions: number
          completion_rate_pct: number
          most_problematic_step: string
          total_sessions: number
        }[]
      }
      get_or_create_user_profile: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          email: string
          employment_type: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          job_title: string | null
          language: string | null
          language_preference: string | null
          last_login_at: string | null
          last_name: string | null
          linkedin: string | null
          manager_id: string | null
          metadata: Json | null
          phone: string | null
          profile_completion_percentage: number | null
          theme_preference: string | null
          timezone: string | null
          twitter: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        SetofOptions: {
          from: "*"
          to: "user_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_performance_comparison: {
        Args: { p_company_id: string; p_period?: string }
        Returns: Json
      }
      get_product_stock_summary: {
        Args: { p_product_id: string; p_warehouse_id?: string }
        Returns: Json
      }
      get_purchase_analytics_simple: {
        Args: {
          p_company_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_realtime_metrics: { Args: { p_company_id: string }; Returns: Json }
      get_recommended_company_sizes: {
        Args: { sector_code_param: string }
        Returns: {
          category: string
          description: string
          recommended_plan: string
          size_code: string
          size_name: string
        }[]
      }
      get_report_signed_url: {
        Args: { p_expires_in?: number; p_file_path: string }
        Returns: string
      }
      get_report_storage_path: {
        Args: {
          p_company_id: string
          p_file_format: string
          p_is_archived?: boolean
          p_report_name: string
          p_report_type: string
        }
        Returns: string
      }
      get_supplier_balance_simple: {
        Args: { p_supplier_id: string }
        Returns: number
      }
      get_third_parties_stats: { Args: { p_company_id: string }; Returns: Json }
      get_third_party_details: {
        Args: { p_party_id: string; p_type: string }
        Returns: Json
      }
      get_trial_statistics: {
        Args: never
        Returns: {
          metric: string
          value: number
        }[]
      }
      get_unmapped_journal_entries: {
        Args: { p_company_id: string; p_year: number }
        Returns: {
          account_code: string
          entry_count: number
          total_amount: number
        }[]
      }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_consents: {
        Args: { p_user_id: string }
        Returns: {
          consent_given: boolean
          consent_type: string
          consent_version: string
          updated_at: string
        }[]
      }
      get_user_notifications: {
        Args: { user_uuid?: string }
        Returns: {
          email_invoices: boolean
          email_marketing: boolean
          email_new_transactions: boolean
          email_payments: boolean
          email_reminders: boolean
          email_system_updates: boolean
          email_weekly_reports: boolean
          notification_frequency: string
          push_alerts: boolean
          push_new_transactions: boolean
          push_reminders: boolean
          push_system_updates: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string
          quiet_hours_start: string
        }[]
      }
      get_user_preferences_with_fallback: {
        Args: { p_company_id?: string; p_user_id: string }
        Returns: {
          currency: string
          date_format: string
          email_notifications: boolean
          language: string
          push_notifications: boolean
          theme: string
          timezone: string
        }[]
      }
      get_user_subscription_status: {
        Args: { p_user_id: string }
        Returns: {
          current_period_end: string
          current_period_start: string
          days_remaining: number
          is_trial: boolean
          plan_currency: string
          plan_id: string
          plan_name: string
          plan_price: number
          status: string
          subscription_id: string
          trial_end: string
          trial_start: string
        }[]
      }
      get_user_trial_engagement: {
        Args: { p_user_id: string }
        Returns: {
          cta_message: string
          days_remaining: number
          has_clicked_upgrade: boolean
          has_viewed_pricing: boolean
          notification_urgency: string
          should_show_notification: boolean
          trial_phase: string
        }[]
      }
      get_user_trial_info: {
        Args: { p_user_id: string }
        Returns: {
          days_remaining: number
          is_expired: boolean
          plan_id: string
          status: string
          subscription_id: string
          trial_end: string
          trial_start: string
        }[]
      }
      get_user_usage_limits: {
        Args: { p_user_id: string }
        Returns: {
          current_usage: number
          feature_name: string
          limit_value: number
          percentage_used: number
        }[]
      }
      identify_potential_duplicates: {
        Args: never
        Returns: {
          company_count: number
          company_ids: string[]
          company_names: string[]
          normalized_name: string
        }[]
      }
      increment_feature_usage: {
        Args: {
          p_feature_name: string
          p_increment?: number
          p_user_id: string
        }
        Returns: boolean
      }
      increment_report_download_count: {
        Args: { report_id: string }
        Returns: undefined
      }
      increment_session_count: {
        Args: { count_field: string; session_id: string }
        Returns: undefined
      }
      init_default_user_preferences: {
        Args: { p_company_id?: string; p_user_id: string }
        Returns: string
      }
      initialize_budget_category_mappings: {
        Args: {
          p_budget_id: string
          p_company_id: string
          p_country_code?: string
        }
        Returns: number
      }
      initialize_chart_of_accounts: {
        Args: { p_company_id: string; p_country?: string }
        Returns: Json
      }
      initialize_company_chart_of_accounts: {
        Args: { p_company_id: string; p_country_code?: string }
        Returns: number
      }
      is_employee_manager: { Args: { emp_id: string }; Returns: boolean }
      is_hr_manager: { Args: never; Returns: boolean }
      is_module_allowed_for_plan: {
        Args: { p_module_name: string; p_plan_id: string }
        Returns: boolean
      }
      log_audit_event:
        | {
            Args: {
              p_action: string
              p_company_id: string
              p_entity_id?: string
              p_entity_type: string
              p_ip_address?: unknown
              p_metadata?: Json
              p_new_values?: Json
              p_old_values?: Json
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_company_id?: string
              p_event_type: string
              p_new_values?: Json
              p_old_values?: Json
              p_record_id?: string
              p_security_level?: string
              p_table_name?: string
              p_user_id?: string
            }
            Returns: string
          }
      log_onboarding_step: {
        Args: {
          p_company_id: string
          p_completion_status?: string
          p_session_id?: string
          p_step_data?: Json
          p_step_name: string
          p_step_order: number
          p_time_spent_seconds?: number
          p_user_id: string
          p_validation_errors?: Json
        }
        Returns: string
      }
      log_rgpd_operation: {
        Args: {
          p_action: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_status?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_company_id?: string
          p_description: string
          p_event_type: string
        }
        Returns: string
      }
      mark_all_notifications_as_read: {
        Args: { p_user_id: string }
        Returns: number
      }
      mark_notification_as_read: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: boolean
      }
      migrate_budget_category_to_account: {
        Args: {
          p_category_text: string
          p_company_id: string
          p_subcategory_text: string
        }
        Returns: string
      }
      normalize_company_name_safe: {
        Args: { company_name: string }
        Returns: string
      }
      reactivate_subscription: {
        Args: { p_subscription_id: string; p_user_id: string }
        Returns: boolean
      }
      record_stock_movement_complete: {
        Args: {
          p_movement_type: string
          p_notes?: string
          p_product_id: string
          p_quantity: number
          p_reference_id?: string
          p_reference_type?: string
          p_unit_cost?: number
          p_warehouse_id: string
        }
        Returns: Json
      }
      save_onboarding_scenario: {
        Args: { p_payload?: Json; p_scenario: string; p_status: string }
        Returns: Json
      }
      save_user_notifications: {
        Args: {
          p_email_invoices?: boolean
          p_email_marketing?: boolean
          p_email_new_transactions?: boolean
          p_email_payments?: boolean
          p_email_reminders?: boolean
          p_email_system_updates?: boolean
          p_email_weekly_reports?: boolean
          p_notification_frequency?: string
          p_push_alerts?: boolean
          p_push_new_transactions?: boolean
          p_push_reminders?: boolean
          p_push_system_updates?: boolean
          p_quiet_hours_enabled?: boolean
          p_quiet_hours_end?: string
          p_quiet_hours_start?: string
        }
        Returns: boolean
      }
      search_companies_intelligent: {
        Args: { p_limit?: number; p_search_term: string }
        Returns: {
          data_quality_score: number
          id: string
          legal_name: string
          name: string
          similarity_score: number
          siret: string
          status: string
        }[]
      }
      search_sectors: {
        Args: { limit_param?: number; search_term?: string }
        Returns: {
          category: string
          common_modules: string[]
          description: string
          sector_code: string
          sector_name: string
          typical_size_ranges: string[]
        }[]
      }
      search_unified_third_parties: {
        Args: {
          p_company_id: string
          p_limit?: number
          p_type?: string
          p_search_term?: string
        }
        Returns: {
          balance: number
          email: string
          id: string
          is_active: boolean
          name: string
          party_number: string
          type: string
          phone: string
          total_amount: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      track_trial_engagement_event: {
        Args: { p_event_type: string; p_metadata?: Json; p_user_id: string }
        Returns: boolean
      }
      transfer_company_ownership: {
        Args: {
          p_company_id: string
          p_from_user_id: string
          p_to_user_id: string
        }
        Returns: Json
      }
      trigger_webhooks: {
        Args: {
          p_company_id: string
          p_event_id: string
          p_event_type: string
          p_payload: Json
        }
        Returns: number
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_accounts_balance_from_entry: {
        Args: { p_journal_entry_id: string }
        Returns: undefined
      }
      update_company_governance_manual: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      update_consent: {
        Args: {
          p_consent_given: boolean
          p_consent_type: string
          p_consent_version?: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      update_contract_status: { Args: never; Returns: number }
      update_overdue_purchases: { Args: never; Returns: number }
      update_project_budget_actuals: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      update_quote_totals: { Args: { p_quote_id: string }; Returns: undefined }
      user_belongs_to_company: {
        Args: { company_uuid: string }
        Returns: boolean
      }
      user_has_access_to_company: {
        Args: { company_uuid: string }
        Returns: boolean
      }
      validate_company_step_data: {
        Args: {
          p_ceo_name?: string
          p_company_size?: string
          p_name: string
          p_sector?: string
          p_share_capital?: number
          p_timezone?: string
        }
        Returns: {
          errors: string[]
          is_valid: boolean
          quality_score: number
          warnings: string[]
        }[]
      }
      validate_fec_export: {
        Args: { p_company_id: string; p_end_date: string; p_start_date: string }
        Returns: Json
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
