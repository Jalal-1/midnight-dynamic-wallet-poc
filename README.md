# Midnight Dynamic wallet proof of concept

A minimal Next.js proof of concept for signing in with Dynamic and viewing the
authenticated user's Midnight wallet on Preview.

The profile deliberately displays only values returned by the active Midnight
wallet:

- the selected network;
- the active unshielded address;
- unshielded NIGHT balance;
- DUST balance and capacity; and
- wallet connection status.

Unavailable wallet data is omitted rather than replaced with sample values or
an assumed zero. This repository does not request transaction or signing
authority.

## Requirements

- Node.js 22
- npm
- a Dynamic environment with the desired authentication methods and an
  embedded Midnight wallet enabled

## Local setup

Install the dependencies and create a local environment file:

```bash
npm install
cp .env.example .env.local
```

Set the public browser configuration in `.env.local`:

```dotenv
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=replace-with-your-dynamic-environment-id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Allowlist the application origin in Dynamic, then start the development
server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes and trust boundary

- `/` is the public landing page.
- `/login` hosts Dynamic's authentication widget.
- `/profile` is the authenticated wallet view.

The profile route waits for the Dynamic SDK and redirects unauthenticated
visitors to `/login`. This is a client-side interface gate, not server-side
authorization. Any server API added later must validate the session token
independently.

The provider registers Ethereum and Midnight connector families so it can work
with multi-chain Dynamic environments. The profile explicitly selects a wallet
with Dynamic's `isMidnightWallet` guard and never treats an EVM wallet as a
Midnight substitute.

The wallet reader discovers Preview from the SDK's network records, switches
using the returned chain identifier, verifies the selected network, and then
reads the address and formatted balances. DUST values appear only after the SDK
reports that DUST synchronisation has completed.

## Known limitation

In local live testing, the combined formatted NIGHT and DUST balance read
remained pending for several minutes without an SDK warning or error. The UI
shows non-sensitive progress stages and elapsed time, but the underlying cause
is unresolved. Revalidate the behavior with your own Dynamic environment and
the current SDK before treating this proof of concept as production-ready.

## Verification

Run the complete local gate:

```bash
npm run check
```

This runs formatting, linting, type checking, automated tests, and a production
build.
