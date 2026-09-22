import type { MidnightWallet } from "@dynamic-labs/midnight";

type EnabledNetwork = {
  chainId: number | string;
  isTestnet?: boolean;
  key?: string;
  name: string;
  networkId: number | string;
  shortName?: string;
  vanityName?: string;
};

export type MidnightWalletSnapshot = {
  address?: string;
  connected?: boolean;
  dustBalance?: string;
  dustCapacity?: string;
  dustSyncing?: boolean;
  network: {
    chainId: string;
    label: string;
    networkId: string;
  };
  nightBalance?: string;
};

export type MidnightWalletReadStage =
  | "checking-network"
  | "reading-address"
  | "reading-balances"
  | "selecting-network";

type ReadSnapshotOptions = {
  onStage?: (stage: MidnightWalletReadStage) => void;
};

export class MidnightWalletSnapshotError extends Error {
  constructor(
    message: string,
    readonly code: "PREVIEW_NOT_ENABLED" | "PREVIEW_NOT_SELECTED",
  ) {
    super(message);
    this.name = "MidnightWalletSnapshotError";
  }
}

export async function readMidnightWalletSnapshot(
  wallet: MidnightWallet,
  options: ReadSnapshotOptions = {},
): Promise<MidnightWalletSnapshot> {
  options.onStage?.("checking-network");
  const enabledNetworks = wallet.connector.getEnabledNetworks();
  const preview = enabledNetworks.find(isPreviewNetwork);

  if (!preview) {
    throw new MidnightWalletSnapshotError(
      "Preview is not enabled for this wallet.",
      "PREVIEW_NOT_ENABLED",
    );
  }

  let selectedNetworkId = await wallet.getNetwork();

  if (!networkMatches(preview, selectedNetworkId)) {
    options.onStage?.("selecting-network");
    await wallet.switchNetwork(preview.chainId);
    selectedNetworkId = await wallet.getNetwork();
  }

  const selectedNetwork = enabledNetworks.find((network) =>
    networkMatches(network, selectedNetworkId),
  );

  if (!selectedNetwork || !sameNetwork(selectedNetwork, preview)) {
    throw new MidnightWalletSnapshotError(
      "The wallet did not select Preview.",
      "PREVIEW_NOT_SELECTED",
    );
  }

  options.onStage?.("reading-address");
  const [address, connected] = await Promise.allSettled([
    wallet.connector.getAddress(),
    wallet.isConnected(),
  ]);

  // Dynamic exposes NIGHT, DUST, and DUST synchronisation in one aggregate
  // call. Keeping it separate from the address read makes slow balance
  // synchronisation observable without guessing at its underlying cause.
  options.onStage?.("reading-balances");
  const [balances] = await Promise.allSettled([wallet.getFormattedBalances()]);

  const balanceValues = fulfilledValue(balances);
  const dustIsSettled = balanceValues?.dustSyncing === false;
  const dustValue = dustIsSettled ? balanceValues.dustBalance : undefined;
  const dustCapacity = nonEmptyString(dustValue?.cap);

  return {
    address: nonEmptyString(fulfilledValue(address)),
    connected: fulfilledValue(connected),
    dustBalance: nonEmptyString(dustValue?.balance),
    // Current wallet-client builds can supply a compatibility cap of zero.
    // Until a non-zero cap is returned, there is no evidence that capacity is
    // a settled ledger value rather than that compatibility fallback.
    dustCapacity:
      dustCapacity && !isZeroAmount(dustCapacity) ? dustCapacity : undefined,
    dustSyncing: balanceValues?.dustSyncing,
    network: {
      chainId: String(selectedNetwork.chainId),
      label:
        nonEmptyString(selectedNetwork.vanityName) ??
        nonEmptyString(selectedNetwork.name) ??
        "Preview",
      networkId: String(selectedNetwork.networkId),
    },
    nightBalance: nonEmptyString(balanceValues?.unshieldedBalance),
  };
}

function fulfilledValue<T>(result: PromiseSettledResult<T>): T | undefined {
  return result.status === "fulfilled" ? result.value : undefined;
}

function isPreviewNetwork(network: EnabledNetwork): boolean {
  const names = [
    network.key,
    network.name,
    network.shortName,
    network.vanityName,
  ];

  return (
    network.isTestnet === true &&
    names.some((value) => value?.trim().toLowerCase().includes("preview"))
  );
}

function networkMatches(
  network: EnabledNetwork,
  selectedNetworkId: number | string | undefined,
): boolean {
  if (selectedNetworkId === undefined) {
    return false;
  }

  const selected = String(selectedNetworkId);
  return (
    String(network.chainId) === selected ||
    String(network.networkId) === selected
  );
}

function sameNetwork(left: EnabledNetwork, right: EnabledNetwork): boolean {
  return (
    String(left.chainId) === String(right.chainId) &&
    String(left.networkId) === String(right.networkId)
  );
}

function nonEmptyString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isZeroAmount(value: string): boolean {
  return /^0(?:\.0+)?$/.test(value);
}
