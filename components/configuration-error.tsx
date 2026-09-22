import type { PublicConfigIssue } from "@/lib/config/public-env";

type ConfigurationErrorProps = {
  issues: PublicConfigIssue[];
};

export function ConfigurationError({ issues }: ConfigurationErrorProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-16 text-foreground">
      <section
        aria-labelledby="configuration-heading"
        className="w-full max-w-2xl border border-line bg-white"
      >
        <div className="border-b border-line bg-foreground px-6 py-5 text-white sm:px-8">
          <p className="text-xs font-semibold tracking-[0.15em] text-white/60 uppercase">
            Configuration required
          </p>
          <h1
            className="mt-3 text-3xl font-semibold tracking-[-0.04em]"
            id="configuration-heading"
          >
            Midnight is not ready to start.
          </h1>
        </div>
        <div className="px-6 py-7 sm:px-8">
          <p className="max-w-xl leading-7 text-muted">
            Add the following public values to your local environment, then
            restart the development server. See <code>.env.example</code> for a
            working localhost configuration.
          </p>
          <ul className="mt-6 space-y-3">
            {issues.map((issue) => (
              <li
                className="border-l-2 border-accent bg-panel px-4 py-3 text-sm"
                key={issue.field}
              >
                <code className="font-semibold">{issue.field}</code>
                <span className="mt-1 block text-muted">{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
