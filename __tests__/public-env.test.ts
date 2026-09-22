import { describe, expect, it } from "vitest";

import {
  MIDNIGHT_NETWORK_TARGET,
  parsePublicConfig,
} from "@/lib/config/public-env";

describe("public environment configuration", () => {
  it("accepts the public Dynamic ID and a clean application origin", () => {
    const result = parsePublicConfig({
      appUrl: "http://localhost:3000",
      dynamicEnvironmentId: "11111111-1111-4111-8111-111111111111",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        appUrl: "http://localhost:3000",
        dynamicEnvironmentId: "11111111-1111-4111-8111-111111111111",
        midnightNetworkTarget: MIDNIGHT_NETWORK_TARGET,
      },
    });
  });

  it("reports every missing public value", () => {
    const result = parsePublicConfig({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.field)).toEqual([
        "NEXT_PUBLIC_APP_URL",
        "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID",
      ]);
    }
  });

  it("rejects malformed IDs and non-origin URLs", () => {
    const result = parsePublicConfig({
      appUrl: "https://example.com/profile?from=test",
      dynamicEnvironmentId: "not-an-environment-id",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toHaveLength(2);
    }
  });
});
