# HOSTARA V2 — DOCUMENTO DE AUDITORÍA Y PREPARACIÓN (FASE 0)

## 1. Visión General del Proyecto Actual
Hostara es una plataforma para gestión de propiedades de alquiler vacacional, reservas, control de limpiezas, gestión de propietarios, sincronización iCal y reportes financieros.

 Actua en un entorno full-stack (React + Express + Vite).

---

## 2. Diagnóstico de Arquitectura y Componentes
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v4 + Motion.
- **Backend**: Express en `server.ts` con API REST (`/api/*`).
- **Almacenamiento actual**:
  - En el backend (`server.ts`): Memoria del proceso mediante `Map<string, UserStore>` indexado por `x-user-email` (Header de petición).
  - En el frontend: `localStorage` / `sessionStorage` para guardar token mock de sesión (`hostara_session`).
- **Autenticación actual**:
  - Simulada en memoria en `server.ts` con arreglo `users: AuthUser[]`.
  - Códigos de verificación de 6 dígitos registrados en `console.log` (modo dev).
  - Tokens simulados del tipo `jwt-token-<user-id>`.

---

## 3. Matriz de Componentes y Módulos
| Módulo | Estado | Persistencia Actual | Destino Futuro |
|---|---|---|---|
| Autenticación | PARCIAL / MOCK | In-Memory (`users[]`) | Supabase Auth |
| Propiedades | IMPLEMENTADO | In-Memory (`userStores`) | PostgreSQL (`properties`) |
| Complejos / Grupos | IMPLEMENTADO | In-Memory (`customGroups`) | PostgreSQL (`property_groups`) |
| Reservas | IMPLEMENTADO | In-Memory (`reservations`) | PostgreSQL (`reservations`) |
| Limpiezas (Cleaning) | IMPLEMENTADO | In-Memory (`cleaningTasks`) | PostgreSQL (`cleaning_tasks`) |
| Propietarios (Owners) | IMPLEMENTADO | In-Memory (`owners`) | PostgreSQL (`owners`) |
| Personal de Limpieza | PARCIAL (Client State) | React State (`cleaners`) | PostgreSQL (`cleaner_staff`) |
| Sincronización iCal | IMPLEMENTADO | Parser `icalParser.ts` + Express Endpoint | iCal Engine + Background Jobs |
| Finanzas / Reportes | IMPLEMENTADO | Cálculo dinámico en Express (`/api/stats`) | Vistas / SQL Aggregations |
| PWA / Service Worker | IMPLEMENTADO | Service Worker (`sw.js`) + Manifest | PWA Cache + Web Push Notifications |

---

## 4. Hoja de Ruta de Migración (Fases 0 a 15)
- **Fase 0**: Auditoría y Preparación (Completada)
- **Fase 1**: Supabase + PostgreSQL (Definición de Schema & Prisma / Client setup)
- **Fase 2**: Authentication + Users
- **Fase 3**: Roles + Permissions + Multi-tenancy
- **Fase 4**: Properties + Groups + Owners
- **Fase 5**: Guests + Reservations
- **Fase 6**: Cleaning Operations
- **Fase 7**: iCal + Synchronization
- **Fase 8**: Jobs + Automation
- **Fase 9**: Financials
- **Fase 10**: Dashboard + Reports
- **Fase 11**: Notifications
- **Fase 12**: Audit Logs
- **Fase 13**: SaaS Billing
- **Fase 14**: Security + Testing + Production Hardening
- **Fase 15**: AI + Advanced Features
