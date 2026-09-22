import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isLoggedIn: false,
  replace: vi.fn(),
  sdkHasLoaded: true,
}));

vi.mock("@dynamic-labs/sdk-react-core", () => ({
  DynamicEmbeddedWidget: () => <div>Dynamic authentication</div>,
  useDynamicContext: () => ({ sdkHasLoaded: mocks.sdkHasLoaded }),
  useIsLoggedIn: () => mocks.isLoggedIn,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

import { LoginPanel } from "@/components/auth/login-panel";

describe("LoginPanel", () => {
  beforeEach(() => {
    mocks.isLoggedIn = false;
    mocks.replace.mockReset();
    mocks.sdkHasLoaded = true;
  });

  it("renders Dynamic's configured authentication methods", () => {
    render(<LoginPanel />);

    expect(screen.getByRole("heading", { name: "Log in" })).toBeTruthy();
    expect(screen.getByText("Dynamic authentication")).toBeTruthy();
  });

  it("does not render the widget before the SDK is ready", () => {
    mocks.sdkHasLoaded = false;

    render(<LoginPanel />);

    expect(screen.getByText("Loading…")).toBeTruthy();
    expect(screen.queryByText("Dynamic authentication")).toBeNull();
  });

  it("redirects an authenticated user to the wallet", async () => {
    mocks.isLoggedIn = true;

    render(<LoginPanel />);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/profile"));
  });
});
