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
      focus_sessions: {
        Row: {
          actual_duration_sec: number | null
          background_seconds: number | null
          chapter: string | null
          completed_milestone_count: number | null
          created_at: string | null
          cross_app_category: string | null
          difficulty_rating: Database["public"]["Enums"]["difficulty_t"] | null
          ended_at: string | null
          id: string
          linked_task_id: string | null
          milestones: Json | null
          planned_duration_sec: number | null
          session_notes: string | null
          session_type: Database["public"]["Enums"]["focus_session_type_t"]
          started_at: string | null
          subject: Database["public"]["Enums"]["subject_t"] | null
          task_type: Database["public"]["Enums"]["task_type_t"] | null
          terminated_reason:
            | Database["public"]["Enums"]["focus_terminated_t"]
            | null
          timer_mode: Database["public"]["Enums"]["focus_timer_mode_t"]
          topic: string | null
          total_milestone_count: number | null
          user_id: string
        }
        Insert: {
          actual_duration_sec?: number | null
          background_seconds?: number | null
          chapter?: string | null
          completed_milestone_count?: number | null
          created_at?: string | null
          cross_app_category?: string | null
          difficulty_rating?: Database["public"]["Enums"]["difficulty_t"] | null
          ended_at?: string | null
          id?: string
          linked_task_id?: string | null
          milestones?: Json | null
          planned_duration_sec?: number | null
          session_notes?: string | null
          session_type?: Database["public"]["Enums"]["focus_session_type_t"]
          started_at?: string | null
          subject?: Database["public"]["Enums"]["subject_t"] | null
          task_type?: Database["public"]["Enums"]["task_type_t"] | null
          terminated_reason?:
            | Database["public"]["Enums"]["focus_terminated_t"]
            | null
          timer_mode?: Database["public"]["Enums"]["focus_timer_mode_t"]
          topic?: string | null
          total_milestone_count?: number | null
          user_id: string
        }
        Update: {
          actual_duration_sec?: number | null
          background_seconds?: number | null
          chapter?: string | null
          completed_milestone_count?: number | null
          created_at?: string | null
          cross_app_category?: string | null
          difficulty_rating?: Database["public"]["Enums"]["difficulty_t"] | null
          ended_at?: string | null
          id?: string
          linked_task_id?: string | null
          milestones?: Json | null
          planned_duration_sec?: number | null
          session_notes?: string | null
          session_type?: Database["public"]["Enums"]["focus_session_type_t"]
          started_at?: string | null
          subject?: Database["public"]["Enums"]["subject_t"] | null
          task_type?: Database["public"]["Enums"]["task_type_t"] | null
          terminated_reason?:
            | Database["public"]["Enums"]["focus_terminated_t"]
            | null
          timer_mode?: Database["public"]["Enums"]["focus_timer_mode_t"]
          topic?: string | null
          total_milestone_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_linked_task_id_fkey"
            columns: ["linked_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      library_bookmarks: {
        Row: {
          bookmarked_at: string | null
          content_id: string
          id: string
          user_id: string
        }
        Insert: {
          bookmarked_at?: string | null
          content_id: string
          id?: string
          user_id: string
        }
        Update: {
          bookmarked_at?: string | null
          content_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_bookmarks_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "library_content"
            referencedColumns: ["id"]
          },
        ]
      }
      library_content: {
        Row: {
          author: string | null
          chapter: string
          chapter_id: string | null
          content_json: Json | null
          created_at: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          last_updated: string | null
          page_count: number | null
          subject: Database["public"]["Enums"]["subject_t"]
          thumbnail_url: string | null
          title: string
          type: Database["public"]["Enums"]["library_type_t"]
        }
        Insert: {
          author?: string | null
          chapter: string
          chapter_id?: string | null
          content_json?: Json | null
          created_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          last_updated?: string | null
          page_count?: number | null
          subject: Database["public"]["Enums"]["subject_t"]
          thumbnail_url?: string | null
          title: string
          type: Database["public"]["Enums"]["library_type_t"]
        }
        Update: {
          author?: string | null
          chapter?: string
          chapter_id?: string | null
          content_json?: Json | null
          created_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          last_updated?: string | null
          page_count?: number | null
          subject?: Database["public"]["Enums"]["subject_t"]
          thumbnail_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["library_type_t"]
        }
        Relationships: [
          {
            foreignKeyName: "library_content_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      mistake_notebook_entries: {
        Row: {
          archived_at: string | null
          consecutive_easy_count: number | null
          correct_answer: string | null
          created_at: string | null
          cropped_image_url: string | null
          current_interval_days: number | null
          difficulty_rating: Database["public"]["Enums"]["difficulty_t"] | null
          entry_type: Database["public"]["Enums"]["notebook_entry_type_t"]
          first_wrong_at: string | null
          id: string
          last_reviewed_at: string | null
          mistake_tags: Database["public"]["Enums"]["mistake_tag_t"][] | null
          next_review_date: string
          question_id: string | null
          review_count: number | null
          source: Database["public"]["Enums"]["notebook_source_t"]
          student_answer: string | null
          student_note: string | null
          sub_topic: string | null
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          consecutive_easy_count?: number | null
          correct_answer?: string | null
          created_at?: string | null
          cropped_image_url?: string | null
          current_interval_days?: number | null
          difficulty_rating?: Database["public"]["Enums"]["difficulty_t"] | null
          entry_type?: Database["public"]["Enums"]["notebook_entry_type_t"]
          first_wrong_at?: string | null
          id?: string
          last_reviewed_at?: string | null
          mistake_tags?: Database["public"]["Enums"]["mistake_tag_t"][] | null
          next_review_date?: string
          question_id?: string | null
          review_count?: number | null
          source?: Database["public"]["Enums"]["notebook_source_t"]
          student_answer?: string | null
          student_note?: string | null
          sub_topic?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          consecutive_easy_count?: number | null
          correct_answer?: string | null
          created_at?: string | null
          cropped_image_url?: string | null
          current_interval_days?: number | null
          difficulty_rating?: Database["public"]["Enums"]["difficulty_t"] | null
          entry_type?: Database["public"]["Enums"]["notebook_entry_type_t"]
          first_wrong_at?: string | null
          id?: string
          last_reviewed_at?: string | null
          mistake_tags?: Database["public"]["Enums"]["mistake_tag_t"][] | null
          next_review_date?: string
          question_id?: string | null
          review_count?: number | null
          source?: Database["public"]["Enums"]["notebook_source_t"]
          student_answer?: string | null
          student_note?: string | null
          sub_topic?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mistake_notebook_entries_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          completed_at: string | null
          correct_count: number | null
          created_at: string | null
          filters: Json | null
          id: string
          marked_for_review_count: number | null
          mode: Database["public"]["Enums"]["practice_mode_t"]
          planned_duration_sec: number | null
          question_ids: string[] | null
          skipped_count: number | null
          started_at: string | null
          status:
            | Database["public"]["Enums"]["practice_session_status_t"]
            | null
          time_taken_sec: number | null
          total_questions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          correct_count?: number | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          marked_for_review_count?: number | null
          mode: Database["public"]["Enums"]["practice_mode_t"]
          planned_duration_sec?: number | null
          question_ids?: string[] | null
          skipped_count?: number | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["practice_session_status_t"]
            | null
          time_taken_sec?: number | null
          total_questions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_count?: number | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          marked_for_review_count?: number | null
          mode?: Database["public"]["Enums"]["practice_mode_t"]
          planned_duration_sec?: number | null
          question_ids?: string[] | null
          skipped_count?: number | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["practice_session_status_t"]
            | null
          time_taken_sec?: number | null
          total_questions?: number | null
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
      question_attempts: {
        Row: {
          attempted_at: string | null
          id: string
          is_correct: boolean | null
          marked_for_review: boolean | null
          mistake_tag: Database["public"]["Enums"]["mistake_tag_t"] | null
          question_id: string
          selected_answer: string | null
          session_id: string
          tagged_at: string | null
          time_spent_sec: number | null
          user_id: string
        }
        Insert: {
          attempted_at?: string | null
          id?: string
          is_correct?: boolean | null
          marked_for_review?: boolean | null
          mistake_tag?: Database["public"]["Enums"]["mistake_tag_t"] | null
          question_id: string
          selected_answer?: string | null
          session_id: string
          tagged_at?: string | null
          time_spent_sec?: number | null
          user_id: string
        }
        Update: {
          attempted_at?: string | null
          id?: string
          is_correct?: boolean | null
          marked_for_review?: boolean | null
          mistake_tag?: Database["public"]["Enums"]["mistake_tag_t"] | null
          question_id?: string
          selected_answer?: string | null
          session_id?: string
          tagged_at?: string | null
          time_spent_sec?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          chapter: string
          chapter_id: string | null
          concept_tags: string[] | null
          correct_answer: string
          created_at: string | null
          difficulty: Database["public"]["Enums"]["difficulty_t"]
          expected_time_seconds: number | null
          id: string
          jee_weightage: Database["public"]["Enums"]["jee_weightage_t"] | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          pyq_paper: string | null
          pyq_shift: string | null
          pyq_year: number | null
          question_image_url: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type_t"]
          solution_image_url: string | null
          solution_text: string | null
          source: Database["public"]["Enums"]["question_source_t"]
          sub_topic: string | null
          subject: Database["public"]["Enums"]["subject_t"]
          sum_time_taken_seconds: number | null
          syllabus_tag: Database["public"]["Enums"]["syllabus_tag_t"] | null
          times_attempted: number | null
          times_correct: number | null
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          chapter: string
          chapter_id?: string | null
          concept_tags?: string[] | null
          correct_answer: string
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_t"]
          expected_time_seconds?: number | null
          id?: string
          jee_weightage?: Database["public"]["Enums"]["jee_weightage_t"] | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          pyq_paper?: string | null
          pyq_shift?: string | null
          pyq_year?: number | null
          question_image_url?: string | null
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type_t"]
          solution_image_url?: string | null
          solution_text?: string | null
          source?: Database["public"]["Enums"]["question_source_t"]
          sub_topic?: string | null
          subject: Database["public"]["Enums"]["subject_t"]
          sum_time_taken_seconds?: number | null
          syllabus_tag?: Database["public"]["Enums"]["syllabus_tag_t"] | null
          times_attempted?: number | null
          times_correct?: number | null
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          chapter?: string
          chapter_id?: string | null
          concept_tags?: string[] | null
          correct_answer?: string
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_t"]
          expected_time_seconds?: number | null
          id?: string
          jee_weightage?: Database["public"]["Enums"]["jee_weightage_t"] | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          pyq_paper?: string | null
          pyq_shift?: string | null
          pyq_year?: number | null
          question_image_url?: string | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type_t"]
          solution_image_url?: string | null
          solution_text?: string | null
          source?: Database["public"]["Enums"]["question_source_t"]
          sub_topic?: string | null
          subject?: Database["public"]["Enums"]["subject_t"]
          sum_time_taken_seconds?: number | null
          syllabus_tag?: Database["public"]["Enums"]["syllabus_tag_t"] | null
          times_attempted?: number | null
          times_correct?: number | null
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
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
      difficulty_t: "easy" | "medium" | "hard" | "very_hard"
      focus_session_type_t: "plan_linked" | "quick_focus" | "cross_app"
      focus_terminated_t:
        | "completed"
        | "manual_end"
        | "timeout"
        | "crash"
        | "exceeded_5min_bg"
        | "phone_call"
      focus_timer_mode_t:
        | "stopwatch"
        | "pomodoro_25"
        | "pomodoro_45"
        | "pomodoro_60"
        | "custom"
      goal_type:
        | "jee_main"
        | "jee_adv"
        | "neet"
        | "cuet"
        | "jee_cuet"
        | "boards"
        | "other"
      jee_weightage_t: "high" | "medium" | "low"
      library_type_t: "notes" | "formulas" | "keypoints" | "concept_map"
      mistake_tag_t:
        | "silly_error"
        | "conceptual_gap"
        | "time_pressure"
        | "wild_guess"
      notebook_entry_type_t: "text_question" | "image_question"
      notebook_source_t: "practice" | "mock" | "revision"
      plan_reason_t:
        | "standard"
        | "regenerate"
        | "no_study_day"
        | "mock_day"
        | "recovery_week"
        | "bad_day_protocol"
      plan_status_t: "active" | "completed" | "abandoned"
      practice_mode_t:
        | "chapter"
        | "pyq"
        | "mistake_retest"
        | "mock"
        | "dpp"
        | "custom"
      practice_session_status_t: "active" | "completed" | "abandoned"
      question_source_t: "curated" | "jee_main_pyq" | "jee_advanced_pyq"
      question_type_t:
        | "single_correct"
        | "multiple_correct"
        | "integer"
        | "assertion_reason"
      recovery_end_reason_t:
        | "completed_7_days"
        | "student_ended"
        | "threshold_resolved"
      recovery_type_t: "backlog" | "burnout"
      subject_t: "physics" | "chemistry" | "maths" | "revision" | "wellness"
      syllabus_tag_t: "jee_main" | "jee_advanced" | "both"
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
      difficulty_t: ["easy", "medium", "hard", "very_hard"],
      focus_session_type_t: ["plan_linked", "quick_focus", "cross_app"],
      focus_terminated_t: [
        "completed",
        "manual_end",
        "timeout",
        "crash",
        "exceeded_5min_bg",
        "phone_call",
      ],
      focus_timer_mode_t: [
        "stopwatch",
        "pomodoro_25",
        "pomodoro_45",
        "pomodoro_60",
        "custom",
      ],
      goal_type: [
        "jee_main",
        "jee_adv",
        "neet",
        "cuet",
        "jee_cuet",
        "boards",
        "other",
      ],
      jee_weightage_t: ["high", "medium", "low"],
      library_type_t: ["notes", "formulas", "keypoints", "concept_map"],
      mistake_tag_t: [
        "silly_error",
        "conceptual_gap",
        "time_pressure",
        "wild_guess",
      ],
      notebook_entry_type_t: ["text_question", "image_question"],
      notebook_source_t: ["practice", "mock", "revision"],
      plan_reason_t: [
        "standard",
        "regenerate",
        "no_study_day",
        "mock_day",
        "recovery_week",
        "bad_day_protocol",
      ],
      plan_status_t: ["active", "completed", "abandoned"],
      practice_mode_t: [
        "chapter",
        "pyq",
        "mistake_retest",
        "mock",
        "dpp",
        "custom",
      ],
      practice_session_status_t: ["active", "completed", "abandoned"],
      question_source_t: ["curated", "jee_main_pyq", "jee_advanced_pyq"],
      question_type_t: [
        "single_correct",
        "multiple_correct",
        "integer",
        "assertion_reason",
      ],
      recovery_end_reason_t: [
        "completed_7_days",
        "student_ended",
        "threshold_resolved",
      ],
      recovery_type_t: ["backlog", "burnout"],
      subject_t: ["physics", "chemistry", "maths", "revision", "wellness"],
      syllabus_tag_t: ["jee_main", "jee_advanced", "both"],
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
