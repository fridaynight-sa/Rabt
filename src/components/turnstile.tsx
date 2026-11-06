"use client";

import { useEffect, useRef } from "react";

// Cloudflare Turnstile: a light "are you human" check, usually with no puzzle.
// It adds a hidden field "captchaToken" to the form. Supabase checks that token
// on sign up, login and password reset (Authentication > Bot protection).

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * Shows the check when a site key is set (nothing in local development).
 * A token works once, so pass something that changes after each submit as `resetKey`.
 */
export function Turnstile({ resetKey }: { resetKey?: unknown }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let widgetId: string | undefined;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          language: "ar",
          "response-field-name": "captchaToken",
        });
      })
      .catch(() => {
        // The server reports a failed check with a clear message.
      });
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="min-h-[65px]" />;
}
