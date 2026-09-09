"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const IDLE_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "wheel", "touchstart"] as const;

/**
 * Signs the user out and sends them back to the public landing page after
 * 30 minutes with no mouse/keyboard/touch activity anywhere in the app.
 */
export function IdleLogout() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function handleIdle() {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    }

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleIdle, IDLE_MS);
    }

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true }),
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [router]);

  return null;
}
