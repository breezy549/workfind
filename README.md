# Workfind

Discover work worth learning: high-paying, low-barrier hands-on jobs by region, entry requirements, certifications and foreign-worker eligibility, then the training to get there.

Expo (web first, iOS/Android later) + Supabase.

```sh
npm install
npm run web        # dev server, usually http://localhost:8081
npm run build:web  # static export to dist/
```

Database: `supabase/migrations/` (stage-1 job discovery schema, applied to the shared Supabase project).

## Deploy (Cloudflare Workers)

`wrangler.jsonc` serves `dist/` as static assets. In Cloudflare: Workers & Pages > Create > Import a repository (Workers Builds), pick this repo.

| Setting | Value |
|---|---|
| Project / Worker name | `workfind` (must match `name` in `wrangler.jsonc`) |
| Production branch | the branch you deploy from |
| Build command | `npm run build:web` |
| Deploy command | `npx wrangler deploy` |
| Build variables | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (same values as `.env`; public client values, baked in at build time) |

Node version comes from `.node-version`. Routes use the URL hash (`#/us/electrician`).
