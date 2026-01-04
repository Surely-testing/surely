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
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          message_count: number | null
          suite_id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_count?: number | null
          suite_id: string
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_count?: number | null
          suite_id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generated_content: {
        Row: {
          content_data: Json
          content_type: string
          created_at: string | null
          id: string
          is_saved: boolean | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          content_data: Json
          content_type: string
          created_at?: string | null
          id: string
          is_saved?: boolean | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          content_data?: Json
          content_type?: string
          created_at?: string | null
          id?: string
          is_saved?: boolean | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_content_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          asset_ids: string[] | null
          asset_type: string | null
          cost: number
          cost_breakdown: Json | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          input_tokens: number | null
          metadata: Json | null
          model: string
          operation_name: string | null
          operation_type: string
          output_tokens: number | null
          prompt_length: number | null
          prompt_summary: string | null
          provider: string
          response_length: number | null
          response_summary: string | null
          success: boolean
          suite_id: string
          tokens_used: number
          user_id: string
        }
        Insert: {
          asset_ids?: string[] | null
          asset_type?: string | null
          cost?: number
          cost_breakdown?: Json | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id: string
          input_tokens?: number | null
          metadata?: Json | null
          model: string
          operation_name?: string | null
          operation_type: string
          output_tokens?: number | null
          prompt_length?: number | null
          prompt_summary?: string | null
          provider?: string
          response_length?: number | null
          response_summary?: string | null
          success?: boolean
          suite_id: string
          tokens_used?: number
          user_id: string
        }
        Update: {
          asset_ids?: string[] | null
          asset_type?: string | null
          cost?: number
          cost_breakdown?: Json | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          metadata?: Json | null
          model?: string
          operation_name?: string | null
          operation_type?: string
          output_tokens?: number | null
          prompt_length?: number | null
          prompt_summary?: string | null
          provider?: string
          response_length?: number | null
          response_summary?: string | null
          success?: boolean
          suite_id?: string
          tokens_used?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      api_request_history: {
        Row: {
          created_at: string | null
          id: string
          request: Json
          response: Json
          suite_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          request: Json
          response: Json
          suite_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          request?: Json
          response?: Json
          suite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_request_history_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      api_requests: {
        Row: {
          body: string | null
          created_at: string | null
          headers: Json | null
          id: string
          method: string
          name: string
          suite_id: string
          updated_at: string | null
          url: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          headers?: Json | null
          id?: string
          method: string
          name: string
          suite_id: string
          updated_at?: string | null
          url: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          headers?: Json | null
          id?: string
          method?: string
          name?: string
          suite_id?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_requests_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_items: {
        Row: {
          archived_at: string | null
          archived_by: string
          asset_data: Json
          asset_id: string
          asset_type: string
          id: string
          suite_id: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by: string
          asset_data: Json
          asset_id: string
          asset_type: string
          id?: string
          suite_id: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string
          asset_data?: Json
          asset_id?: string
          asset_type?: string
          id?: string
          suite_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archived_items_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_relationships: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          notes: string | null
          relationship_type: string
          source_id: string
          source_type: string
          suite_id: string | null
          target_id: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          notes?: string | null
          relationship_type: string
          source_id: string
          source_type: string
          suite_id?: string | null
          target_id: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          notes?: string | null
          relationship_type?: string
          source_id?: string
          source_type?: string
          suite_id?: string | null
          target_id?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_relationships_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_configs: {
        Row: {
          created_at: string | null
          duration: number
          id: string
          name: string
          ramp_up_time: number
          suite_id: string
          target_url: string
          updated_at: string | null
          virtual_users: number
        }
        Insert: {
          created_at?: string | null
          duration?: number
          id?: string
          name: string
          ramp_up_time?: number
          suite_id: string
          target_url: string
          updated_at?: string | null
          virtual_users?: number
        }
        Update: {
          created_at?: string | null
          duration?: number
          id?: string
          name?: string
          ramp_up_time?: number
          suite_id?: string
          target_url?: string
          updated_at?: string | null
          virtual_users?: number
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_configs_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_runs: {
        Row: {
          config: Json
          config_id: string | null
          created_at: string | null
          id: string
          results: Json
          status: string
          suite_id: string
        }
        Insert: {
          config: Json
          config_id?: string | null
          created_at?: string | null
          id?: string
          results: Json
          status: string
          suite_id: string
        }
        Update: {
          config?: Json
          config_id?: string | null
          created_at?: string | null
          id?: string
          results?: Json
          status?: string
          suite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_runs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "benchmark_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmark_runs_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_attachments: {
        Row: {
          bug_id: string
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          bug_id: string
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          uploaded_by: string
        }
        Update: {
          bug_id?: string
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_attachments_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_attachments_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bugs_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_recordings: {
        Row: {
          bug_id: string
          created_at: string | null
          created_by: string | null
          id: string
          recording_id: string
        }
        Insert: {
          bug_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          recording_id: string
        }
        Update: {
          bug_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          recording_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_recordings_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_recordings_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bugs_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_recordings_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_recordings_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_test_cases: {
        Row: {
          bug_id: string
          created_at: string | null
          created_by: string | null
          id: string
          test_case_id: string
        }
        Insert: {
          bug_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          test_case_id: string
        }
        Update: {
          bug_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          test_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_test_cases_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_test_cases_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bugs_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_test_cases_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      bugs: {
        Row: {
          actual_behavior: string | null
          assigned_to: string | null
          browser: string | null
          closed_at: string | null
          component: string | null
          created_at: string | null
          created_by: string
          description: string | null
          environment: string | null
          expected_behavior: string | null
          id: string
          labels: Json | null
          linked_recording_id: string | null
          linked_test_case_id: string | null
          module: string | null
          os: string | null
          priority: string | null
          resolved_at: string | null
          severity: string | null
          sprint_id: string | null
          status: string | null
          steps_to_reproduce: Json | null
          suite_id: string
          tags: string[] | null
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          actual_behavior?: string | null
          assigned_to?: string | null
          browser?: string | null
          closed_at?: string | null
          component?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          environment?: string | null
          expected_behavior?: string | null
          id?: string
          labels?: Json | null
          linked_recording_id?: string | null
          linked_test_case_id?: string | null
          module?: string | null
          os?: string | null
          priority?: string | null
          resolved_at?: string | null
          severity?: string | null
          sprint_id?: string | null
          status?: string | null
          steps_to_reproduce?: Json | null
          suite_id: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          actual_behavior?: string | null
          assigned_to?: string | null
          browser?: string | null
          closed_at?: string | null
          component?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          environment?: string | null
          expected_behavior?: string | null
          id?: string
          labels?: Json | null
          linked_recording_id?: string | null
          linked_test_case_id?: string | null
          module?: string | null
          os?: string | null
          priority?: string | null
          resolved_at?: string | null
          severity?: string | null
          sprint_id?: string | null
          status?: string | null
          steps_to_reproduce?: Json | null
          suite_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bugs_linked_recording_id_fkey"
            columns: ["linked_recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bugs_linked_recording_id_fkey"
            columns: ["linked_recording_id"]
            isOneToOne: false
            referencedRelation: "recordings_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bugs_linked_test_case_id_fkey"
            columns: ["linked_test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bugs_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sprint"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_attachments: {
        Row: {
          comment_id: string
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          uploaded_by: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_attachments_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          created_at: string | null
          edited: boolean | null
          id: string
          mentions: string[] | null
          parent_comment_id: string | null
          resource_id: string
          resource_type: string
          text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          edited?: boolean | null
          id?: string
          mentions?: string[] | null
          parent_comment_id?: string | null
          resource_id: string
          resource_type: string
          text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          edited?: boolean | null
          id?: string
          mentions?: string[] | null
          parent_comment_id?: string | null
          resource_id?: string
          resource_type?: string
          text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      document_collaborators: {
        Row: {
          added_at: string | null
          added_by: string
          document_id: string
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by: string
          document_id: string
          id?: string
          permission?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string
          document_id?: string
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_collaborators_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          archived: boolean | null
          content: string | null
          created_at: string | null
          created_by: string
          file_type: string | null
          file_url: string | null
          id: string
          sprint_id: string | null
          suite_id: string
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          archived?: boolean | null
          content?: string | null
          created_at?: string | null
          created_by: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          sprint_id?: string | null
          suite_id: string
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          archived?: boolean | null
          content?: string | null
          created_at?: string | null
          created_by?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          sprint_id?: string | null
          suite_id?: string
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sprint"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          invited_by: string
          invitee_email: string
          organization_id: string | null
          role: string
          status: string | null
          suite_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          invited_by: string
          invitee_email: string
          organization_id?: string | null
          role: string
          status?: string | null
          suite_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          invitee_email?: string
          organization_id?: string | null
          role?: string
          status?: string | null
          suite_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string | null
          organization_id: string
          role: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          organization_id: string
          role: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          organization_id?: string
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          industry: string | null
          name: string
          owner_id: string
          size: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          industry?: string | null
          name: string
          owner_id: string
          size?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          industry?: string | null
          name?: string
          owner_id?: string
          size?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          location: string | null
          metadata: Json | null
          name: string
          organization_id: string | null
          organization_industry: string | null
          organization_name: string | null
          organization_size: string | null
          organization_website: string | null
          registration_completed: boolean | null
          role: string | null
          status: string | null
          terms_accepted: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_type: string
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          id: string
          location?: string | null
          metadata?: Json | null
          name: string
          organization_id?: string | null
          organization_industry?: string | null
          organization_name?: string | null
          organization_size?: string | null
          organization_website?: string | null
          registration_completed?: boolean | null
          role?: string | null
          status?: string | null
          terms_accepted?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          organization_industry?: string | null
          organization_name?: string | null
          organization_size?: string | null
          organization_website?: string | null
          registration_completed?: boolean | null
          role?: string | null
          status?: string | null
          terms_accepted?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          priority: string | null
          sprint_id: string | null
          status: string | null
          suite_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          priority?: string | null
          sprint_id?: string | null
          status?: string | null
          suite_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          priority?: string | null
          sprint_id?: string | null
          status?: string | null
          suite_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sprint"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      recordings: {
        Row: {
          archived: boolean
          created_at: string | null
          created_by: string
          duration: number | null
          id: string
          metadata: Json | null
          sprint_id: string | null
          suite_id: string
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          archived?: boolean
          created_at?: string | null
          created_by: string
          duration?: number | null
          id?: string
          metadata?: Json | null
          sprint_id?: string | null
          suite_id: string
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          archived?: boolean
          created_at?: string | null
          created_by?: string
          duration?: number | null
          id?: string
          metadata?: Json | null
          sprint_id?: string | null
          suite_id?: string
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sprint"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      report_schedules: {
        Row: {
          created_at: string | null
          emails: string[] | null
          frequency: string
          id: string
          is_active: boolean | null
          next_run: string | null
          suite_id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emails?: string[] | null
          frequency: string
          id?: string
          is_active?: boolean | null
          next_run?: string | null
          suite_id: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          emails?: string[] | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_run?: string | null
          suite_id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      report_types: {
        Row: {
          default_metrics: Json | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          default_metrics?: Json | null
          description?: string | null
          id: string
          name: string
        }
        Update: {
          default_metrics?: Json | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          created_by: string
          data: Json | null
          id: string
          name: string
          sprint_id: string | null
          suite_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          data?: Json | null
          id?: string
          name: string
          sprint_id?: string | null
          suite_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          data?: Json | null
          id?: string
          name?: string
          sprint_id?: string | null
          suite_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string | null
          goals: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          suite_id: string
          test_case_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date?: string | null
          goals?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          suite_id: string
          test_case_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string | null
          goals?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          suite_id?: string
          test_case_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sprints_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          limits: Json | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          limits?: Json | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          limits?: Json | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          assigned_to: string | null
          attachments: string[] | null
          category: string
          created_at: string | null
          created_by: string
          description: string
          discussion_notes: string | null
          downvotes: number | null
          effort_estimate: string | null
          id: string
          impact: string
          implemented_at: string | null
          priority: string
          rationale: string | null
          sprint_id: string | null
          status: string
          suite_id: string
          tags: string[] | null
          title: string
          updated_at: string | null
          upvotes: number | null
          votes: Json | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: string[] | null
          category: string
          created_at?: string | null
          created_by: string
          description: string
          discussion_notes?: string | null
          downvotes?: number | null
          effort_estimate?: string | null
          id?: string
          impact: string
          implemented_at?: string | null
          priority: string
          rationale?: string | null
          sprint_id?: string | null
          status?: string
          suite_id: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          upvotes?: number | null
          votes?: Json | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string
          created_at?: string | null
          created_by?: string
          description?: string
          discussion_notes?: string | null
          downvotes?: number | null
          effort_estimate?: string | null
          id?: string
          impact?: string
          implemented_at?: string | null
          priority?: string
          rationale?: string | null
          sprint_id?: string | null
          status?: string
          suite_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          upvotes?: number | null
          votes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      suite_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          role: string
          suite_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          suite_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          suite_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suite_members_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      test_analyses: {
        Row: {
          created_at: string | null
          file_name: string
          id: string
          insights: Json
          stats: Json
          suite_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          id?: string
          insights?: Json
          stats: Json
          suite_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          id?: string
          insights?: Json
          stats?: Json
          suite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_analyses_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          actual_duration: number | null
          archived_at: string | null
          archived_by: string | null
          assigned_to: string | null
          attachments: Json | null
          automation_analysis: Json | null
          automation_potential: string | null
          created_at: string | null
          created_by: string
          custom_fields: Json | null
          description: string | null
          estimated_duration: number | null
          execution_count: number | null
          expected_result: string | null
          fail_count: number | null
          id: string
          is_automated: boolean | null
          last_executed_at: string | null
          last_executed_by: string | null
          last_fail_date: string | null
          last_pass_date: string | null
          last_result: string | null
          linked_bugs: string[] | null
          module: string | null
          parent_id: string | null
          pass_count: number | null
          postconditions: string | null
          preconditions: string | null
          priority: string | null
          sprint_id: string | null
          status: string | null
          steps: Json | null
          suite_id: string
          tags: string[] | null
          test_data_id: string | null
          title: string
          type: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          actual_duration?: number | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          automation_analysis?: Json | null
          automation_potential?: string | null
          created_at?: string | null
          created_by: string
          custom_fields?: Json | null
          description?: string | null
          estimated_duration?: number | null
          execution_count?: number | null
          expected_result?: string | null
          fail_count?: number | null
          id?: string
          is_automated?: boolean | null
          last_executed_at?: string | null
          last_executed_by?: string | null
          last_fail_date?: string | null
          last_pass_date?: string | null
          last_result?: string | null
          linked_bugs?: string[] | null
          module?: string | null
          parent_id?: string | null
          pass_count?: number | null
          postconditions?: string | null
          preconditions?: string | null
          priority?: string | null
          sprint_id?: string | null
          status?: string | null
          steps?: Json | null
          suite_id: string
          tags?: string[] | null
          test_data_id?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          actual_duration?: number | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          automation_analysis?: Json | null
          automation_potential?: string | null
          created_at?: string | null
          created_by?: string
          custom_fields?: Json | null
          description?: string | null
          estimated_duration?: number | null
          execution_count?: number | null
          expected_result?: string | null
          fail_count?: number | null
          id?: string
          is_automated?: boolean | null
          last_executed_at?: string | null
          last_executed_by?: string | null
          last_fail_date?: string | null
          last_pass_date?: string | null
          last_result?: string | null
          linked_bugs?: string[] | null
          module?: string | null
          parent_id?: string | null
          pass_count?: number | null
          postconditions?: string | null
          preconditions?: string | null
          priority?: string | null
          sprint_id?: string | null
          status?: string | null
          steps?: Json | null
          suite_id?: string
          tags?: string[] | null
          test_data_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sprint"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_cases_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_cases_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_cases_test_data_id_fkey"
            columns: ["test_data_id"]
            isOneToOne: false
            referencedRelation: "test_data"
            referencedColumns: ["id"]
          },
        ]
      }
      test_data: {
        Row: {
          created_at: string | null
          created_by: string
          data: Json
          id: string
          name: string
          sprint_id: string | null
          suite_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          data?: Json
          id?: string
          name: string
          sprint_id?: string | null
          suite_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          data?: Json
          id?: string
          name?: string
          sprint_id?: string | null
          suite_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sprint"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_data_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      test_data_items: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          metadata: Json | null
          suite_id: string
          type_id: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          metadata?: Json | null
          suite_id: string
          type_id: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          metadata?: Json | null
          suite_id?: string
          type_id?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_data_items_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_data_items_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "test_data_types"
            referencedColumns: ["id"]
          },
        ]
      }
      test_data_types: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string
          description: string | null
          generator_type: string | null
          icon: string | null
          id: string
          name: string
          suite_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          generator_type?: string | null
          icon?: string | null
          id?: string
          name: string
          suite_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          generator_type?: string | null
          icon?: string | null
          id?: string
          name?: string
          suite_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_data_types_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      test_execution_history: {
        Row: {
          duration_minutes: number | null
          executed_at: string | null
          executed_by: string | null
          id: string
          notes: string | null
          sprint_id: string | null
          status: string
          test_case_id: string
          test_run_id: string
        }
        Insert: {
          duration_minutes?: number | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          sprint_id?: string | null
          status: string
          test_case_id: string
          test_run_id: string
        }
        Update: {
          duration_minutes?: number | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          sprint_id?: string | null
          status?: string
          test_case_id?: string
          test_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_execution_history_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_execution_history_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_execution_history_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_run_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_execution_history_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_run_results: {
        Row: {
          actual_result: string | null
          bug_id: string | null
          created_at: string | null
          duration_seconds: number | null
          executed_at: string | null
          executed_by: string | null
          id: string
          notes: string | null
          screenshots: Json | null
          sprint_id: string | null
          status: string | null
          test_case_id: string
          test_run_id: string
          updated_at: string | null
        }
        Insert: {
          actual_result?: string | null
          bug_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          screenshots?: Json | null
          sprint_id?: string | null
          status?: string | null
          test_case_id: string
          test_run_id: string
          updated_at?: string | null
        }
        Update: {
          actual_result?: string | null
          bug_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          screenshots?: Json | null
          sprint_id?: string | null
          status?: string | null
          test_case_id?: string
          test_run_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_run_results_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_run_results_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bugs_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_run_results_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_run_results_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_run_results_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_run_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_run_results_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_runs: {
        Row: {
          additional_case_ids: string[] | null
          assigned_to: string | null
          attachments: Json | null
          blocked_count: number | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          environment: string
          executed_at: string | null
          failed_count: number | null
          id: string
          name: string
          notes: string | null
          passed_count: number | null
          scheduled_date: string | null
          skipped_count: number | null
          sprint_ids: string[] | null
          status: string | null
          suite_id: string
          test_case_ids: string[] | null
          test_type: string | null
          total_count: number | null
          updated_at: string | null
        }
        Insert: {
          additional_case_ids?: string[] | null
          assigned_to?: string | null
          attachments?: Json | null
          blocked_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          environment: string
          executed_at?: string | null
          failed_count?: number | null
          id?: string
          name: string
          notes?: string | null
          passed_count?: number | null
          scheduled_date?: string | null
          skipped_count?: number | null
          sprint_ids?: string[] | null
          status?: string | null
          suite_id: string
          test_case_ids?: string[] | null
          test_type?: string | null
          total_count?: number | null
          updated_at?: string | null
        }
        Update: {
          additional_case_ids?: string[] | null
          assigned_to?: string | null
          attachments?: Json | null
          blocked_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          environment?: string
          executed_at?: string | null
          failed_count?: number | null
          id?: string
          name?: string
          notes?: string | null
          passed_count?: number | null
          scheduled_date?: string | null
          skipped_count?: number | null
          sprint_ids?: string[] | null
          status?: string | null
          suite_id?: string
          test_case_ids?: string[] | null
          test_type?: string | null
          total_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_runs_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      test_suites: {
        Row: {
          admins: string[] | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          members: string[] | null
          name: string
          owner_id: string
          owner_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admins?: string[] | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          members?: string[] | null
          name: string
          owner_id: string
          owner_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admins?: string[] | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          members?: string[] | null
          name?: string
          owner_id?: string
          owner_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trash: {
        Row: {
          asset_data: Json
          asset_id: string
          asset_type: string
          deleted_at: string | null
          deleted_by: string
          expires_at: string
          id: string
          suite_id: string
          updated_at: string | null
        }
        Insert: {
          asset_data: Json
          asset_id: string
          asset_type: string
          deleted_at?: string | null
          deleted_by: string
          expires_at: string
          id?: string
          suite_id: string
          updated_at?: string | null
        }
        Update: {
          asset_data?: Json
          asset_id?: string
          asset_type?: string
          deleted_at?: string | null
          deleted_by?: string
          expires_at?: string
          id?: string
          suite_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trash_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          current_suite_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_suite_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_suite_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_current_suite_id_fkey"
            columns: ["current_suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_analysis: {
        Row: {
          created_at: string | null
          id: string
          optimizations: Json
          suite_id: string
          total_savings: number | null
          workflow_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          optimizations?: Json
          suite_id: string
          total_savings?: number | null
          workflow_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          optimizations?: Json
          suite_id?: string
          total_savings?: number | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_analysis_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_analysis_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string | null
          id: string
          name: string
          steps: Json
          suite_id: string
          total_duration: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          steps?: Json
          suite_id: string
          total_duration?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          steps?: Json
          suite_id?: string
          total_duration?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_model_usage_stats: {
        Row: {
          avg_cost_per_op: number | null
          avg_tokens_per_op: number | null
          model: string | null
          operation_count: number | null
          success_rate: number | null
          total_cost: number | null
          total_tokens: number | null
        }
        Relationships: []
      }
      ai_usage_daily_summary: {
        Row: {
          avg_cost: number | null
          avg_tokens: number | null
          failed_operations: number | null
          operation_count: number | null
          operation_type: string | null
          successful_operations: number | null
          suite_id: string | null
          total_cost: number | null
          total_tokens: number | null
          usage_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_user_summary: {
        Row: {
          last_operation: string | null
          suite_id: string | null
          total_cost: number | null
          total_operations: number | null
          total_tokens: number | null
          unique_operation_types: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_relationships_with_details: {
        Row: {
          created_at: string | null
          created_by: string | null
          creator_avatar: string | null
          creator_name: string | null
          id: string | null
          notes: string | null
          relationship_type: string | null
          source_id: string | null
          source_title: string | null
          source_type: string | null
          target_id: string | null
          target_title: string | null
          target_type: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      bugs_with_details: {
        Row: {
          actual_behavior: string | null
          assigned_to: string | null
          assignee_email: string | null
          assignee_name: string | null
          attachment_count: number | null
          attachments: Json | null
          browser: string | null
          closed_at: string | null
          component: string | null
          created_at: string | null
          created_by: string | null
          creator_email: string | null
          creator_name: string | null
          description: string | null
          environment: string | null
          expected_behavior: string | null
          id: string | null
          labels: Json | null
          linked_recording_id: string | null
          linked_test_case_id: string | null
          module: string | null
          os: string | null
          priority: string | null
          resolved_at: string | null
          severity: string | null
          sprint_id: string | null
          status: string | null
          steps_to_reproduce: Json | null
          suite_id: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          version: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bugs_linked_recording_id_fkey"
            columns: ["linked_recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bugs_linked_recording_id_fkey"
            columns: ["linked_recording_id"]
            isOneToOne: false
            referencedRelation: "recordings_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bugs_linked_test_case_id_fkey"
            columns: ["linked_test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bugs_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sprint"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      recordings_with_details: {
        Row: {
          created_at: string | null
          creator_email: string | null
          creator_name: string | null
          duration: number | null
          id: string | null
          metadata: Json | null
          sprint_id: string | null
          sprint_name: string | null
          suite_id: string | null
          suite_name: string | null
          suite_owner_id: string | null
          title: string | null
          updated_at: string | null
          url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sprint"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      test_case_execution_history: {
        Row: {
          duration_minutes: number | null
          executed_at: string | null
          executed_by: string | null
          notes: string | null
          sprint_id: string | null
          sprint_name: string | null
          status: string | null
          test_case_id: string | null
          test_case_title: string | null
          test_run_id: string | null
          test_run_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_execution_history_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_execution_history_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_execution_history_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_run_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_execution_history_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_run_analytics: {
        Row: {
          additional_case_count: number | null
          blocked_count: number | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          duration_seconds: number | null
          environment: string | null
          executed_at: string | null
          failed_count: number | null
          id: string | null
          name: string | null
          pass_rate: number | null
          passed_count: number | null
          skipped_count: number | null
          sprint_count: number | null
          sprint_ids: string[] | null
          status: string | null
          suite_id: string | null
          test_type: string | null
          total_count: number | null
        }
        Insert: {
          additional_case_count?: never
          blocked_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: never
          environment?: string | null
          executed_at?: string | null
          failed_count?: number | null
          id?: string | null
          name?: string | null
          pass_rate?: never
          passed_count?: number | null
          skipped_count?: number | null
          sprint_count?: never
          sprint_ids?: string[] | null
          status?: string | null
          suite_id?: string | null
          test_type?: string | null
          total_count?: number | null
        }
        Update: {
          additional_case_count?: never
          blocked_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: never
          environment?: string | null
          executed_at?: string | null
          failed_count?: number | null
          id?: string | null
          name?: string | null
          pass_rate?: never
          passed_count?: number | null
          skipped_count?: number | null
          sprint_count?: never
          sprint_ids?: string[] | null
          status?: string | null
          suite_id?: string | null
          test_type?: string | null
          total_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_runs_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_asset: {
        Args: {
          asset_id: string
          asset_type: string
          requesting_user_id: string
        }
        Returns: boolean
      }
      can_admin_test_suite: {
        Args: { requesting_user_id: string; suite_id: string }
        Returns: boolean
      }
      can_read_test_suite: {
        Args: { requesting_user_id: string; suite_id: string }
        Returns: boolean
      }
      can_write_test_suite: {
        Args: { requesting_user_id: string; suite_id: string }
        Returns: boolean
      }
      cleanup_old_ai_logs: {
        Args: { retention_days?: number }
        Returns: number
      }
      cleanup_old_recording_logs: { Args: never; Returns: number }
      downgrade_expired_trials: { Args: never; Returns: undefined }
      get_asset_relationship_count: {
        Args: { asset_id: string; asset_type: string }
        Returns: number
      }
      get_asset_suite_id: {
        Args: { asset_id: string; asset_type: string }
        Returns: string
      }
      get_linked_assets: {
        Args: { p_asset_id: string; p_asset_type: string }
        Returns: {
          asset_id: string
          asset_title: string
          asset_type: string
          created_at: string
          direction: string
          relationship_id: string
          relationship_type: string
        }[]
      }
      get_recording_stats: {
        Args: { p_suite_id: string }
        Returns: {
          recordings_this_month: number
          total_duration: number
          total_recordings: number
          total_size_mb: number
        }[]
      }
      get_suite_ai_stats: {
        Args: { p_end_date?: string; p_start_date?: string; p_suite_id: string }
        Returns: {
          cost_by_model: Json
          daily_usage: Json
          operations_by_type: Json
          total_cost: number
          total_operations: number
          total_tokens: number
        }[]
      }
      get_suite_relationship_stats: {
        Args: { p_suite_id: string }
        Returns: {
          count: number
          relationship_type: string
        }[]
      }
      get_test_case_history: {
        Args: { p_limit?: number; p_test_case_id: string }
        Returns: {
          duration_minutes: number
          executed_at: string
          notes: string
          sprint_id: string
          sprint_name: string
          status: string
          test_run_id: string
          test_run_name: string
        }[]
      }
      handle_new_user_registration: {
        Args: {
          org_industry?: string
          org_name?: string
          org_size?: string
          user_account_type: string
          user_email: string
          user_id: string
          user_name: string
          user_terms_accepted: boolean
        }
        Returns: Json
      }
      is_document_owner: {
        Args: { doc_id: string; requesting_user_id: string }
        Returns: boolean
      }
      is_org_admin: {
        Args: { org_id: string; requesting_user_id: string }
        Returns: boolean
      }
      is_org_manager: {
        Args: { org_id: string; requesting_user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { org_id: string; requesting_user_id: string }
        Returns: boolean
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
