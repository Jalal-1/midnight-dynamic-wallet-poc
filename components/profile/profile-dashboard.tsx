"use client";

import { isMidnightWallet, type MidnightWallet } from "@dynamic-labs/midnight";
import {
  useDynamicContext,
  useIsLoggedIn,
  useUserWallets,
} from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import {
  MidnightWalletSnapshotError,
  readMidnightWalletSnapshot,
  type MidnightWalletReadStage,
  type MidnightWalletSnapshot,
} from "@/lib/midnight/wallet-snapshot";

const READ_STAGE_LABELS: Record<MidnightWalletReadStage, string> = {
  "checking-network": "Checking Preview…",
  "reading-address": "Reading address…",
  "reading-balances": "Reading NIGHT and DUST…",
  "selecting-network": "Selecting Preview…",
};

type SnapshotState =
  | { status: "idle" | "loading" }
  | { message: string; status: "error"; wallet: MidnightWallet }
  | {
      snapshot: MidnightWalletSnapshot;
      status: "ready";
      wallet: MidnightWallet;
    };

export function ProfileDashboard() {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();
  const wallets = useUserWallets();
  const { handleLogOut, sdkHasLoaded } = useDynamicContext();
  const midnightWallet = wallets.find(isMidnightWallet);
  const [snapshotState, setSnapshotState] = useState<SnapshotState>({
    status: "idle",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string>();
  const [readStage, setReadStage] =
    useState<MidnightWalletReadStage>("checking-network");

  useEffect(() => {
    if (sdkHasLoaded && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, router, sdkHasLoaded]);

  useEffect(() => {
    if (!sdkHasLoaded || !isLoggedIn || !midnightWallet) {
      return;
    }

    let active = true;

    // Start from a microtask so progress callbacks never synchronously update
    // React state from the effect body.
    Promise.resolve()
      .then(() =>
        readMidnightWalletSnapshot(midnightWallet, {
          onStage: (stage) => {
            if (active) {
              setReadStage(stage);
            }
          },
        }),
      )
      .then((snapshot) => {
        if (active) {
          setSnapshotState({
            snapshot,
            status: "ready",
            wallet: midnightWallet,
          });
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        const message =
          error instanceof MidnightWalletSnapshotError
            ? error.message
            : "Wallet data is unavailable.";
        setSnapshotState({
          message,
          status: "error",
          wallet: midnightWallet,
        });
      });

    return () => {
      active = false;
    };
  }, [isLoggedIn, midnightWallet, refreshKey, sdkHasLoaded]);

  useEffect(() => {
    if (
      snapshotState.status !== "ready" ||
      snapshotState.wallet !== midnightWallet ||
      snapshotState.snapshot.dustSyncing !== true
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRefreshKey((key) => key + 1);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [midnightWallet, snapshotState]);

  const signOut = useCallback(async () => {
    setSignOutError(undefined);
    setIsSigningOut(true);
    try {
      await handleLogOut();
    } catch {
      setSignOutError("Sign out failed.");
    } finally {
      setIsSigningOut(false);
    }
  }, [handleLogOut]);

  if (!sdkHasLoaded) {
    return <LoadingProfile label="Loading session…" />;
  }

  if (!isLoggedIn) {
    return <LoadingProfile label="Opening login…" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader
        action={
          <button
            className="header-action disabled:cursor-wait disabled:opacity-50"
            disabled={isSigningOut}
            onClick={signOut}
            type="button"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        }
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-12 sm:px-8 sm:py-18">
        <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          Wallet
        </h1>
        {signOutError ? (
          <p className="mt-6 text-sm text-red-700" role="alert">
            {signOutError}
          </p>
        ) : null}

        {!midnightWallet ? (
          <StatusMessage key="preparing-wallet">
            Midnight wallet not yet available.
          </StatusMessage>
        ) : snapshotState.status === "ready" &&
          snapshotState.wallet === midnightWallet ? (
          <WalletFacts snapshot={snapshotState.snapshot} />
        ) : snapshotState.status === "error" &&
          snapshotState.wallet === midnightWallet ? (
          <div className="mt-16 border-t border-line pt-6" role="alert">
            <p className="text-sm text-muted">{snapshotState.message}</p>
            <button
              className="mt-5 text-sm font-medium text-accent underline decoration-accent/35 underline-offset-4"
              onClick={() => {
                setSnapshotState({ status: "loading" });
                setRefreshKey((key) => key + 1);
              }}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : (
          <StatusMessage key={readStage}>
            {READ_STAGE_LABELS[readStage]}
          </StatusMessage>
        )}
      </main>
    </div>
  );
}

function LoadingProfile({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <ElapsedLabel label={label} />
    </div>
  );
}

function StatusMessage({ children }: { children: string }) {
  return (
    <div className="mt-16 border-t border-line pt-6">
      <ElapsedLabel label={children} />
    </div>
  );
}

function ElapsedLabel({ label }: { label: string }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <p
      aria-live="polite"
      className="flex items-baseline gap-3 text-sm text-muted"
      data-stage={label}
    >
      <span>{label}</span>
      {elapsedSeconds > 0 ? (
        <span aria-label={`${elapsedSeconds} seconds elapsed`}>
          {elapsedSeconds}s
        </span>
      ) : null}
    </p>
  );
}

function WalletFacts({ snapshot }: { snapshot: MidnightWalletSnapshot }) {
  const facts = [
    { label: "Network", value: snapshot.network.label },
    snapshot.address
      ? { label: "Unshielded address", value: snapshot.address }
      : undefined,
    snapshot.nightBalance
      ? { label: "NIGHT balance", unit: "NIGHT", value: snapshot.nightBalance }
      : undefined,
    snapshot.dustBalance
      ? { label: "DUST balance", unit: "DUST", value: snapshot.dustBalance }
      : undefined,
    snapshot.dustCapacity
      ? { label: "DUST capacity", unit: "DUST", value: snapshot.dustCapacity }
      : undefined,
    snapshot.dustSyncing === true
      ? { label: "DUST status", value: "Syncing" }
      : undefined,
    snapshot.connected === undefined
      ? undefined
      : {
          label: "Status",
          value: snapshot.connected ? "Connected" : "Disconnected",
        },
  ].filter((fact) => fact !== undefined);

  return (
    <dl className="mt-12 grid border-t border-l border-line sm:grid-cols-2">
      {facts.map((fact) => (
        <div
          className="min-h-36 border-r border-b border-line p-5 sm:p-6"
          key={fact.label}
        >
          <dt className="text-xs font-medium tracking-[0.11em] text-muted uppercase">
            {fact.label}
          </dt>
          <dd className="mt-8 flex items-baseline gap-2 break-all text-xl font-medium tracking-[-0.025em] sm:text-2xl">
            <span>{fact.value}</span>
            {fact.unit ? (
              <span className="text-xs tracking-normal text-muted">
                {fact.unit}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
