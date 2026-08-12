# Hostara v2 — Supabase & PostgreSQL Architecture

## 1. Overview
Hostara v2 transitions from a single-node in-memory store to a cloud-native, multi-tenant relational architecture powered by Supabase PostgreSQL and Row Level Security (RLS).

```text
React 18 + Vite (Frontend)
       │
       ▼
Supabase Client (@supabase/supabase-js)
       │
       ▼
Supabase Data API (REST / PostgREST)
       │
       ▼
PostgreSQL Engine (Row Level Security enabled)
```

## 2. Multi-Tenancy Strategy
All business entities belong to an **Organization** (`organization_id`).

Isolation is enforced at the database level using PostgreSQL Row Level Security (RLS):
- Every query routed through Supabase Data API passes through RLS policies.
- Policies verify `auth.uid()` against `organization_members` for active membership.

## 3. Data Flow
1. **Client Request**: React UI triggers a query or mutation via `supabase.from('properties')`.
2. **Data API**: Supabase verifies the JWT token sent in `Authorization: Bearer <token>`.
3. **RLS Policy Check**: PostgreSQL executes `is_org_member(organization_id)` check.
4. **Result**: Only records owned by the user's active organization are returned or modified.

## 4. Security & Environment Variable Isolation
- **Public Variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`) are safe for browser execution.
- **Secret Variables**: `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are strictly server-side only and never imported into frontend code.
