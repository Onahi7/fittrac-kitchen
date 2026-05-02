# Fittrac Kitchen — Hosting & Deployment Guide

## Overview

Fittrac Kitchen is a monorepo with four deployable artifacts:

| Artifact | Path | Description |
|---|---|---|
| `artifacts/api-server` | `/api` | Express API server (Node.js) |
| `artifacts/admin` | `/admin` | Admin dashboard (React + Vite) |
| `artifacts/clinical-portal` | `/clinical-portal` | Clinical staff portal (React + Vite) |
| `artifacts/mobile` | Expo | Mobile app (React Native / Expo) |

---

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Supabase** project (PostgreSQL database)
- **Anthropic API key** (via Replit AI Integrations or your own key)
- **Paystack** account (for payments — optional, soft requirement)

---

## 1. Environment Variables

Create a `.env` file in `artifacts/api-server/` with the following:

```env
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Session security
SESSION_SECRET=a-long-random-string-at-least-32-chars

# AI (Anthropic)
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://api.anthropic.com
AI_INTEGRATIONS_ANTHROPIC_API_KEY=your-anthropic-api-key

# Payments (optional — works without, payments use internal flow)
PAYSTACK_SECRET_KEY=sk_live_your-paystack-secret

# Server
PORT=8080
NODE_ENV=production
```

For the **mobile app**, create `artifacts/mobile/.env`:
```env
EXPO_PUBLIC_DOMAIN=your-domain.com
```

---

## 2. Database Setup (Supabase)

### Step 1 — Run the schema

In your Supabase project's SQL editor, run `supabase/schema.sql`. This creates all 11 tables:

- `clinical_staff` — doctors and nutritionists
- `patients` — patient records
- `consultations` — booked appointments
- `lab_results` — diagnostic test results
- `prescriptions` — doctor-issued prescriptions
- `meal_plans` — nutritionist meal plans
- `session_notes` — nutritionist session notes
- `users` — mobile app user accounts
- `orders` — food orders placed via the mobile app
- `conversations` — AI coach chat sessions (if using AI conversations table)
- `messages` — AI chat messages

### Step 2 — Seed clinical staff (required for clinical portal login)

Run `supabase/seed.sql` to populate:
- 2 doctors (`dr.amara`, `dr.ifiok` — password: `doctor2026`)
- 2 nutritionists (`nutri.kezia`, `nutri.chika` — password: `nutri2026`)

> **Change all default passwords before going live.** Update them directly in the `clinical_staff` table in Supabase, or add a password reset flow.

### Row Level Security (RLS)

The schema does not enable RLS by default. For production, enable RLS on all tables and add policies:

```sql
-- Example: only authenticated users can read their own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT USING (user_id = auth.uid());
```

---

## 3. Installing Dependencies

```bash
# From the monorepo root
pnpm install
```

---

## 4. Building & Running

### API Server

```bash
# Development
pnpm --filter @workspace/api-server run dev

# Production build
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

The API server listens on `PORT` (default 8080) and serves all routes under `/api/`.

### Admin Dashboard

```bash
# Development
pnpm --filter @workspace/admin run dev

# Production build
pnpm --filter @workspace/admin run build
# Output: artifacts/admin/dist/ — serve as static files
```

### Clinical Portal

```bash
# Development
pnpm --filter @workspace/clinical-portal run dev

# Production build
pnpm --filter @workspace/clinical-portal run build
# Output: artifacts/clinical-portal/dist/ — serve as static files
```

### Mobile App (Expo)

```bash
# Development (Expo Go)
pnpm --filter @workspace/mobile run dev

# Build for production (EAS Build)
npx eas build --platform all
```

See the [Expo EAS documentation](https://docs.expo.dev/build/introduction/) for details on building production `.apk` / `.ipa` files.

---

## 5. Deploying to a VPS / Cloud Server

### Recommended Stack

- **Reverse proxy**: Nginx
- **Process manager**: PM2
- **SSL**: Let's Encrypt (Certbot)
- **Database**: Supabase (managed) — no self-hosting needed

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # API Server
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE support (order tracking)
        proxy_buffering off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_cache off;
        proxy_set_header Connection '';
        chunked_transfer_encoding on;
    }

    # Admin Dashboard
    location /admin/ {
        alias /var/www/fittrac/admin/dist/;
        try_files $uri $uri/ /admin/index.html;
    }

    # Clinical Portal
    location /clinical-portal/ {
        alias /var/www/fittrac/clinical-portal/dist/;
        try_files $uri $uri/ /clinical-portal/index.html;
    }
}
```

### PM2 Process (API Server)

```bash
# Install PM2
npm install -g pm2

# Start API server
cd artifacts/api-server
pm2 start dist/index.mjs --name "fittrac-api" --env production

# Save process list
pm2 save
pm2 startup
```

### Deploy Static Files

```bash
# Build
pnpm --filter @workspace/admin run build
pnpm --filter @workspace/clinical-portal run build

# Copy to web root
cp -r artifacts/admin/dist /var/www/fittrac/admin
cp -r artifacts/clinical-portal/dist /var/www/fittrac/clinical-portal
```

---

## 6. Deploying on Replit

Click **Deploy** in the Replit workspace. The platform will:
1. Build the API server
2. Start it on the configured port
3. Serve the admin and clinical portal under their paths

Set all environment variables in the **Secrets** panel before deploying.

---

## 7. Mobile App Distribution

### TestFlight / Google Play (Production)

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Configure: `eas build:configure`
4. Build: `eas build --platform all --profile production`
5. Submit: `eas submit --platform all`

### Environment for Mobile Build

In `artifacts/mobile/eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_DOMAIN": "your-domain.com"
      }
    }
  }
}
```

---

## 8. Credentials & Logins

### Admin Dashboard
| Username | Password |
|---|---|
| `admin` | `fittrac2026` |

**Change this before going live** — update `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `artifacts/api-server/src/routes/admin.ts` or move them to environment variables.

### Clinical Portal
| Username | Role | Password |
|---|---|---|
| `dr.amara` | Doctor | `doctor2026` |
| `dr.ifiok` | Doctor | `doctor2026` |
| `nutri.kezia` | Nutritionist | `nutri2026` |
| `nutri.chika` | Nutritionist | `nutri2026` |

These are seeded via `supabase/seed.sql`. Update passwords in the `clinical_staff` table.

### Mobile App
Users self-register. No default accounts.

---

## 9. Feature Flags & Production Readiness Checklist

- [ ] Run `supabase/schema.sql` on production Supabase project
- [ ] Run `supabase/seed.sql` for clinical staff accounts
- [ ] Change all default passwords (admin, clinical staff)
- [ ] Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in production environment
- [ ] Set `SESSION_SECRET` to a random 64-character string
- [ ] Set `AI_INTEGRATIONS_ANTHROPIC_API_KEY` for Vitara AI Coach
- [ ] Set `PAYSTACK_SECRET_KEY` for live payments
- [ ] Enable Supabase RLS policies on all tables
- [ ] Configure Nginx with SSL (Let's Encrypt)
- [ ] Set `NODE_ENV=production` on the API server
- [ ] Configure `EXPO_PUBLIC_DOMAIN` to point to your production domain
- [ ] Build and submit mobile app to App Store / Google Play

---

## 10. API Endpoints Reference

### Authentication (`/api/auth/`)
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/orders` | Get user's orders |
| POST | `/api/auth/orders` | Create an order |
| POST | `/api/auth/book-consultation` | Book a telemedicine consultation |

### Admin (`/api/admin/`)
| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/orders` | All orders |
| PATCH | `/api/admin/orders/:id/status` | Update order status (triggers SSE) |
| GET | `/api/admin/meals` | Menu items |
| GET | `/api/admin/analytics` | Order analytics |

### Clinical Portal (`/api/clinical-staff/`)
| Method | Path | Description |
|---|---|---|
| POST | `/api/clinical-staff/login` | Clinical staff login |
| GET | `/api/clinical-staff/dashboard` | Role-based dashboard data |
| GET | `/api/clinical-staff/patients` | Patient list |
| GET | `/api/clinical-staff/patients/:id` | Patient details |
| GET | `/api/clinical-staff/consultations` | Today's consultations |
| PATCH | `/api/clinical-staff/consultations/:id` | Update consultation |
| GET | `/api/clinical-staff/lab-results` | Lab results |
| GET/POST | `/api/clinical-staff/prescriptions` | Prescriptions |
| GET/POST | `/api/clinical-staff/meal-plans` | Meal plans |
| GET/POST | `/api/clinical-staff/session-notes` | Session notes |

### AI Coach (`/api/ai/`)
| Method | Path | Description |
|---|---|---|
| POST | `/api/ai/chat` | Streaming SSE chat with Vitara AI |
| POST | `/api/ai/recommendations` | AI meal recommendations |

### Payments (`/api/payments/`)
| Method | Path | Description |
|---|---|---|
| POST | `/api/payments/paystack/initialize` | Initialize Paystack transaction |
| GET | `/api/payments/paystack/verify/:ref` | Verify Paystack transaction |
| POST | `/api/payments/opay/initialize` | Initialize OPay transaction |

### Real-time Events (`/api/events/`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/events/stream` | SSE stream for order status updates |

---

## 11. Architecture Diagram

```
Mobile App (Expo)
      │
      ▼
Reverse Proxy (Nginx / Replit)
      │
      ├──/api/──────────── API Server (Express, Node.js)
      │                         │
      │                         ├── Supabase (PostgreSQL)
      │                         ├── Anthropic API (AI Coach)
      │                         └── Paystack API (Payments)
      │
      ├──/admin/──────────── Admin Dashboard (React + Vite, static)
      │
      └──/clinical-portal/── Clinical Portal (React + Vite, static)
```

---

## 12. Support

For issues with the codebase, refer to `replit.md` for the project structure overview. For Supabase-specific questions, see the [Supabase documentation](https://supabase.com/docs).
