"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toggleBookmarkAction } from "../actions";

export function BookmarkButton({
  contentId,
  initialBookmarked,
  size = 16,
  label = false,
}: {
  contentId: string;
  initialBookmarked: boolean;
  size?: number;
  label?: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const prev = bookmarked;
    setBookmarked(!prev); // optimistic
    startTransition(async () => {
      const result = await toggleBookmarkAction(contentId);
      if (result.error) {
        setBookmarked(prev); // rollback
        return;
      }
      setBookmarked(result.bookmarked);
    });
  }

  const Icon = bookmarked ? BookmarkCheck : Bookmark;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      className="inline-flex items-center gap-1.5 rounded-lg border-none bg-transparent"
      style={{
        color: bookmarked ? "var(--coral)" : "var(--text-tertiary)",
        cursor: pending ? "wait" : "pointer",
        padding: label ? "6px 10px" : 6,
        transition: "color 180ms",
      }}
    >
      <Icon size={size} fill={bookmarked ? "currentColor" : "none"} />
      {label && (
        <span className="text-[12.5px] font-semibold">
          {bookmarked ? "Bookmarked" : "Bookmark"}
        </span>
      )}
    </button>
  );
}
