"use client";

import {
  DynamicEmbeddedWidget,
  useDynamicContext,
  useIsLoggedIn,
  useReinitialize,
} from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const authenticationLoadTimeoutMs = 10_000;

export function LoginPanel() {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();
  const reinitialize = useReinitialize();
  const { sdkHasLoaded } = useDynamicContext();
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (sdkHasLoaded && isLoggedIn) {
      router.replace("/profile");
    }
  }, [isLoggedIn, router, sdkHasLoaded]);

  useEffect(() => {
    if (sdkHasLoaded || isLoggedIn) {
      return;
    }

    const timeout = window.setTimeout(
      () => setShowRetry(true),
      authenticationLoadTimeoutMs,
    );

    return () => window.clearTimeout(timeout);
  }, [isLoggedIn, sdkHasLoaded]);

  return (
    <section
      aria-labelledby="login-heading"
      className="w-full max-w-md border border-line bg-white p-6 sm:p-8"
    >
      <h1
        className="mb-8 text-3xl font-semibold tracking-[-0.045em]"
        id="login-heading"
      >
        Log in
      </h1>
      {sdkHasLoaded && !isLoggedIn ? (
        <DynamicEmbeddedWidget />
      ) : (
        <div className="space-y-4">
          <p aria-live="polite" className="text-sm text-muted">
            {isLoggedIn ? "Opening wallet…" : "Loading…"}
          </p>
          {showRetry && !isLoggedIn ? (
            <div className="space-y-3 border-t border-line pt-4">
              <p className="text-sm text-muted">
                Authentication is taking longer than expected.
              </p>
              <button
                className="border border-ink px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
                onClick={reinitialize}
                type="button"
              >
                Retry authentication
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
