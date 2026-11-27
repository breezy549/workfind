# Workfind

Discover work worth learning: high-paying, low-barrier hands-on jobs by region, entry requirements, certifications and foreign-worker eligibility, then the training to get there.

Expo (web first, iOS/Android later) + Supabase.

```sh
npm install
npm run web        # dev server, usually http://localhost:8081
npm run build:web  # static export to dist/
```

Database: `supabase/migrations/` (stage-1 job discovery schema, applied to the shared Supabase project).

## Deploy (Cloudflare Pages)

Connect the GitHub repo in Cloudflare: Workers & Pages > Create > Pages > Connect to Git.

| Setting | Value |
|---|---|
| Production branch | `workfind` (or `main` after merging) |
| Framework preset | None |
| Build command | `npm run build:web` |
| Build output directory | `dist` |
| Environment variables | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (same values as `.env`; both are public client values) |

Node version comes from `.node-version`. Routes use the URL hash (`#/us/electrician`), so no redirect rules are needed.
