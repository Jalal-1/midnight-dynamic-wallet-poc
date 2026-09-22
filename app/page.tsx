import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader
        action={
          <Link className="header-action" href="/login">
            Log in
          </Link>
        }
      />

      <main className="relative grid flex-1 place-items-center overflow-hidden">
        <h1 className="sr-only">Midnight</h1>
        <div
          aria-hidden="true"
          className="midnight-mark relative size-[min(68vw,28rem)]"
        >
          <span className="absolute inset-0 rounded-full border border-foreground/15" />
          <span className="absolute inset-[12%] rounded-full bg-foreground" />
          <span className="absolute top-[12%] right-[12%] bottom-[12%] w-[38%] rounded-r-full bg-accent" />
          <span className="absolute top-1/2 left-[12%] h-px w-[76%] bg-white/35" />
        </div>
      </main>
    </div>
  );
}
