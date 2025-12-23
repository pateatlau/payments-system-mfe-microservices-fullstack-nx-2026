# Known Issues (Deferred Fixes)

This document tracks known issues we’re deferring for now. Each entry includes symptoms, impact, quick workarounds, and a proposed fix for when we prioritize the item.

## 1) Brave Browser: App fails to run

- Symptoms: Blank screen or blocked network requests; console shows “Mixed Content”, CSP, or tracker/cookie blocks.
- Likely causes:
  - Mixed content: page on HTTPS while API/WebSocket use HTTP/WS (e.g., env defaults and Nginx CSP).
  - Brave Shields: blocks third‑party cookies/trackers and some cross‑site requests.
  - CSP: restrictive `script-src` / `connect-src` disallow remote MFEs and `wss://`.
- References:
  - CSP config in [nginx/nginx.conf](../../nginx/nginx.conf#L283)
  - Dev defaults in [package.json](../../package.json#L11)
  - Remote MFEs in [apps/shell/rspack.config.js](../../apps/shell/rspack.config.js#L270-L273)
- Quick workarounds:
  - Disable Shields for local site and reload.
  - Run fully over HTTP in dev to avoid mixed content: `pnpm start:http`.
- Proposed fix when prioritized:
  - Align protocols (all HTTPS + WSS in TLS mode, or all HTTP + WS in dev).
  - Expand CSP `script-src`/`connect-src` to include needed localhost origins and `wss://localhost`.
  - Proxy module federation remotes via Nginx to same-origin and whitelist those paths in CSP.

## 2) Safari: Remote MFEs not loading

- Symptoms: `remoteEntry.js` or chunk requests blocked; blank sections; console shows CSP/mixed content.
- Likely causes:
  - Cross-origin remotes on HTTPS without proper CSP.
  - `ws://` on a secure page (Safari requires `wss://`).
  - Strict ITP affecting third‑party cookies/storage.
- References:
  - Remotes in [apps/shell/rspack.config.js](../../apps/shell/rspack.config.js#L270-L273)
  - CSP/Connect in [nginx/nginx.conf](../../nginx/nginx.conf#L283)
- Quick workarounds:
  - Test in HTTP-only mode during dev.
  - Relax CSP for dev to include `http://localhost:4200-4204` in `script-src` and `connect-src`.
- Proposed fix when prioritized:
  - Serve remotes via same-origin through Nginx routes and update CSP accordingly.
  - Use `wss://` when the page is HTTPS.

## 3) Mixed Content & CSP in HTTPS dev mode

- Symptoms: GraphQL/API/WebSocket calls blocked; console shows mixed content or CSP violations.
- Current state:
  - `connect-src` allows `http://localhost:3000` but page may be on HTTPS; WebSocket defaults use `ws://`.
- References:
  - CSP in [nginx/nginx.conf](../../nginx/nginx.conf#L283)
  - WS/GraphQL defaults in [apps/payments-mfe/src/bootstrap.tsx](../../apps/payments-mfe/src/bootstrap.tsx#L30-L32) and other MFEs.
- Quick workarounds:
  - Use HTTP dev mode (`pnpm start:http`).
- Proposed fix when prioritized:
  - Introduce `NX_API_BASE_URL=https://…` and `NX_WS_URL=wss://…` when serving HTTPS.
  - Update CSP `connect-src` to include `wss:` and required HTTPS endpoints.

## 4) Design System Select rollout incomplete

- Symptoms: Some screens still show native `<select>` styling.
- Current state: We replaced key admin selects; more remain across apps.
- Quick workaround: Accept native selects for now; no functional impact.
- Proposed fix when prioritized: Complete migration to design-system `Select` and consider an advanced, accessible custom dropdown (Radix/Headless UI) if needed.

## 5) Tailwind v4 dual-class fallback warnings

- Symptoms: Lint/compile messages about duplicate properties (token class + RGB fallback) in components like `Select`.
- Current state: Intentional for dual v3/v4 compatibility; functionally safe.
- Quick workaround: Ignore these messages during migration period.
- Proposed fix when prioritized: Remove v3 fallbacks once all apps are confirmed on v4 and tokens render reliably.

---

Append new issues below using this template:

- Title: Short description
- Symptoms:
- Likely causes:
- References:
- Quick workarounds:
- Proposed fix when prioritized:
