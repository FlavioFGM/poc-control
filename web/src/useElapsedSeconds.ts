import { useEffect, useState } from "react";

// Ticks off the record's own `created_at` (not component-mount time), so the counter stays
// correct across navigating away and back or a page refresh.
export function useElapsedSeconds(sinceIso: string | undefined): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!sinceIso) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sinceIso]);

  if (!sinceIso) return 0;
  const inicio = new Date(sinceIso).getTime();
  if (Number.isNaN(inicio)) return 0;
  return Math.max(0, Math.round((now - inicio) / 1000));
}

export function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
