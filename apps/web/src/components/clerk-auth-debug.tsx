"use client";

import { useEffect, useState } from "react";

/**
 * Logs URL search params on sign-in/sign-up pages so we can see OAuth redirect
 * errors (e.g. from Google). Clerk often redirects back with error params.
 * Add ?debug=1 to the URL to show the debug panel on the page (otherwise console only).
 */
export function ClerkAuthDebug() {
  const [mounted, setMounted] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const showDebugPanel = params.get("debug") === "1";
    const entries: Record<string, string> = {};
    params.forEach((value, key) => {
      entries[key] = value;
    });

    // Always log so you can see in browser DevTools → Console
    console.log("[Clerk Auth] URL search params:", entries);

    const hasError =
      params.has("error") ||
      params.has("error_description") ||
      params.has("__clerk_error") ||
      params.has("__clerk_status");

    if (hasError) {
      console.warn("[Clerk Auth] OAuth/error params detected:", entries);
      setShowPanel(true);
    } else if (showDebugPanel) {
      setShowPanel(true);
    }
  }, [mounted]);

  if (!mounted || !showPanel) return null;

  const params =
    typeof window !== "undefined"
      ? Object.fromEntries(new URLSearchParams(window.location.search))
      : {};

  return (
    <div
      className="mx-auto max-w-2xl rounded border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900 shadow-sm"
      style={{ marginBottom: "1rem" }}
    >
      <div className="font-semibold">Clerk auth debug (check browser console for [Clerk Auth] logs)</div>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all">
        {JSON.stringify(params, null, 2)}
      </pre>
      <p className="mt-2 text-xs text-amber-700">
        If SSO failed: copy the error/error_description above and check Clerk Dashboard → Logs, and
        Google Cloud Console → OAuth redirect URI matches Clerk exactly.
      </p>
    </div>
  );
}
