# Workfind

Discover work worth learning: high-paying, low-barrier hands-on jobs by region, entry requirements, certifications and foreign-worker eligibility, then the training to get there.

Expo (web first, iOS/Android later) + Supabase.

```sh
npm install
npm run web        # dev server, usually http://localhost:8081
npm run build:web  # static export to dist/
```

Database: `supabase/migrations/` (stage-1 job discovery schema, applied to the shared Supabase project).
