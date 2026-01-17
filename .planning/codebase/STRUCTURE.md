# Codebase Structure

**Analysis Date:** 2026-01-17

## Directory Layout

```
paramtune/
├── src/                    # Source code
│   ├── app/               # Next.js App Router
│   │   ├── api/          # API route handlers
│   │   └── dashboard/    # Dashboard pages
│   ├── components/        # React components
│   │   └── ui/           # Base UI components
│   ├── models/           # Business logic & Redis ops
│   ├── connections/      # External service clients
│   ├── contexts/         # React context providers
│   ├── lib/              # Utility functions
│   └── actions/          # Server actions (empty)
├── public/               # Static assets
├── docs/                 # Documentation
├── .planning/            # Project planning files
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── next.config.js        # Next.js config
├── tailwind.config.ts    # Tailwind CSS config
├── Dockerfile            # Container build
└── docker-compose.yml    # Production orchestration
```

## Directory Purposes

**src/app/**
- Purpose: Next.js App Router pages and API routes
- Contains: Page components, layouts, route handlers
- Key files:
  - `layout.tsx` - Root layout with fonts and metadata
  - `page.tsx` - Home/marketing page
  - `globals.css` - Global styles with Tailwind
- Subdirectories:
  - `api/` - RESTful API endpoints
  - `dashboard/` - Main application pages

**src/app/api/**
- Purpose: HTTP API for external consumers
- Contains: Route handlers (GET, POST)
- Key files:
  - `[platform]/route.ts` - Platform CRUD
  - `[platform]/versions/route.ts` - Version management
  - `[platform]/[version]/route.ts` - Schema access
  - `schemas/route.ts` - Legacy schema endpoint

**src/app/dashboard/**
- Purpose: Interactive dashboard UI
- Contains: Server Components with server actions
- Key files:
  - `layout.tsx` - Dashboard shell with sidebar
  - `page.tsx` - Platform listing
  - `[platform]/page.tsx` - Platform details, version creation
  - `[platform]/[version]/page.tsx` - Schema editor

**src/components/**
- Purpose: Reusable React components
- Contains: UI primitives and feature components
- Key files:
  - `Sidebar.tsx` - Navigation sidebar
  - `SchemaTabs.tsx` - Editor/Preview/History tabs
  - `CreatePlatformForm.tsx` - Platform creation form
  - `SchemaEditorForm.tsx` - Schema submission form
- Subdirectories:
  - `ui/` - Base components (Card, Button, Badge, Input)
  - `JsonEditable/` - JSON editor with syntax highlighting
  - `JsonOutput/` - Schema preview component
  - `SchemaHistory/` - Version history and diffs
  - `PageTitle/` - Breadcrumb navigation

**src/components/ui/**
- Purpose: Primitive UI components (shadcn/ui style)
- Contains: Composable, forwardRef components
- Key files:
  - `Card.tsx` - Card, CardHeader, CardContent, etc.
  - `Button.tsx` - Button with variants
  - `Badge.tsx` - Status badges
  - `Input.tsx` - Form input
  - `utils.ts` - `cn()` class name utility

**src/models/**
- Purpose: Business logic and Redis data operations
- Contains: Server functions with `'use server'` directive
- Key files:
  - `Platform.ts` - `getPlatforms()`, `getPlatform()`, `savePlatform()`
  - `Version.ts` - `getVersions()`, `getVersion()`, `saveVersion()`
  - `Schema.ts` - Schema CRUD, dependency resolution, cascade updates

**src/connections/**
- Purpose: External service client factories
- Contains: Singleton connection instances
- Key files:
  - `redis.ts` - ioredis client with connection pooling

**src/contexts/**
- Purpose: React context providers for client state
- Contains: Context definitions and providers
- Key files:
  - `SidebarContext.tsx` - Sidebar open/close state

**src/lib/**
- Purpose: Shared utility functions
- Contains: Pure functions and helpers
- Key files:
  - `utils.ts` - `cn()` Tailwind class merging
  - `versionUtils.ts` - Semver sorting utilities
  - `fileUtils.ts` - Clipboard and file download

**src/actions/**
- Purpose: Shared server actions
- Contains: Currently empty (actions in page files)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Application root
- `src/app/dashboard/layout.tsx` - Dashboard shell
- `src/middleware.ts` - Request middleware

**Configuration:**
- `tsconfig.json` - TypeScript with `@/*` path alias
- `next.config.js` - Standalone output mode
- `tailwind.config.ts` - Content paths
- `components.json` - shadcn/ui settings
- `.env.local.example` - Environment template

**Core Logic:**
- `src/models/Schema.ts` - Schema composition engine
- `src/models/Platform.ts` - Platform management
- `src/connections/redis.ts` - Redis client

**Testing:**
- Not configured - No test directory

**Documentation:**
- `README.md` - Project overview and setup
- `docs/API.md` - API endpoint documentation

## Naming Conventions

**Files:**
- PascalCase for React components: `CreatePlatformForm.tsx`, `SchemaTabs.tsx`
- camelCase for utilities: `utils.ts`, `versionUtils.ts`, `fileUtils.ts`
- lowercase for config: `redis.ts`, `globals.css`
- `route.ts` for API handlers (Next.js convention)

**Directories:**
- kebab-case or PascalCase for components: `JsonEditable/`, `SchemaHistory/`
- lowercase for functional: `ui/`, `models/`, `lib/`
- Plural for collections: `components/`, `contexts/`, `connections/`

**Special Patterns:**
- `index.ts` barrel exports in feature directories
- `[param]` for dynamic routes: `[platform]`, `[version]`
- `layout.tsx` and `page.tsx` for App Router conventions

## Where to Add New Code

**New Feature:**
- Primary code: `src/app/dashboard/{feature}/page.tsx`
- Components: `src/components/{FeatureName}/`
- Business logic: `src/models/{Feature}.ts`

**New Component:**
- UI primitive: `src/components/ui/{Component}.tsx`
- Feature component: `src/components/{ComponentName}/` with `index.ts`
- Types: In component file or `types.ts` in directory

**New Route/Endpoint:**
- Page: `src/app/dashboard/{path}/page.tsx`
- API: `src/app/api/{path}/route.ts`
- Layout: `src/app/{path}/layout.tsx` if shared shell needed

**New Model/Service:**
- Data model: `src/models/{Model}.ts`
- External service: `src/connections/{service}.ts`
- Server action: In page file or `src/actions/{action}.ts`

**Utilities:**
- Shared helpers: `src/lib/{name}.ts`
- Component utilities: `src/components/{Component}/utils/`

## Special Directories

**.planning/**
- Purpose: Project planning and codebase documentation
- Source: Created by GSD commands
- Committed: Yes

**public/**
- Purpose: Static assets served at root
- Contains: Favicon, images
- Committed: Yes

**.next/**
- Purpose: Next.js build output
- Source: Generated by `next build`
- Committed: No (in .gitignore)

**node_modules/**
- Purpose: npm dependencies
- Source: Installed by pnpm
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-01-17*
*Update when directory structure changes*
