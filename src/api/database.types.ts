export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          at: string
          before: Json | null
          campaign_id: string | null
          id: number
          reason: string | null
          row_id: string | null
          table_name: string
          warband_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          campaign_id?: string | null
          id?: never
          reason?: string | null
          row_id?: string | null
          table_name: string
          warband_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          campaign_id?: string | null
          id?: never
          reason?: string | null
          row_id?: string | null
          table_name?: string
          warband_id?: string | null
        }
        Relationships: []
      }
      battle_sessions: {
        Row: {
          created_at: string
          live_state: Json
          match_id: string
          updated_at: string
          warband_id: string
        }
        Insert: {
          created_at?: string
          live_state?: Json
          match_id: string
          updated_at?: string
          warband_id: string
        }
        Update: {
          created_at?: string
          live_state?: Json
          match_id?: string
          updated_at?: string
          warband_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_sessions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_sessions_warband_id_fkey"
            columns: ["warband_id"]
            isOneToOne: false
            referencedRelation: "warbands"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_members: {
        Row: {
          campaign_id: string
          joined_at: string
          left_at: string | null
          user_id: string
          warband_id: string
        }
        Insert: {
          campaign_id: string
          joined_at?: string
          left_at?: string | null
          user_id: string
          warband_id: string
        }
        Update: {
          campaign_id?: string
          joined_at?: string
          left_at?: string | null
          user_id?: string
          warband_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "campaign_members_warband_id_fkey"
            columns: ["warband_id"]
            isOneToOne: false
            referencedRelation: "warbands"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          archived: boolean
          created_at: string
          gm_id: string
          id: string
          invite_code: string
          name: string
          rules_markdown: string
          settings: Json
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          gm_id?: string
          id?: string
          invite_code?: string
          name: string
          rules_markdown?: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          gm_id?: string
          id?: string
          invite_code?: string
          name?: string
          rules_markdown?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_gm_profile_fkey"
            columns: ["gm_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      henchman_groups: {
        Row: {
          created_at: string
          id: string
          is_large: boolean
          level_ups: number
          name: string
          notes: string
          size: number
          sort_order: number
          stat_increases: Json
          stats: Json
          unit_type_rules_id: string
          updated_at: string
          warband_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_large?: boolean
          level_ups?: number
          name: string
          notes?: string
          size?: number
          sort_order?: number
          stat_increases?: Json
          stats: Json
          unit_type_rules_id: string
          updated_at?: string
          warband_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_large?: boolean
          level_ups?: number
          name?: string
          notes?: string
          size?: number
          sort_order?: number
          stat_increases?: Json
          stats?: Json
          unit_type_rules_id?: string
          updated_at?: string
          warband_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "henchman_groups_warband_id_fkey"
            columns: ["warband_id"]
            isOneToOne: false
            referencedRelation: "warbands"
            referencedColumns: ["id"]
          },
        ]
      }
      heroes: {
        Row: {
          created_at: string
          equipment_locked: boolean
          flags: Json
          hired_sword_rules_id: string | null
          id: string
          injuries: Json
          is_hired_sword: boolean
          is_large: boolean
          level_ups: number
          name: string
          notes: string
          skill_tables: string[]
          skills: string[]
          sort_order: number
          spells: string[]
          stats: Json
          status: Database["public"]["Enums"]["warrior_status"]
          unit_type_rules_id: string | null
          updated_at: string
          warband_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          equipment_locked?: boolean
          flags?: Json
          hired_sword_rules_id?: string | null
          id?: string
          injuries?: Json
          is_hired_sword?: boolean
          is_large?: boolean
          level_ups?: number
          name: string
          notes?: string
          skill_tables?: string[]
          skills?: string[]
          sort_order?: number
          spells?: string[]
          stats: Json
          status?: Database["public"]["Enums"]["warrior_status"]
          unit_type_rules_id?: string | null
          updated_at?: string
          warband_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          equipment_locked?: boolean
          flags?: Json
          hired_sword_rules_id?: string | null
          id?: string
          injuries?: Json
          is_hired_sword?: boolean
          is_large?: boolean
          level_ups?: number
          name?: string
          notes?: string
          skill_tables?: string[]
          skills?: string[]
          sort_order?: number
          spells?: string[]
          stats?: Json
          status?: Database["public"]["Enums"]["warrior_status"]
          unit_type_rules_id?: string | null
          updated_at?: string
          warband_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "heroes_warband_id_fkey"
            columns: ["warband_id"]
            isOneToOne: false
            referencedRelation: "warbands"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string
          custom_name: string | null
          holder_id: string | null
          holder_type: Database["public"]["Enums"]["item_holder"]
          id: string
          item_rules_id: string | null
          notes: string
          quantity: number
          updated_at: string
          warband_id: string
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          holder_id?: string | null
          holder_type?: Database["public"]["Enums"]["item_holder"]
          id?: string
          item_rules_id?: string | null
          notes?: string
          quantity?: number
          updated_at?: string
          warband_id: string
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          holder_id?: string | null
          holder_type?: Database["public"]["Enums"]["item_holder"]
          id?: string
          item_rules_id?: string | null
          notes?: string
          quantity?: number
          updated_at?: string
          warband_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_warband_id_fkey"
            columns: ["warband_id"]
            isOneToOne: false
            referencedRelation: "warbands"
            referencedColumns: ["id"]
          },
        ]
      }
      match_participants: {
        Row: {
          accepted_at: string | null
          invited_at: string
          match_id: string
          warband_id: string
        }
        Insert: {
          accepted_at?: string | null
          invited_at?: string
          match_id: string
          warband_id: string
        }
        Update: {
          accepted_at?: string | null
          invited_at?: string
          match_id?: string
          warband_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_participants_warband_id_fkey"
            columns: ["warband_id"]
            isOneToOne: false
            referencedRelation: "warbands"
            referencedColumns: ["id"]
          },
        ]
      }
      match_reports: {
        Row: {
          adjustments: Json
          amended_at: string | null
          amended_by: string | null
          amendment_note: string | null
          applied: Json
          exploration: Json
          id: string
          injuries: Json
          loot: Json
          match_id: string
          notes: string
          ooa: Json
          result: string
          review_note: string | null
          revision: number
          routed: boolean
          status: string
          submitted_at: string
          submitted_by: string
          undo: Json | null
          veteran_pool_roll: number | null
          warband_id: string
          won: boolean
          xp_log: Json
        }
        Insert: {
          adjustments?: Json
          amended_at?: string | null
          amended_by?: string | null
          amendment_note?: string | null
          applied?: Json
          exploration?: Json
          id?: string
          injuries?: Json
          loot?: Json
          match_id: string
          notes?: string
          ooa?: Json
          result?: string
          review_note?: string | null
          revision?: number
          routed?: boolean
          status?: string
          submitted_at?: string
          submitted_by: string
          undo?: Json | null
          veteran_pool_roll?: number | null
          warband_id: string
          won?: boolean
          xp_log?: Json
        }
        Update: {
          adjustments?: Json
          amended_at?: string | null
          amended_by?: string | null
          amendment_note?: string | null
          applied?: Json
          exploration?: Json
          id?: string
          injuries?: Json
          loot?: Json
          match_id?: string
          notes?: string
          ooa?: Json
          result?: string
          review_note?: string | null
          revision?: number
          routed?: boolean
          status?: string
          submitted_at?: string
          submitted_by?: string
          undo?: Json | null
          veteran_pool_roll?: number | null
          warband_id?: string
          won?: boolean
          xp_log?: Json
        }
        Relationships: [
          {
            foreignKeyName: "match_reports_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_reports_submitted_by_profile_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "match_reports_warband_id_fkey"
            columns: ["warband_id"]
            isOneToOne: false
            referencedRelation: "warbands"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          campaign_id: string
          combat_mode: Database["public"]["Enums"]["combat_mode"]
          completed_at: string | null
          created_at: string
          created_by: string
          created_via: Database["public"]["Enums"]["match_origin"]
          custom_scenario_id: string | null
          id: string
          notes: string
          scenario_rules_id: string | null
          scheduled_for: string | null
          started_at: string | null
          state: Database["public"]["Enums"]["match_state"]
          updated_at: string
        }
        Insert: {
          campaign_id: string
          combat_mode?: Database["public"]["Enums"]["combat_mode"]
          completed_at?: string | null
          created_at?: string
          created_by: string
          created_via?: Database["public"]["Enums"]["match_origin"]
          custom_scenario_id?: string | null
          id?: string
          notes?: string
          scenario_rules_id?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["match_state"]
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          combat_mode?: Database["public"]["Enums"]["combat_mode"]
          completed_at?: string | null
          created_at?: string
          created_by?: string
          created_via?: Database["public"]["Enums"]["match_origin"]
          custom_scenario_id?: string | null
          id?: string
          notes?: string
          scenario_rules_id?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["match_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_created_by_profile_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "matches_custom_scenario_id_fkey"
            columns: ["custom_scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_advances: {
        Row: {
          created_at: string
          id: string
          resolution: Json | null
          resolved_at: string | null
          rolled: Json | null
          subject_id: string
          subject_type: Database["public"]["Enums"]["advance_subject"]
          threshold_xp: number
          warband_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resolution?: Json | null
          resolved_at?: string | null
          rolled?: Json | null
          subject_id: string
          subject_type: Database["public"]["Enums"]["advance_subject"]
          threshold_xp: number
          warband_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resolution?: Json | null
          resolved_at?: string | null
          rolled?: Json | null
          subject_id?: string
          subject_type?: Database["public"]["Enums"]["advance_subject"]
          threshold_xp?: number
          warband_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_advances_warband_id_fkey"
            columns: ["warband_id"]
            isOneToOne: false
            referencedRelation: "warbands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_revisions: {
        Row: {
          id: string
          match_id: string
          note: string
          replaced_at: string
          replaced_by: string | null
          report: Json
          report_id: string
          revision: number
          warband_id: string
        }
        Insert: {
          id?: string
          match_id: string
          note?: string
          replaced_at?: string
          replaced_by?: string | null
          report: Json
          report_id: string
          revision: number
          warband_id: string
        }
        Update: {
          id?: string
          match_id?: string
          note?: string
          replaced_at?: string
          replaced_by?: string | null
          report?: Json
          report_id?: string
          revision?: number
          warband_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_revisions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_revisions_replaced_by_profile_fkey"
            columns: ["replaced_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "report_revisions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "match_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_revisions_warband_id_fkey"
            columns: ["warband_id"]
            isOneToOne: false
            referencedRelation: "warbands"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          campaign_id: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
          rules_markdown: string
          setting: string
          summary: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id?: string
          rules_markdown?: string
          setting?: string
          summary?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          rules_markdown?: string
          setting?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_phase_state: {
        Row: {
          created_at: string
          heroes_searched: string[]
          match_id: string
          updated_at: string
          warband_id: string
          wyrdstone_sold: boolean
        }
        Insert: {
          created_at?: string
          heroes_searched?: string[]
          match_id: string
          updated_at?: string
          warband_id: string
          wyrdstone_sold?: boolean
        }
        Update: {
          created_at?: string
          heroes_searched?: string[]
          match_id?: string
          updated_at?: string
          warband_id?: string
          wyrdstone_sold?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "trade_phase_state_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_phase_state_warband_id_fkey"
            columns: ["warband_id"]
            isOneToOne: false
            referencedRelation: "warbands"
            referencedColumns: ["id"]
          },
        ]
      }
      warbands: {
        Row: {
          archived: boolean
          created_at: string
          gold: number
          id: string
          name: string
          notes: string
          owner_id: string
          type_rules_id: string
          updated_at: string
          veteran_pool: number | null
          wyrdstone: number
        }
        Insert: {
          archived?: boolean
          created_at?: string
          gold?: number
          id?: string
          name: string
          notes?: string
          owner_id?: string
          type_rules_id: string
          updated_at?: string
          veteran_pool?: number | null
          wyrdstone?: number
        }
        Update: {
          archived?: boolean
          created_at?: string
          gold?: number
          id?: string
          name?: string
          notes?: string
          owner_id?: string
          type_rules_id?: string
          updated_at?: string
          veteran_pool?: number | null
          wyrdstone?: number
        }
        Relationships: [
          {
            foreignKeyName: "warbands_owner_profile_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_battle_report: { Args: { p_report_id: string }; Returns: undefined }
      approve_battle_report: {
        Args: { p_report_id: string }
        Returns: Database["public"]["Enums"]["match_state"]
      }
      campaign_preview: {
        Args: { p_invite_code: string }
        Returns: {
          archived: boolean
          campaign_id: string
          gm_display_name: string
          member_count: number
          name: string
        }[]
      }
      can_edit_warband: { Args: { p_warband_id: string }; Returns: boolean }
      can_read_campaign: { Args: { p_campaign_id: string }; Returns: boolean }
      can_read_warband: { Args: { p_warband_id: string }; Returns: boolean }
      cancel_match: {
        Args: { p_match_id: string }
        Returns: Database["public"]["Enums"]["match_state"]
      }
      complete_match_if_reported: {
        Args: { p_match_id: string }
        Returns: Database["public"]["Enums"]["match_state"]
      }
      create_warband: { Args: { payload: Json }; Returns: string }
      end_match: {
        Args: { p_match_id: string }
        Returns: Database["public"]["Enums"]["match_state"]
      }
      generate_invite_code: { Args: never; Returns: string }
      import_battle_records: {
        Args: { p_campaign_id: string; p_matches: Json }
        Returns: number
      }
      is_campaign_gm: { Args: { p_campaign_id: string }; Returns: boolean }
      is_campaign_member: { Args: { p_campaign_id: string }; Returns: boolean }
      is_match_participant: { Args: { p_match_id: string }; Returns: boolean }
      is_stats_profile: { Args: { v: Json }; Returns: boolean }
      join_campaign: {
        Args: { p_invite_code: string; p_warband_id: string }
        Returns: {
          campaign_id: string
          joined_at: string
          left_at: string | null
          user_id: string
          warband_id: string
        }
        SetofOptions: {
          from: "*"
          to: "campaign_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leave_campaign: {
        Args: { p_campaign_id: string; p_warband_id: string }
        Returns: undefined
      }
      match_campaign: { Args: { p_match_id: string }; Returns: string }
      owns_warband: { Args: { p_warband_id: string }; Returns: boolean }
      record_trade: {
        Args: {
          p_changes?: Json
          p_heroes_searched?: string[]
          p_match_id?: string
          p_reason?: string
          p_warband_id: string
          p_wyrdstone_sold?: boolean
        }
        Returns: number
      }
      regenerate_invite_code: {
        Args: { p_campaign_id: string }
        Returns: string
      }
      resolve_pending_advance: {
        Args: { p_advance_id: string; p_changes: Json; p_resolution: Json }
        Returns: number
      }
      respond_to_challenge: {
        Args: { p_accept: boolean; p_match_id: string; p_warband_id: string }
        Returns: Database["public"]["Enums"]["match_state"]
      }
      return_battle_report: {
        Args: { p_note: string; p_report_id: string }
        Returns: Database["public"]["Enums"]["match_state"]
      }
      revert_battle_report: {
        Args: { p_report_id: string }
        Returns: undefined
      }
      save_battle_session: {
        Args: { p_live_state: Json; p_match_id: string; p_warband_id: string }
        Returns: string
      }
      schedule_match: {
        Args: {
          p_campaign_id: string
          p_custom_scenario_id?: string
          p_notes?: string
          p_scenario_rules_id?: string
          p_scheduled_for?: string
          p_warband_ids: string[]
        }
        Returns: string
      }
      start_match: {
        Args: {
          p_combat_mode?: Database["public"]["Enums"]["combat_mode"]
          p_match_id: string
        }
        Returns: Database["public"]["Enums"]["match_state"]
      }
      submit_battle_report: {
        Args: {
          p_amend_note?: string
          p_match_id: string
          p_report: Json
          p_warband_id: string
        }
        Returns: Database["public"]["Enums"]["match_state"]
      }
      transfer_warband: {
        Args: { p_new_owner: string; p_warband_id: string }
        Returns: undefined
      }
      update_roster: {
        Args: { p_changes: Json; p_reason: string; p_warband_id: string }
        Returns: number
      }
      withdraw_battle_report: {
        Args: { p_match_id: string; p_warband_id: string }
        Returns: Database["public"]["Enums"]["match_state"]
      }
    }
    Enums: {
      advance_subject: "hero" | "group"
      combat_mode: "app" | "players"
      item_holder: "stash" | "hero" | "group"
      match_origin: "gm" | "challenge" | "import"
      match_state:
        | "scheduled"
        | "in_progress"
        | "awaiting_reports"
        | "completed"
        | "cancelled"
      warrior_status: "active" | "dead" | "retired" | "captured" | "left"
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
      advance_subject: ["hero", "group"],
      combat_mode: ["app", "players"],
      item_holder: ["stash", "hero", "group"],
      match_origin: ["gm", "challenge", "import"],
      match_state: [
        "scheduled",
        "in_progress",
        "awaiting_reports",
        "completed",
        "cancelled",
      ],
      warrior_status: ["active", "dead", "retired", "captured", "left"],
    },
  },
} as const

