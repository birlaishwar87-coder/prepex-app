"use client";

import { useEffect, useRef } from "react";
import { track, type PrepexEvent } from "./mixpanel";

/**
 * Fires a Mixpanel event whenever a useFormState `state` object changes
 * to a non-error state. Initial state doesn't fire. Subsequent successful
 * submits do.
 *
 * Usage:
 *   const [state, action] = useFormState(myAction, { error: null });
 *   useTrackOnSuccess(state, "checkin_submitted", { response });
 */
export function useTrackOnSuccess(
  state: { error: string | null },
  event: PrepexEvent,
  props?: Record<string, unknown>
) {
  const prevStateRef = useRef(state);

  useEffect(() => {
    if (prevStateRef.current !== state && state.error === null) {
      track(event, props);
    }
    prevStateRef.current = state;
    // We intentionally don't include props in the dep array — they're a
    // snapshot at the time of submission, not a reactive value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, event]);
}
