"use client";

import {
  DynamicEmbeddedWidget,
  useDynamicContext,
  useIsLoggedIn,
} from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LoginPanel() {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();
  const { sdkHasLoaded } = useDynamicContext();

  useEffect(() => {
    if (sdkHasLoaded && isLoggedIn) {
      router.replace("/profile");
    }
  }, [isLoggedIn, router, sdkHasLoaded]);

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
        <p aria-live="polite" className="text-sm text-muted">
          {isLoggedIn ? "Opening wallet…" : "Loading…"}
        </p>
      )}
    </section>
  );
}
