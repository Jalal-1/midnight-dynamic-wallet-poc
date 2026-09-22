import type { Metadata } from "next";
import "@fontsource-variable/outfit";

import { ConfigurationError } from "@/components/configuration-error";
import { DynamicProvider } from "@/components/dynamic-provider";
import { getPublicConfig } from "@/lib/config/public-env";

import "./globals.css";

const publicConfig = getPublicConfig();
const title = "Midnight";
const description = "Log in to view your Midnight wallet on Preview.";

export const metadata: Metadata = {
  metadataBase: publicConfig.ok
    ? new URL(publicConfig.value.appUrl)
    : undefined,
  title,
  description,
  openGraph: {
    description,
    title,
    type: "website",
  },
  twitter: {
    card: "summary",
    description,
    title,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {publicConfig.ok ? (
          <DynamicProvider config={publicConfig.value}>
            {children}
          </DynamicProvider>
        ) : (
          <ConfigurationError issues={publicConfig.issues} />
        )}
      </body>
    </html>
  );
}
