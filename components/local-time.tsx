"use client";

import { useEffect, useState } from "react";

// Renders "…" on both server and initial client paint, then swaps to the
// viewer's local time once mounted — avoids a hydration mismatch since the
// server has no reliable way to know the admin's browser timezone.
export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setText(new Date(iso).toLocaleString());
    const id = setTimeout(update, 0);
    return () => clearTimeout(id);
  }, [iso]);

  return <>{text ?? "…"}</>;
}
