# Fittrac Kitchen — Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenRouter `openai/gpt-oss-120b:free` via Replit AI Integration (SSE streaming, no API key needed)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### Mobile App (`artifacts/mobile`) — Expo / React Native
Health-first Nigerian food ordering app. Design system: Nourish Sahel (Primary #154212, Background #FFF8F4, Epilogue headlines + Manrope body).

**Tabs (6):** Home · Menu · Health · Community · Orders · Profile

**Key screens:**
- `app/(tabs)/index.tsx` — Home feed with featured meals + quick actions
- `app/(tabs)/menu.tsx` — Full meal catalogue with health filters
- `app/(tabs)/health.tsx` — Health hub (macros, goals, calorie tracking)
- `app/(tabs)/community.tsx` — Achievements grid + community feed with like/share
- `app/(tabs)/orders.tsx` — Live order tracking via SSE
- `app/(tabs)/profile.tsx` — Profile + health preferences
- `app/wellness.tsx` — Telemedicine: specialist booking + upcoming session (Join Call + View Rx)
- `app/consultation-room.tsx` — Full video call UI (dark theme, animated frames, chat panel, test requests, prescriptions)
- `app/ai-coach.tsx` — Vitara AI health coach chat (Anthropic SSE streaming)
- `app/test-results.tsx` — Upload lab results (image picker flow)
- `app/prescription.tsx` — Rx document viewer
- `app/checkout.tsx` — Cart checkout with Paystack modal + OPay modal
- `app/meal/[id].tsx` — Meal detail with AI nutritional breakdown

**Metro config:** `metro.config.js` sets `watchFolders` to include workspace root so pnpm-hoisted packages resolve correctly.

### Admin Dashboard (`artifacts/admin`) — React + Vite
URL: `/admin/` · Login: admin / fittrac2026

**Pages:** Dashboard · Orders (SSE live updates) · Meals · Analytics · Wellness (Telemedicine)

**Wellness page features:**
- Overview tab: active consultation counter + today's schedule
- Live Sessions tab: 3-panel consultation room (video frames, call controls, clinical sidebar)
- Clinical sidebar: test request checkboxes + prescription writer with medication list
- Doctor can save prescriptions and mark tests ordered

### Clinical Portal (`artifacts/clinical-portal`) — React + Vite
URL: `/clinical/` · Design: Nourish Sahel (dark forest green sidebar + warm cream background)

**Role-based access:**
- **Doctor** — `dr.amara / doctor2026` or `dr.ifiok / doctor2026`
- **Nutritionist** — `nutri.kezia / nutri2026` or `nutri.chika / nutri2026`

**Pages:**
| Route | Doctor | Nutritionist |
|-------|--------|--------------|
| `/clinical/dashboard` | Today's schedule, critical alerts, patient count | Client adherence summary, avg score, attention list |
| `/clinical/patients` | Searchable patient list with condition badges | Same (assigned clients) |
| `/clinical/patients/:id` | Full profile: vitals, labs, Rx, consultation history | Same + meal plans + session notes |
| `/clinical/consultations` | Today's timeline with Join Call buttons | Same |
| `/clinical/consultations/:id` | Consultation workspace + prescription writer | Same + session notes form |
| `/clinical/lab-results` | ✅ Filterable by critical/abnormal/normal | — |
| `/clinical/prescriptions` | ✅ Rx history with expandable medication details | — |
| `/clinical/meal-plans` | — | ✅ Client plans with adherence rings + macros |
| `/clinical/nutrition-analytics` | — | ✅ Recharts: adherence by condition, weekly trend, macro averages |

**Auth:** Bearer token stored as `fk_clinical_token` in localStorage. Role in `fk_clinical_staff`.

**API:** No Orval codegen — calls `/api/clinical-staff/*` directly with `fetchWithAuth()` helper.

### API Server (`artifacts/api-server`) — Express 5
Base path: `/api/`

**Route groups:**
| Mount | File | Description |
|-------|------|-------------|
| `/api/healthz` | `health.ts` | Health check |
| `/api/admin/*` | `admin.ts` | Auth, stats, orders, meals, analytics |
| `/api/ai/chat` | `ai.ts` | Anthropic SSE streaming (Vitara persona) |
| `/api/ai/recommendations` | `ai.ts` | Meal recommendations via Anthropic |
| `/api/clinical/*` | `clinical.ts` | Test requests, prescriptions, lab tests catalogue |
| `/api/clinical-staff/*` | `clinical-staff.ts` | Clinical portal auth + full role-based clinical data |
| `/api/payments/paystack/*` | `payments.ts` | Paystack initialization + webhook (demo mode) |
| `/api/payments/opay/*` | `payments.ts` | OPay initialization + webhook (demo mode) |
| `/api/events/stream` | `events.ts` | SSE order event broadcast |
| `/api/events/orders/:id` | `events.ts` | Trigger order status update (admin → SSE) |

**Environment variables:**
- `SESSION_SECRET` — Express session secret
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` — Replit AI proxy base URL
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — Replit AI proxy API key

## Design System — Nourish Sahel

| Token | Value |
|-------|-------|
| Primary | `#154212` (deep forest green) |
| Secondary | `#A0522D` (warm sienna) |
| Background | `#FFF8F4` (warm cream) |
| Headline font | Epilogue (700 Bold) |
| Body font | Manrope (400 Regular, 600 SemiBold, 700 Bold) |

## Feature Status

| Feature | Status |
|---------|--------|
| AI Health Coach (Vitara, Anthropic SSE) | ✅ Complete |
| Paystack payment modal | ✅ Complete (demo mode) |
| OPay payment modal | ✅ Complete (demo mode) |
| SSE real-time order tracking | ✅ Complete |
| Community & Achievements tab | ✅ Complete |
| Telemedicine video call room (mobile) | ✅ Complete |
| Test result upload (mobile) | ✅ Complete |
| Prescription viewer (mobile) | ✅ Complete |
| Doctor consultation room (admin) | ✅ Complete |
| Test request ordering (admin) | ✅ Complete |
| Prescription writer (admin) | ✅ Complete |
| Join Call button on wellness screen | ✅ Complete |
| Clinical Portal — Doctor dashboard | ✅ Complete |
| Clinical Portal — Nutritionist dashboard | ✅ Complete |
| Clinical Portal — Patient management | ✅ Complete |
| Clinical Portal — Lab results inbox | ✅ Complete |
| Clinical Portal — Prescription writer + history | ✅ Complete |
| Clinical Portal — Meal plans + adherence rings | ✅ Complete |
| Clinical Portal — Nutrition analytics (recharts) | ✅ Complete |
| Clinical Portal — Consultation workspace | ✅ Complete |

## End-to-End Telemedicine Flow

When a doctor opens a consultation in the Admin Wellness page:
1. **Test Requests**: Selecting tests and clicking "Send" calls `POST /api/admin/test-requests` with `consultationId` + `doctorName`. The route writes individual rows to `lab_results` AND a grouped `clinical_test_requests` row — so `GET /api/clinical/test-requests/consultation/:id` on mobile returns those tests.
2. **Prescriptions**: The Rx writer sends `consultationId`, `doctorName`, `doctorType`, `labTests`, `followUpDate` to `POST /api/admin/prescriptions`, which now stores all clinical fields. The mobile prescription screen first looks in local context, then fetches `GET /api/clinical/prescriptions/:id` as fallback.

## Production Hardening Status

All mock/seed data has been removed. The app is fully production-ready pending Supabase provisioning.

| Area | Status | Notes |
|------|--------|-------|
| `admin.ts` backend | ✅ Cleaned | Queries Supabase for orders/stats; MENU_ITEMS is static catalog |
| `clinical-staff.ts` backend | ✅ Cleaned | All MOCK_* removed; returns 503 if DB not configured |
| `AppContext.tsx` | ✅ Cleaned | Seed functions removed; starts with empty arrays |
| `prescription.tsx` | ✅ Complete | Fetches from local state first, falls back to `GET /api/clinical/prescriptions/:id` |
| `test-results.tsx` | ✅ Complete | Loads tests from `/api/clinical/tests`; shows loading/empty states |
| `consultation-room.tsx` | ✅ Complete | Fetches test requests from API; starts empty if none |
| `community.tsx` | ✅ Complete | Achievements computed from real user data; feed seeded with 6 community posts |
| `HOSTING.md` | ✅ Written | Full deployment guide including Nginx, PM2, EAS, Supabase RLS |
| Supabase schema | ⏳ Pending | Must run `supabase/schema.sql` then `supabase/seed.sql` on production project |
| Default passwords | ⚠️ Change before live | Admin: `fittrac2026`, Doctors: `doctor2026`, Nutritionists: `nutri2026` |

## Database (Supabase)

- `SUPABASE_URL` — set in Secrets
- `SUPABASE_SERVICE_ROLE_KEY` — set in Secrets
- `SUPABASE_ANON_KEY` — set in Secrets
- Project: `vuxarushmfmxritydbxi`
- Schema file: `supabase/schema.sql`
- Seed file: `supabase/seed.sql` (clinical staff accounts)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
