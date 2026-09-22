const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MIDNIGHT_NETWORK_TARGET = "preview" as const;

export type PublicConfig = {
  appUrl: string;
  dynamicEnvironmentId: string;
  midnightNetworkTarget: typeof MIDNIGHT_NETWORK_TARGET;
};

export type PublicConfigIssue = {
  field: "NEXT_PUBLIC_APP_URL" | "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID";
  message: string;
};

export type PublicConfigResult =
  | { ok: true; value: PublicConfig }
  | { issues: PublicConfigIssue[]; ok: false };

export type PublicConfigInput = {
  appUrl?: string;
  dynamicEnvironmentId?: string;
};

export function parsePublicConfig(
  input: PublicConfigInput,
): PublicConfigResult {
  const issues: PublicConfigIssue[] = [];
  const dynamicEnvironmentId = input.dynamicEnvironmentId?.trim();
  const appUrl = parseAppUrl(input.appUrl, issues);

  if (!dynamicEnvironmentId) {
    issues.push({
      field: "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID",
      message:
        "Set NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID to the public Dynamic environment ID.",
    });
  } else if (!UUID_PATTERN.test(dynamicEnvironmentId)) {
    issues.push({
      field: "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID",
      message: "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID must be a valid UUID.",
    });
  }

  if (issues.length > 0 || !dynamicEnvironmentId || !appUrl) {
    return { issues, ok: false };
  }

  return {
    ok: true,
    value: {
      appUrl,
      dynamicEnvironmentId,
      midnightNetworkTarget: MIDNIGHT_NETWORK_TARGET,
    },
  };
}

export function getPublicConfig(): PublicConfigResult {
  return parsePublicConfig({
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    dynamicEnvironmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
  });
}

function parseAppUrl(
  rawValue: string | undefined,
  issues: PublicConfigIssue[],
): string | undefined {
  const value = rawValue?.trim();

  if (!value) {
    issues.push({
      field: "NEXT_PUBLIC_APP_URL",
      message:
        "Set NEXT_PUBLIC_APP_URL to this deployment's absolute base URL.",
    });
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }

    if (url.pathname !== "/" || url.search || url.hash) {
      throw new Error("URL is not an origin");
    }

    return url.origin;
  } catch {
    issues.push({
      field: "NEXT_PUBLIC_APP_URL",
      message:
        "NEXT_PUBLIC_APP_URL must be an absolute HTTP(S) origin without a path, query, or fragment.",
    });
    return undefined;
  }
}
