# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alumni Platform (同窓会プラットフォーム) - A multi-tenant SaaS platform for managing alumni associations. Each tenant (alumni group) gets a subdomain-based site with CMS capabilities for news, member management, and events.

## Common Commands

```bash
# Development
pnpm dev              # Start dev server at localhost:3000
pnpm build            # Production build
pnpm lint             # Run ESLint

# Testing
pnpm test             # Run Vitest in watch mode
pnpm test:run         # Run tests once
pnpm test:coverage    # Run with coverage
pnpm test:e2e         # Run Playwright e2e tests

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes (dev)
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio GUI

# Local database setup
docker-compose up -d  # Start PostgreSQL
docker-compose down   # Stop PostgreSQL
```

## Architecture

### Multi-Tenant Routing

The platform uses subdomain-based multi-tenancy:

- **Root domain** (`localhost:3000`): Landing page at `src/app/page.tsx`
- **Tenant sites** (`{subdomain}.localhost:3000`): Routes to `src/app/[domain]/` via middleware
- **Platform admin** (`admin.localhost:3000`): Routes to `src/app/admin/`

The middleware (`src/middleware.ts`) extracts subdomains and rewrites URLs. Tenant resolution uses React cache for request-level caching (`src/lib/tenant/resolve.ts`).

### Authentication System

- NextAuth v5 with Prisma adapter (`src/auth.ts`)
- Providers: Google OAuth, LINE (optional), Email magic links via Resend
- Session includes user memberships and platform admin status
- Role-based access: `ADMIN`, `EDITOR`, `MEMBER` per tenant
- Platform admins have cross-tenant access

Auth helpers in `src/lib/auth/session.ts`:
- `getCurrentUser()` - Get authenticated user or null
- `requireAuth()` - Require authentication
- `requireTenantRole(tenantId, role)` - Require specific tenant role
- `requirePlatformAdmin()` - Require platform admin

### Data Model

Key entities (see `prisma/schema.prisma`):
- **Tenant**: Alumni organization with subdomain, settings, template
- **User/Account/Session**: NextAuth authentication
- **TenantMembership**: User-tenant relationship with role
- **Post/Category/Tag**: CMS content system
- **PlatformAdmin**: Cross-tenant super users

### Server Actions Pattern

Server actions in `src/app/[domain]/admin/*/actions.ts`:
- Use `"use server"` directive
- Validate with Zod schemas (co-located in `schema.ts`)
- Return `{ success: boolean, data?, error? }` shape
- Call `revalidatePath()` after mutations
- Sanitize HTML content for posts

### Template System

Three pre-defined site templates (`src/lib/templates/definitions.ts`):
- **Standard**: Full-featured for large alumni groups
- **Gallery**: Visual-focused for young alumni
- **Simple**: Minimal for small groups

Templates define themes (colors, fonts) and layouts. Theme values are converted to CSS variables via `themeToCssVariables()`.

### Rich Text Editor

TipTap-based editor for post content with:
- Image upload via Vercel Blob
- Link insertion
- Character count
- HTML sanitization on save (`src/lib/posts/sanitize.ts`)

## Environment Variables

Required (see `src/env.ts` for validation):
- `DATABASE_URL` - PostgreSQL connection
- `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Auth
- `RESEND_API_KEY`, `EMAIL_FROM` - Email
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ROOT_DOMAIN` - URLs

Optional:
- `LINE_CLIENT_ID`, `LINE_CLIENT_SECRET` - LINE OAuth
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob for images
- `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID` - Vercel integration

Use `SKIP_ENV_VALIDATION=true` to bypass env validation during build/test.

## Testing

- Vitest for unit tests (`src/**/*.test.ts`)
- Playwright for e2e tests (`e2e/`)
- Test files co-located with source (e.g., `sanitize.test.ts`)
- JSDOM environment, React Testing Library available

## Path Aliases

Use `@/` for imports from `src/`:
```typescript
import { prisma } from "@/lib/db/client";
import { auth } from "@/auth";
```
