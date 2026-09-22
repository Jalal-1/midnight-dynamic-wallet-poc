"use client";

import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWaasMidnightConnectors } from "@dynamic-labs/midnight";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";

import type { PublicConfig } from "@/lib/config/public-env";

type DynamicProviderProps = PropsWithChildren<{
  config: PublicConfig;
}>;

export function DynamicProvider({ children, config }: DynamicProviderProps) {
  const router = useRouter();
  const profileUrl = new URL("/profile", config.appUrl).toString();

  return (
    <DynamicContextProvider
      settings={{
        appName: "Midnight",
        environmentId: config.dynamicEnvironmentId,
        events: {
          onAuthSuccess: () => router.replace("/profile"),
          onLogout: () => router.replace("/"),
        },
        redirectUrl: profileUrl,
        social: { strategy: "popup" },
        // Register both connector families for multi-chain Dynamic environments.
        // The profile explicitly selects Midnight and never falls back to EVM.
        walletConnectors: [
          EthereumWalletConnectors,
          DynamicWaasMidnightConnectors,
        ],
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
