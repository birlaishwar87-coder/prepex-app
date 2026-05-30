"use client";

import { useEffect, useRef } from "react";
import { track } from "./mixpanel";
import type { PrepexEvent } from "./mixpanel";

/**
 * Renders nothing. Fires a single Mixpanel event when mounted with a
 * given key. Useful when a server-rendered page wants to record an event
 * exactly once (e.g. bad_day_protocol_triggered shown on /today).
 *
 * The `dedupKey` is stored in sessionStorage so the event doesn't re-fire
 * on a page revalidation in the same session.
 */
export function TrackOnce({
  event,
  props,
  dedupKey,
}: {
  event: PrepexEvent;
  props?: Record<string, unknown>;
  /** Unique per-occurrence key. Same key = won't refire in this session. */
  dedupKey: string;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (typeof window === "undefined") return;

    const sessionKey = `prepex:track:${dedupKey}`;
    try {
      if (window.sessionStorage.getItem(sessionKey)) return;
      window.sessionStorage.setItem(sessionKey, "1");
    } catch {
      // sessionStorage might be unavailable (private mode). Fire anyway.
    }
    track(event, props);
    firedRef.current = true;
  }, [event, props, dedupKey]);

  return null;
}
