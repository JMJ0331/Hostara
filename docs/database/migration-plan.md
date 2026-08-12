# Hostara v2 — Data Migration Plan

## 1. Migration Overview
This document outlines the step-by-step transition from in-memory / local storage data to Supabase PostgreSQL across Hostara's progressive phase roadmap.

| Source State | Destination Table | Phase |
|---|---|---|
| Hardcoded / Session User | `organizations` & `organization_members` | Phase 1 - 2 |
| In-Memory Property Store | `properties`, `property_groups`, `owners` | Phase 1 & 4 |
| In-Memory Reservations | `guests` & `reservations` | Phase 1 & 5 |
| In-Memory Cleaning Tasks | `cleaners` & `cleaning_tasks` | Phase 1 & 6 |
| Express iCal parser | `ical_connections` & `sync_logs` | Phase 1 & 7-8 |
| Financial Calculations | `financial_transactions` | Phase 1 & 9 |

## 2. Progressive Sync Architecture & Migrations
1. **Migrations List**:
   - `0001_initial_schema.sql` (Initial 13 tables & UUID setup)
   - `0002_indexes.sql` (Performance B-Tree indexes)
   - `0003_rls.sql` (Row Level Security enablement & tenant policies)
   - `0004_security_hardening.sql` (Function search_path protection & ON DELETE RESTRICT on property history)
2. **Phase Transition Plan**:
   - **Phase 1**: Database schema, Supabase JS client, RLS policies, and SQL migrations defined.
   - **Phase 2**: Supabase Auth replaces mock session tokens & connects `auth.users(id)`.
   - **Phase 3**: Strict JWT-authenticated RLS enforced per organization.
   - **Phase 4-9**: Each domain module transitions to real-time Supabase Data API calls.
