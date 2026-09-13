# ALIF AI Academy

ALIF AI Academy is a bilingual Arabic-English learning platform with Clerk accounts, OneDrive lesson playback, and a server-side activity trail.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/arabic-ai-academy run typecheck` — check the web app
- `pnpm --filter @workspace/api-server run typecheck` — check the API
- OneDrive lesson URLs are configured with `ONEDRIVE_VIDEO_0_URL` through `ONEDRIVE_VIDEO_5_URL` on the API server.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Auth: Replit-managed Clerk
- Activity storage: newline-delimited JSON in `artifacts/api-server/activity.log`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/arabic-ai-academy/src/App.tsx` — bilingual landing page, Clerk routes, and authenticated lesson portal.
- `artifacts/arabic-ai-academy/src/index.css` — academy theme, type, and motion.
- `artifacts/api-server/src/lib/academy.ts` — lesson catalog and activity log persistence.
- `artifacts/api-server/src/routes/academy.ts` — authenticated lesson and activity endpoints.
- `lib/api-spec/openapi.yaml` — API source of truth.

## Architecture decisions

- Clerk owns account creation, sign-in, sign-out, and browser session cookies; the application does not recreate local password storage.
- OneDrive remains the media host; lessons expose configured share/embed URLs and the portal renders them in a responsive iframe.
- Activity events are append-only JSON lines in `activity.log`, filtered by Clerk user ID for the portal's recent activity view.
- The landing page is public while the playlist is protected at `/user-portal`.

## Product

Users can discover the academy in Arabic or English, create an account, sign in, watch six practical AI lessons, switch language direction, and see a personal recent-activity trace.

## User preferences

The user requested a classy Arabic-inspired interface, luxury iconography, bilingual Arabic/English copy, and OneDrive-hosted video lessons.

## Gotchas

- The six `ONEDRIVE_VIDEO_*_URL` variables are intentionally optional during the first build; an unconfigured lesson shows a clear setup state instead of a fake player.
- Regenerate the API client after changing `lib/api-spec/openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
