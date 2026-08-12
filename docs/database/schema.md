# Hostara v2 — Database Schema Specification

## 1. Core Tables

### `organizations`
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `slug` (TEXT, UNIQUE, NOT NULL)
- `logo_url` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### `organization_members`
- `id` (UUID, PK)
- `organization_id` (UUID, FK -> organizations)
- `user_id` (UUID)
- `role` (TEXT: owner, admin, manager, cleaner, member)
- `status` (TEXT: active, invited, suspended)
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT)

### `properties`
- `id` (UUID, PK)
- `organization_id` (UUID, FK -> organizations)
- `group_id` (UUID, FK -> property_groups, NULLABLE)
- `owner_id` (UUID, FK -> owners, NULLABLE)
- `name` (TEXT, NOT NULL)
- `address`, `type`, `status`
- `bedrooms`, `bathrooms`, `max_guests`
- `cleaning_fee`, `nightly_rate`
- `ical_url`

### `property_groups`
- `id` (UUID, PK)
- `organization_id` (UUID, FK)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)

### `owners`
- `id` (UUID, PK)
- `organization_id` (UUID, FK)
- `name` (TEXT, NOT NULL)
- `email`, `phone`, `bank_account`, `notes`

### `guests`
- `id` (UUID, PK)
- `organization_id` (UUID, FK)
- `name` (TEXT, NOT NULL)
- `email`, `phone`, `document_id`, `notes`

### `reservations`
- `id` (UUID, PK)
- `organization_id` (UUID, FK)
- `property_id` (UUID, FK)
- `guest_id` (UUID, FK, NULLABLE)
- `guest_name`, `guest_email`, `guest_phone`
- `check_in`, `check_out` (DATE)
- `guests_count`, `total_price`, `status`, `channel`, `notes`

### `cleaners` & `cleaning_tasks`
- Manage cleaning operations, assignments, task status (pending, in_progress, completed), costs, and scheduled dates.

### `ical_connections` & `sync_logs`
- Store external calendar feeds per property and historical sync logs.

### `financial_transactions`
- Financial ledger tracking income, cleaning costs, platform fees, payouts, and categories.

### `notifications`
- Persistence for system and operational notifications per organization/user.
