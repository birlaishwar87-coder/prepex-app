"use client";

import { useEffect, useRef } from "react";
import { identify, initMixpanel } from "./mixpanel";

export function MixpanelProvider({
  children,
  userId,
  userProps,
}: {
  children: React.ReactNode;
  /** When set (signed-in surfaces), Mixpanel identifies this user on mount. */
  userId?: string | null;
  userProps?: Record<string, unknown>;
}) {
  const identifiedRef = useRef<string | null>(null);

  useEffect(() => {
    initMixpanel();
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (identifiedRef.current === userId) return;
    identify(userId, userProps);
    identifiedRef.current = userId;
  }, [userId, userProps]);

  return <>{children}</>;
}
