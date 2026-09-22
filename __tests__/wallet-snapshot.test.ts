import type { MidnightWallet } from "@dynamic-labs/midnight";
import { describe, expect, it, vi } from "vitest";

import {
  MidnightWalletSnapshotError,
  readMidnightWalletSnapshot,
} from "@/lib/midnight/wallet-snapshot";

const preview = {
  chainId: "preview-chain-from-sdk",
  isTestnet: true,
  key: "midnight-preview",
  name: "Midnight Preview",
  networkId: "preview-network-from-sdk",
  shortName: "Preview",
  vanityName: "Preview",
};

const mainnet = {
  chainId: "mainnet-chain-from-sdk",
  isTestnet: false,
  key: "midnight-mainnet",
  name: "Midnight Mainnet",
  networkId: "mainnet-network-from-sdk",
  shortName: "Mainnet",
};

function createWallet(
  overrides: Partial<{
    address: string | undefined;
    connected: boolean;
    dust: { balance: string; cap: string };
    dustSyncing: boolean | undefined;
    enabledNetworks: (typeof preview)[];
    initialNetwork: string | undefined;
    nightBalance: string | undefined;
    selectedNetwork: string | undefined;
  }> = {},
) {
  const getNetwork = vi
    .fn()
    .mockResolvedValueOnce(overrides.initialNetwork ?? mainnet.chainId)
    .mockResolvedValue(overrides.selectedNetwork ?? preview.chainId);
  const switchNetwork = vi.fn().mockResolvedValue(undefined);
  const getAddress = vi
    .fn()
    .mockResolvedValue(overrides.address ?? "test-midnight-address");
  const getFormattedBalances = vi.fn().mockResolvedValue({
    dustBalance: overrides.dust ?? { balance: "3.25", cap: "8" },
    dustSyncing: overrides.dustSyncing ?? false,
    shieldedTokenCount: 0,
    unshieldedBalance: overrides.nightBalance ?? "12.5",
  });
  const isConnected = vi.fn().mockResolvedValue(overrides.connected ?? true);

  const wallet = {
    connector: {
      getAddress,
      getEnabledNetworks: () => overrides.enabledNetworks ?? [mainnet, preview],
    },
    getFormattedBalances,
    getNetwork,
    isConnected,
    switchNetwork,
  } as unknown as MidnightWallet;

  return {
    getAddress,
    getFormattedBalances,
    getNetwork,
    isConnected,
    switchNetwork,
    wallet,
  };
}

describe("readMidnightWalletSnapshot", () => {
  it("selects Preview using the enabled network's real identifier", async () => {
    const { switchNetwork, wallet } = createWallet();

    const snapshot = await readMidnightWalletSnapshot(wallet);

    expect(switchNetwork).toHaveBeenCalledWith("preview-chain-from-sdk");
    expect(snapshot).toEqual({
      address: "test-midnight-address",
      connected: true,
      dustBalance: "3.25",
      dustCapacity: "8",
      dustSyncing: false,
      network: {
        chainId: "preview-chain-from-sdk",
        label: "Preview",
        networkId: "preview-network-from-sdk",
      },
      nightBalance: "12.5",
    });
  });

  it("reports non-sensitive read stages", async () => {
    const { wallet } = createWallet();
    const stages: string[] = [];

    await readMidnightWalletSnapshot(wallet, {
      onStage: (stage) => stages.push(stage),
    });

    expect(stages).toEqual([
      "checking-network",
      "selecting-network",
      "reading-address",
      "reading-balances",
    ]);
  });

  it("preserves real zero values", async () => {
    const { wallet } = createWallet({
      dust: { balance: "0", cap: "8" },
      initialNetwork: preview.networkId,
      nightBalance: "0",
    });

    await expect(readMidnightWalletSnapshot(wallet)).resolves.toMatchObject({
      dustBalance: "0",
      dustCapacity: "8",
      dustSyncing: false,
      nightBalance: "0",
    });
  });

  it("omits data that the wallet does not return", async () => {
    const { getAddress, getFormattedBalances, wallet } = createWallet({
      initialNetwork: preview.chainId,
    });
    getAddress.mockResolvedValueOnce(undefined);
    getFormattedBalances.mockRejectedValueOnce(new Error("not synced"));

    const snapshot = await readMidnightWalletSnapshot(wallet);

    expect(snapshot.address).toBeUndefined();
    expect(snapshot.nightBalance).toBeUndefined();
    expect(snapshot.dustBalance).toBeUndefined();
    expect(snapshot.dustCapacity).toBeUndefined();
  });

  it("does not expose DUST values while the wallet reports syncing", async () => {
    const { wallet } = createWallet({
      dust: { balance: "0", cap: "0" },
      dustSyncing: true,
      initialNetwork: preview.chainId,
    });

    const snapshot = await readMidnightWalletSnapshot(wallet);

    expect(snapshot.dustSyncing).toBe(true);
    expect(snapshot.dustBalance).toBeUndefined();
    expect(snapshot.dustCapacity).toBeUndefined();
  });

  it("omits a zero compatibility capacity after DUST has settled", async () => {
    const { wallet } = createWallet({
      dust: { balance: "3.25", cap: "0" },
      dustSyncing: false,
      initialNetwork: preview.chainId,
    });

    const snapshot = await readMidnightWalletSnapshot(wallet);

    expect(snapshot.dustBalance).toBe("3.25");
    expect(snapshot.dustCapacity).toBeUndefined();
  });

  it("fails explicitly when Preview is not enabled", async () => {
    const { wallet } = createWallet({
      enabledNetworks: [mainnet as typeof preview],
    });

    await expect(readMidnightWalletSnapshot(wallet)).rejects.toMatchObject({
      code: "PREVIEW_NOT_ENABLED",
      name: MidnightWalletSnapshotError.name,
    });
  });

  it("does not claim Preview when the wallet fails to switch", async () => {
    const { wallet } = createWallet({ selectedNetwork: mainnet.chainId });

    await expect(readMidnightWalletSnapshot(wallet)).rejects.toMatchObject({
      code: "PREVIEW_NOT_SELECTED",
    });
  });
});
