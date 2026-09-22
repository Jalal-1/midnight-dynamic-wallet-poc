import type { Metadata } from "next";

import { LoginPanel } from "@/components/auth/login-panel";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Log in | Midnight",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="grid flex-1 place-items-center px-5 py-14 sm:px-8">
        <LoginPanel />
      </main>
    </div>
  );
}
