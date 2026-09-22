import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("public route", () => {
  it("renders the minimal Midnight entry point", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Midnight" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Midnight home" })).toHaveProperty(
      "href",
      "http://localhost:3000/",
    );
    expect(screen.getByRole("link", { name: "Log in" })).toHaveProperty(
      "href",
      "http://localhost:3000/login",
    );
  });
});
