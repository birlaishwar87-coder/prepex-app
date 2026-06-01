-- ============================================================
-- Phase 2b · Migration 7/7
-- RLS policies for all 7 new tables
-- ============================================================

-- Enable RLS on every new table
ALTER TABLE public.questions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_notebook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_content          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_bookmarks        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Global content (read-only via authenticated; writes via service_role)
-- ============================================================
CREATE POLICY questions_select_all
  ON public.questions FOR SELECT TO authenticated USING (true);

CREATE POLICY library_content_select_all
  ON public.library_content FOR SELECT TO authenticated USING (true);

-- ============================================================
-- practice_sessions
-- ============================================================
CREATE POLICY ps_select_own
  ON public.practice_sessions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY ps_insert_own
  ON public.practice_sessions FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY ps_update_own
  ON public.practice_sessions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
-- No DELETE policy — sessions are history.

-- ============================================================
-- question_attempts
-- ============================================================
CREATE POLICY qa_select_own
  ON public.question_attempts FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY qa_insert_own
  ON public.question_attempts FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY qa_update_own
  ON public.question_attempts FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
-- UPDATE allowed so students can tag a mistake post-session.

-- ============================================================
-- mistake_notebook_entries
-- ============================================================
CREATE POLICY mne_select_own
  ON public.mistake_notebook_entries FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY mne_insert_own
  ON public.mistake_notebook_entries FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY mne_update_own
  ON public.mistake_notebook_entries FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
-- DELETE allowed — students can permanently dismiss an entry.
CREATE POLICY mne_delete_own
  ON public.mistake_notebook_entries FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- focus_sessions
-- ============================================================
CREATE POLICY fs_select_own
  ON public.focus_sessions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY fs_insert_own
  ON public.focus_sessions FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY fs_update_own
  ON public.focus_sessions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
-- No DELETE — sessions are history (feed Effort Score).

-- ============================================================
-- library_bookmarks
-- ============================================================
CREATE POLICY lb_select_own
  ON public.library_bookmarks FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY lb_insert_own
  ON public.library_bookmarks FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY lb_delete_own
  ON public.library_bookmarks FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
