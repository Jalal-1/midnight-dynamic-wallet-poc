import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isLoggedIn: false,
  reinitialize: vi.fn(),
  replace: vi.fn(),
  sdkHasLoaded: true,
}));

vi.mock("@dynamic-labs/sdk-react-core", () => ({
  DynamicEmbeddedWidget: () => <div>Dynamic authentication</div>,
  useDynamicContext: () => ({ sdkHasLoaded: mocks.sdkHasLoaded }),
  useIsLoggedIn: () => mocks.isLoggedIn,
  useReinitialize: () => mocks.reinitialize,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

import { LoginPanel } from "@/components/auth/login-panel";

describe("LoginPanel", () => {
  beforeEach(() => {
    mocks.isLoggedIn = false;
    mocks.reinitialize.mockReset();
    mocks.replace.mockReset();
    mocks.sdkHasLoaded = true;
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("offers a bounded retry when Dynamic does not finish loading", async () => {
    vi.useFakeTimers();
    mocks.sdkHasLoaded = false;

    render(<LoginPanel />);

    expect(
      screen.queryByRole("button", { name: "Retry authentication" }),
    ).toBeNull();

    await act(() => vi.advanceTimersByTimeAsync(10_000));

    fireEvent.click(
      screen.getByRole("button", { name: "Retry authentication" }),
    );

    expect(mocks.reinitialize).toHaveBeenCalledOnce();
  });

  it("redirects an authenticated user to the wallet", async () => {
    mocks.isLoggedIn = true;

    render(<LoginPanel />);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/profile"));
  });
});
