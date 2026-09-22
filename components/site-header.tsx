import Link from "next/link";
import type { ReactNode } from "react";

type SiteHeaderProps = {
  action?: ReactNode;
};

export function SiteHeader({ action }: SiteHeaderProps) {
  return (
    <header className="relative z-10 border-b border-line bg-background">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-18 w-full items-center justify-between px-5 sm:px-8"
      >
        <Link
          aria-label="Midnight home"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.035em]"
          href="/"
        >
          <span aria-hidden="true" className="size-2.5 bg-accent" />
          Midnight
        </Link>
        {action ? <div className="flex items-center">{action}</div> : null}
      </nav>
    </header>
  );
}
