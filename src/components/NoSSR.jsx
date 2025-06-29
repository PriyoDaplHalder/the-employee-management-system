"use client";

import { useIsClient } from "../hooks/useIsClient";

/**
 * NoSSR component that only renders children on the client-side
 * Useful for components that have client-only features that might cause hydration mismatches
 */
export default function NoSSR({ children, fallback = null }) {
  const isClient = useIsClient();

  if (!isClient) {
    return fallback;
  }

  return children;
}
