# PLM-HirePath

Next.js 14 (App Router) + TypeScript + Tailwind + Prisma 7.10.0 (pinned,
NOT the 8.0.0-rc — that version breaks things) + PostgreSQL.

## Commands
- Dev server: npm run dev
- Migrate: npx prisma migrate dev --name <description>
- Seed: npx prisma db seed
- Generate client: npx prisma generate

## Known gotchas
- Prisma 7 requires driver adapters (@prisma/adapter-pg), NOT a url in
  schema.prisma's datasource block — that goes in prisma7.config.ts instead
- Generated client has no index.ts — import from
  "../generated/prisma/client" specifically
- Server-only code (src/lib/prisma.ts) must import "server-only" at the
  top to avoid Node-only packages (pg) leaking into client bundles

## Roles
applicant | hr | dean | vpaa | admin — President/Board are NOT logins,
tracked as Vacancy status fields only.