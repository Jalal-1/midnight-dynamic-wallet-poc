import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handleLogOut: vi.fn().mockResolvedValue(undefined),
  isLoggedIn: true,
  readSnapshot: vi.fn(),
  replace: vi.fn(),
  sdkHasLoaded: true,
  wallets: [] as { chain: string }[],
}));

vi.mock("@dynamic-labs/midnight", () => ({
  isMidnightWallet: (wallet: { chain?: string }) => wallet.chain === "MIDNIGHT",
}));

vi.mock("@dynamic-labs/sdk-react-core", () => ({
  useDynamicContext: () => ({
    handleLogOut: mocks.handleLogOut,
    sdkHasLoaded: mocks.sdkHasLoaded,
  }),
  useIsLoggedIn: () => mocks.isLoggedIn,
  useUserWallets: () => mocks.wallets,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/lib/midnight/wallet-snapshot", () => ({
  MidnightWalletSnapshotError: class MidnightWalletSnapshotError extends Error {},
  readMidnightWalletSnapshot: mocks.readSnapshot,
}));

import { ProfileDashboard } from "@/components/profile/profile-dashboard";

describe("ProfileDashboard", () => {
  beforeEach(() => {
    mocks.handleLogOut.mockReset().mockResolvedValue(undefined);
    mocks.isLoggedIn = true;
    mocks.readSnapshot.mockReset().mockResolvedValue({
      address: "test-midnight-address",
      connected: true,
      dustBalance: "1.2",
      dustCapacity: "5",
      dustSyncing: false,
      network: {
        chainId: "preview-chain",
        label: "Preview",
        networkId: "preview-network",
      },
      nightBalance: "7",
    });
    mocks.replace.mockReset();
    mocks.sdkHasLoaded = true;
    mocks.wallets = [{ chain: "MIDNIGHT" }];
  });

  it("redirects an unauthenticated visitor to login", async () => {
    mocks.isLoggedIn = false;
    mocks.wallets = [];

    render(<ProfileDashboard />);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("heading", { name: "Wallet" })).toBeNull();
  });

  it("does not claim that an absent Midnight wallet is being provisioned", () => {
    mocks.wallets = [];

    render(<ProfileDashboard />);

    expect(screen.getByText("Midnight wallet not yet available.")).toBeTruthy();
    expect(mocks.readSnapshot).not.toHaveBeenCalled();
  });

  it("shows wallet facts returned by the Midnight wallet", async () => {
    render(<ProfileDashboard />);

    expect(await screen.findByText("test-midnight-address")).toBeTruthy();
    expect(screen.getByText("Preview")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText("1.2")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("Connected")).toBeTruthy();
  });

  it("omits wallet fields that were not returned", async () => {
    mocks.readSnapshot.mockResolvedValueOnce({
      connected: false,
      network: {
        chainId: "preview-chain",
        label: "Preview",
        networkId: "preview-network",
      },
    });

    render(<ProfileDashboard />);

    expect(await screen.findByText("Disconnected")).toBeTruthy();
    expect(screen.queryByText("NIGHT balance")).toBeNull();
    expect(screen.queryByText("DUST balance")).toBeNull();
    expect(screen.queryByText("DUST capacity")).toBeNull();
    expect(screen.queryByText("Unshielded address")).toBeNull();
  });

  it("shows DUST as syncing without rendering transient values", async () => {
    mocks.readSnapshot.mockResolvedValueOnce({
      connected: true,
      dustSyncing: true,
      network: {
        chainId: "preview-chain",
        label: "Preview",
        networkId: "preview-network",
      },
      nightBalance: "7",
    });

    render(<ProfileDashboard />);

    expect(await screen.findByText("Syncing")).toBeTruthy();
    expect(screen.queryByText("DUST balance")).toBeNull();
    expect(screen.queryByText("DUST capacity")).toBeNull();
  });

  it("signs out through Dynamic", async () => {
    render(<ProfileDashboard />);
    await screen.findByText("test-midnight-address");

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(mocks.handleLogOut).toHaveBeenCalledOnce());
  });

  it("reports a failed Dynamic logout", async () => {
    mocks.handleLogOut.mockRejectedValueOnce(new Error("network error"));
    render(<ProfileDashboard />);
    await screen.findByText("test-midnight-address");

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Sign out failed.",
    );
  });
});
