// ============================================================
// AUTO-GENERATED — do not edit by hand.
// Source: Supabase MCP `generate_typescript_types` against project
// pqjufzuljwiujvzlqdlf. Regenerate after every schema change.
// ============================================================
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
      backlog_items: {
        Row: {
          chapter: string | null
          chapter_id: string | null
          created_at: string | null
          estimated_minutes: number | null
          held_since: string | null
          id: string
          last_reviewed_at: string | null
          nudge_sent: boolean | null
          original_date: string
          priority: Database["public"]["Enums"]["backlog_priority_t"] | null
          source: string | null
          state: Database["public"]["Enums"]["backlog_state_t"] | null
          subject: Database["public"]["Enums"]["subject_t"]
          task_id: string | null
          task_type: Database["public"]["Enums"]["task_type_t"] | null
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter?: string | null
          chapter_id?: string | null
          created_at?: string | null
          estimated_minutes?: number | null
          held_since?: string | null
          id?: string
          last_reviewed_at?: string | null
          nudge_sent?: boolean | null
          original_date: string
          priority?: Database["public"]["Enums"]["backlog_priority_t"] | null
          source?: string | null
          state?: Database["public"]["Enums"]["backlog_state_t"] | null
          subject: Database["public"]["Enums"]["subject_t"]
          task_id?: string | null
          task_type?: Database["public"]["Enums"]["task_type_t"] | null
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter?: string | null
          chapter_id?: string | null
          created_at?: string | null
          estimated_minutes?: number | null
          held_since?: string | null
          id?: string
          last_reviewed_at?: string | null
          nudge_sent?: boolean | null
          original_date?: string
          priority?: Database["public"]["Enums"]["backlog_priority_t"] | null
          source?: string | null
          state?: Database["public"]["Enums"]["backlog_state_t"] | null
          subject?: Database["public"]["Enums"]["subject_t"]
          task_id?: string | null
          task_type?: Database["public"]["Enums"]["task_type_t"] | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_items_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlog_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      bad_day_protocols: {
        Row: {
          created_at: string | null
          id: string
          inactive_days: number | null
          plan_id: string | null
          triggered_at: string | null
          user_id: string
          welcome_seen: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inactive_days?: number | null
          plan_id?: string | null
          triggered_at?: string | null
          user_id: string
          welcome_seen?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inactive_days?: number | null
          plan_id?: string | null
          triggered_at?: string | null
          user_id?: string
          welcome_seen?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bad_day_protocols_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      burnout_signals: {
        Row: {
          detected_at: string | null
          id: string
          resolved: boolean | null
          resolved_at: string | null
          signal_data: Json | null
          signal_type: Database["public"]["Enums"]["burnout_signal_t"]
          tier_at_detection: number | null
          user_id: string
        }
        Insert: {
          detected_at?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          signal_data?: Json | null
          signal_type: Database["public"]["Enums"]["burnout_signal_t"]
          tier_at_detection?: number | null
          user_id: string
        }
        Update: {
          detected_at?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          signal_data?: Json | null
          signal_type?: Database["public"]["Enums"]["burnout_signal_t"]
          tier_at_detection?: number | null
          user_id?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          chapter_order: number | null
          created_at: string | null
          exams: string[] | null
          id: string
          name: string
          subject: Database["public"]["Enums"]["subject_t"]
        }
        Insert: {
          chapter_order?: number | null
          created_at?: string | null
          exams?: string[] | null
          id?: string
          name: string
          subject: Database["public"]["Enums"]["subject_t"]
        }
        Update: {
          chapter_order?: number | null
          created_at?: string | null
          exams?: string[] | null
          id?: string
          name?: string
          subject?: Database["public"]["Enums"]["subject_t"]
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          applied_to_plan_id: string | null
          checkin_date: string
          created_at: string | null
          id: string
          late_response: boolean | null
          note: string | null
          response: Database["public"]["Enums"]["checkin_response_t"] | null
          response_at: string | null
          skipped: boolean | null
          user_id: string
        }
        Insert: {
          applied_to_plan_id?: string | null
          checkin_date: string
          created_at?: string | null
          id?: string
          late_response?: boolean | null
          note?: string | null
          response?: Database["public"]["Enums"]["checkin_response_t"] | null
          response_at?: string | null
          skipped?: boolean | null
          user_id: string
        }
        Update: {
          applied_to_plan_id?: string | null
          checkin_date?: string
          created_at?: string | null
          id?: string
          late_response?: boolean | null
          note?: string | null
          response?: Database["public"]["Enums"]["checkin_response_t"] | null
          response_at?: string | null
          skipped?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkins_applied_to_plan_id_fkey"
            columns: ["applied_to_plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plan_regenerations: {
        Row: {
          id: string
          plan_id: string
          reason: string | null
          requested_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          plan_id: string
          reason?: string | null
          requested_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          plan_id?: string
          reason?: string | null
          requested_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_plan_regenerations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          cached_groq_response: Json | null
          completed_minutes: number | null
          completed_tasks: number | null
          created_at: string | null
          generated_at: string | null
          generation_reason: Database["public"]["Enums"]["plan_reason_t"] | null
          id: string
          plan_date: string
          regenerate_count: number | null
          status: Database["public"]["Enums"]["plan_status_t"] | null
          total_minutes: number | null
          total_tasks: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cached_groq_response?: Json | null
          completed_minutes?: number | null
          completed_tasks?: number | null
          created_at?: string | null
          generated_at?: string | null
          generation_reason?:
            | Database["public"]["Enums"]["plan_reason_t"]
            | null
          id?: string
          plan_date: string
          regenerate_count?: number | null
          status?: Database["public"]["Enums"]["plan_status_t"] | null
          total_minutes?: number | null
          total_tasks?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cached_groq_response?: Json | null
          completed_minutes?: number | null
          completed_tasks?: number | null
          created_at?: string | null
          generated_at?: string | null
          generation_reason?:
            | Database["public"]["Enums"]["plan_reason_t"]
            | null
          id?: string
          plan_date?: string
          regenerate_count?: number | null
          status?: Database["public"]["Enums"]["plan_status_t"] | null
          total_minutes?: number | null
          total_tasks?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          batch: string | null
          best_streak: number | null
          chronotype: Database["public"]["Enums"]["chronotype_t"] | null
          coach_type: Database["public"]["Enums"]["coach_type"] | null
          coaching_name: string | null
          created_at: string | null
          current_class: Database["public"]["Enums"]["class_type"] | null
          daily_hours_weekday: number | null
          daily_hours_weekend: number | null
          day_boundary_time: string | null
          exam_date: string | null
          first_name: string | null
          goal: Database["public"]["Enums"]["goal_type"] | null
          id: string
          last_active_at: string | null
          onboarding_completed_at: string | null
          onboarding_current_step: number | null
          phone: string | null
          same_daily_target: boolean | null
          streak_count: number | null
          streak_freezes_available: number | null
          time_windows: Database["public"]["Enums"]["time_window_t"][] | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          batch?: string | null
          best_streak?: number | null
          chronotype?: Database["public"]["Enums"]["chronotype_t"] | null
          coach_type?: Database["public"]["Enums"]["coach_type"] | null
          coaching_name?: string | null
          created_at?: string | null
          current_class?: Database["public"]["Enums"]["class_type"] | null
          daily_hours_weekday?: number | null
          daily_hours_weekend?: number | null
          day_boundary_time?: string | null
          exam_date?: string | null
          first_name?: string | null
          goal?: Database["public"]["Enums"]["goal_type"] | null
          id: string
          last_active_at?: string | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: number | null
          phone?: string | null
          same_daily_target?: boolean | null
          streak_count?: number | null
          streak_freezes_available?: number | null
          time_windows?: Database["public"]["Enums"]["time_window_t"][] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          batch?: string | null
          best_streak?: number | null
          chronotype?: Database["public"]["Enums"]["chronotype_t"] | null
          coach_type?: Database["public"]["Enums"]["coach_type"] | null
          coaching_name?: string | null
          created_at?: string | null
          current_class?: Database["public"]["Enums"]["class_type"] | null
          daily_hours_weekday?: number | null
          daily_hours_weekend?: number | null
          day_boundary_time?: string | null
          exam_date?: string | null
          first_name?: string | null
          goal?: Database["public"]["Enums"]["goal_type"] | null
          id?: string
          last_active_at?: string | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: number | null
          phone?: string | null
          same_daily_target?: boolean | null
          streak_count?: number | null
          streak_freezes_available?: number | null
          time_windows?: Database["public"]["Enums"]["time_window_t"][] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recovery_modes: {
        Row: {
          active: boolean | null
          created_at: string | null
          duration_days: number | null
          end_reason:
            | Database["public"]["Enums"]["recovery_end_reason_t"]
            | null
          ended_at: string | null
          id: string
          started_at: string | null
          type: Database["public"]["Enums"]["recovery_type_t"]
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          duration_days?: number | null
          end_reason?:
            | Database["public"]["Enums"]["recovery_end_reason_t"]
            | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          type: Database["public"]["Enums"]["recovery_type_t"]
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          duration_days?: number | null
          end_reason?:
            | Database["public"]["Enums"]["recovery_end_reason_t"]
            | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          type?: Database["public"]["Enums"]["recovery_type_t"]
          user_id?: string
        }
        Relationships: []
      }
      revision_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          difficulty_rating: Database["public"]["Enums"]["difficulty_t"] | null
          duration_seconds: number | null
          id: string
          skipped: boolean | null
          task_id: string | null
          topic_state_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          difficulty_rating?: Database["public"]["Enums"]["difficulty_t"] | null
          duration_seconds?: number | null
          id?: string
          skipped?: boolean | null
          task_id?: string | null
          topic_state_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          difficulty_rating?: Database["public"]["Enums"]["difficulty_t"] | null
          duration_seconds?: number | null
          id?: string
          skipped?: boolean | null
          task_id?: string | null
          topic_state_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_sessions_topic_state_id_fkey"
            columns: ["topic_state_id"]
            isOneToOne: false
            referencedRelation: "user_topic_state"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          chapter: string | null
          chapter_id: string | null
          completed_at: string | null
          created_at: string | null
          difficulty_rating: Database["public"]["Enums"]["difficulty_t"] | null
          estimated_minutes: number
          focus_minutes_actual: number | null
          id: string
          is_anchor: boolean | null
          is_backlog: boolean | null
          is_custom: boolean | null
          plan_id: string | null
          resource_link_ids: string[] | null
          source: string | null
          specific_time: string | null
          status: Database["public"]["Enums"]["task_status_t"] | null
          sub_topic: string | null
          subject: Database["public"]["Enums"]["subject_t"]
          task_order: number | null
          task_type: Database["public"]["Enums"]["task_type_t"]
          time_window: Database["public"]["Enums"]["time_window_t"] | null
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter?: string | null
          chapter_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          difficulty_rating?: Database["public"]["Enums"]["difficulty_t"] | null
          estimated_minutes: number
          focus_minutes_actual?: number | null
          id?: string
          is_anchor?: boolean | null
          is_backlog?: boolean | null
          is_custom?: boolean | null
          plan_id?: string | null
          resource_link_ids?: string[] | null
          source?: string | null
          specific_time?: string | null
          status?: Database["public"]["Enums"]["task_status_t"] | null
          sub_topic?: string | null
          subject: Database["public"]["Enums"]["subject_t"]
          task_order?: number | null
          task_type: Database["public"]["Enums"]["task_type_t"]
          time_window?: Database["public"]["Enums"]["time_window_t"] | null
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter?: string | null
          chapter_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          difficulty_rating?: Database["public"]["Enums"]["difficulty_t"] | null
          estimated_minutes?: number
          focus_minutes_actual?: number | null
          id?: string
          is_anchor?: boolean | null
          is_backlog?: boolean | null
          is_custom?: boolean | null
          plan_id?: string | null
          resource_link_ids?: string[] | null
          source?: string | null
          specific_time?: string | null
          status?: Database["public"]["Enums"]["task_status_t"] | null
          sub_topic?: string | null
          subject?: Database["public"]["Enums"]["subject_t"]
          task_order?: number | null
          task_type?: Database["public"]["Enums"]["task_type_t"]
          time_window?: Database["public"]["Enums"]["time_window_t"] | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_topic_state: {
        Row: {
          chapter_id: string
          created_at: string | null
          current_interval_days: number | null
          difficulty_history: Json | null
          first_studied_at: string | null
          id: string
          last_revised_at: string | null
          latest_difficulty_rating:
            | Database["public"]["Enums"]["difficulty_t"]
            | null
          next_revision_due: string | null
          onboarding_marked: boolean | null
          phase: Database["public"]["Enums"]["topic_phase_t"]
          revision_count: number | null
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          current_interval_days?: number | null
          difficulty_history?: Json | null
          first_studied_at?: string | null
          id?: string
          last_revised_at?: string | null
          latest_difficulty_rating?:
            | Database["public"]["Enums"]["difficulty_t"]
            | null
          next_revision_due?: string | null
          onboarding_marked?: boolean | null
          phase?: Database["public"]["Enums"]["topic_phase_t"]
          revision_count?: number | null
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          current_interval_days?: number | null
          difficulty_history?: Json | null
          first_studied_at?: string | null
          id?: string
          last_revised_at?: string | null
          latest_difficulty_rating?:
            | Database["public"]["Enums"]["difficulty_t"]
            | null
          next_revision_due?: string | null
          onboarding_marked?: boolean | null
          phase?: Database["public"]["Enums"]["topic_phase_t"]
          revision_count?: number | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_topic_state_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      backlog_priority_t: "urgent" | "normal" | "low"
      backlog_state_t: "active" | "held" | "user_added" | "redistributed"
      burnout_signal_t:
        | "consecutive_drained"
        | "tasks_skipped"
        | "focus_decline"
        | "app_open_decline"
        | "mock_decline"
        | "hard_rating_spike"
      checkin_response_t: "drained" | "heavy" | "steady" | "good" | "strong"
      chronotype_t: "day" | "mixed" | "night"
      class_type: "class_11" | "class_12" | "dropper_1" | "dropper_2" | "other"
      coach_type: "yes" | "self" | "online"
      difficulty_t: "easy" | "medium" | "hard"
      goal_type:
        | "jee_main"
        | "jee_adv"
        | "neet"
        | "cuet"
        | "jee_cuet"
        | "boards"
        | "other"
      plan_reason_t:
        | "standard"
        | "regenerate"
        | "no_study_day"
        | "mock_day"
        | "recovery_week"
        | "bad_day_protocol"
      plan_status_t: "active" | "completed" | "abandoned"
      recovery_end_reason_t:
        | "completed_7_days"
        | "student_ended"
        | "threshold_resolved"
      recovery_type_t: "backlog" | "burnout"
      subject_t: "physics" | "chemistry" | "maths" | "revision" | "wellness"
      task_status_t: "pending" | "completed" | "skipped" | "removed"
      task_type_t:
        | "new_learning"
        | "revision"
        | "practice"
        | "dpp"
        | "mock_review"
        | "wellness"
      time_window_t: "morning" | "midday" | "evening" | "night" | "anytime"
      topic_phase_t: "not_started" | "in_revision" | "mastered"
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
      backlog_priority_t: ["urgent", "normal", "low"],
      backlog_state_t: ["active", "held", "user_added", "redistributed"],
      burnout_signal_t: [
        "consecutive_drained",
        "tasks_skipped",
        "focus_decline",
        "app_open_decline",
        "mock_decline",
        "hard_rating_spike",
      ],
      checkin_response_t: ["drained", "heavy", "steady", "good", "strong"],
      chronotype_t: ["day", "mixed", "night"],
      class_type: ["class_11", "class_12", "dropper_1", "dropper_2", "other"],
      coach_type: ["yes", "self", "online"],
      difficulty_t: ["easy", "medium", "hard"],
      goal_type: [
        "jee_main",
        "jee_adv",
        "neet",
        "cuet",
        "jee_cuet",
        "boards",
        "other",
      ],
      plan_reason_t: [
        "standard",
        "regenerate",
        "no_study_day",
        "mock_day",
        "recovery_week",
        "bad_day_protocol",
      ],
      plan_status_t: ["active", "completed", "abandoned"],
      recovery_end_reason_t: [
        "completed_7_days",
        "student_ended",
        "threshold_resolved",
      ],
      recovery_type_t: ["backlog", "burnout"],
      subject_t: ["physics", "chemistry", "maths", "revision", "wellness"],
      task_status_t: ["pending", "completed", "skipped", "removed"],
      task_type_t: [
        "new_learning",
        "revision",
        "practice",
        "dpp",
        "mock_review",
        "wellness",
      ],
      time_window_t: ["morning", "midday", "evening", "night", "anytime"],
      topic_phase_t: ["not_started", "in_revision", "mastered"],
    },
  },
} as const
