# Driver Management Bounded Context — Sprint 3 Implementation Guide

> **Target audience:** AI coding agents that need to understand what exists and what Sprint 3 tasks remain.
> **Last updated:** 2026-06-10
> **Bounded context:** Driver Management (Gestión de Conductores)
> **Epics:** EP-01 (US-06), EP-05 (US-26)

---

## 1. Architecture Overview

The Driver Management bounded context handles driver profiles, document verification, and operational status management. It follows the same **4-layer hexagonal/clean architecture** as IAM and Monetization.

### 1.1 Current Folder Structure

```
src/app/driver-management/
├── application/
│   └── driver-management.store.ts          # ✅ State management (signals)
├── domain/
│   └── model/
│       ├── driver.entity.ts                 # ✅ Driver entity
│       ├── driver-document.entity.ts        # ✅ DriverDocument entity
│       └── verification-review.entity.ts    # ✅ VerificationReview entity
├── infrastructure/
│   ├── driver-management-api.service.ts     # ⚠️ Mock data + partial implementation
│   ├── driver-assembler.ts                  # ✅ DriverResponse → Driver
│   └── driver-response.ts                  # ✅ DTO for /drivers
└── presentation/
    └── components/
        └── .gitkeep                         # ⚠️ Empty — no UI components
```

### 1.2 Sprint 3 Target Structure

```
src/app/driver-management/
├── application/
│   └── driver-management.store.ts          # 🔧 Extend: loadAllDrivers, toggleDriverStatus
├── domain/
│   └── model/
│       ├── driver.entity.ts                 # ✅ Complete
│       ├── driver-document.entity.ts        # ✅ Complete
│       └── verification-review.entity.ts    # ✅ Complete
├── infrastructure/
│   ├── driver-management-api.service.ts     # 🔧 Fix env import, add real API calls
│   ├── driver-assembler.ts                  # ✅ Complete
│   └── driver-response.ts                  # ✅ Complete
└── presentation/
    └── components/
        ├── drivers-management-page/         # 🆕 US-26 + US-06 (admin panel)
        │   ├── drivers-management-page.ts
        │   ├── drivers-management-page.html
        │   └── drivers-management-page.css
        ├── drivers-table/                   # 🆕 US-26
        │   ├── drivers-table.ts
        │   ├── drivers-table.html
        │   └── drivers-table.css
        └── driver-verification-card/        # 🆕 US-06
            ├── driver-verification-card.ts
            ├── driver-verification-card.html
            └── driver-verification-card.css
```

> **Note:** The admin dashboard entry point (`/admin/drivers`) routes to these components. Admin is NOT a separate bounded context — it's a cross-cutting role whose UI leverages components from Driver Management, Monetization, and IAM.

### 1.3 Mandatory Architecture Conventions (from `context.md`)

> **⚠️ CRITICAL:** Every AI agent generating code for this bounded context MUST follow these conventions. Derived from the canonical project guide at [`context.md`](context.md).

#### Angular 21 Coding Style

| Rule | Mandatory | Example |
|---|---|---|
| Property binding | `input()` signal, NOT `@Input()` | `drivers = input.required<Driver[]>()` |
| Event emission | `output()`, NOT `@Output()` | `approve = output<string>()` |
| Control flow | `@for` / `@if`, NOT `*ngFor` / `*ngIf` | `@for (d of drivers(); track d.id) { ... }` |
| Dependency injection | `inject()`, NOT constructor injection | `private store = inject(DriverManagementStore)` |
| Standalone | ALL components `standalone: true` | `@Component({ standalone: true, ... })` |
| ProvidedIn | ALL services `providedIn: 'root'` | `@Injectable({ providedIn: 'root' })` |

#### Naming Conventions (English Only)

| Element | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `drivers-table.ts`, `driver-management-api.service.ts` |
| Classes | `PascalCase` | `DriverManagementStore`, `DriverAssembler` |
| Properties/Methods | `camelCase` | `approveDriver()`, `loadAllDrivers` |
| Entity files | `<name>.entity.ts` | `driver.entity.ts` |
| API services | `<context>-api.service.ts` | `driver-management-api.service.ts` |
| Assemblers | `<entity>-assembler.ts` | `driver-assembler.ts` |
| DTOs (Response) | `<endpoint>-response.ts` | `driver-response.ts` |
| Stores | `<context>.store.ts` | `driver-management.store.ts` |
| Component selectors | `app-<feature>` | `app-drivers-table` |

#### JSDoc — Mandatory on Every File

```typescript
/**
 * @summary [Purpose of this file in the Driver Management bounded context.]
 * @author Sprint 3 — Driver Management Bounded Context
 */
```

#### Component File Structure (3 Separate Files)

```
presentation/components/<feature>/
├── <feature>.ts          # Component logic + imports
├── <feature>.html        # Template (use @if / @for)
└── <feature>.css         # Styles (plain CSS)
```

> **Never** use inline `template:` or `styles:`. Always 3 separate files.

#### Layer-Specific Patterns (Quick Reference)

| Layer | Pattern | Key Rule |
|---|---|---|
| **Entity** | Plain class, default property values, business methods | No Angular decorators, no HttpClient |
| **DTO** | `interface` with exact `db.json` field names | Use `interface`, not `class` |
| **Assembler** | Static methods: `toEntity()`, `toResponse()` | No `@Injectable` |
| **API Service** | `inject(HttpClient)`, `environment.apiBaseUrl`, returns `Observable<Entity>` | NEVER import `environment.development` |
| **Store** | Private `signal()`, public `computed()`, actions subscribe to API | Use `inject()` for deps |
| **Component** | `input.required<>()` for data, `output()` for events, `@for`/`@if` in template | Separate .ts/.html/.css |

#### i18n — All user-visible static text via `@ngx-translate`

```html
<h2>{{ 'driverManagement.verification.title' | translate }}</h2>
```

#### Accessibility (a11y) Checklist

- [ ] Data tables have proper `<th>` headers
- [ ] Approve/Reject buttons have `aria-label`
- [ ] Status badges have screen-reader text

---

## 2. Domain Model — Entities

### 2.1 Driver ✅ IMPLEMENTED

```typescript
// src/app/driver-management/domain/model/driver.entity.ts
type DriverAccessStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'RESTRICTED';

class Driver implements BaseEntity {
  id: string;
  accountId: string;
  fullName: string;
  vehicleType: string;
  ratingAverage: number;
  photoUrl: string;
  isAvailable: boolean;
  accessStatus: DriverAccessStatus;

  approve(): void    // Sets accessStatus = 'ACTIVE'
  restrict(): void   // Sets accessStatus = 'RESTRICTED'
  toggleAvailability(): void
}
```

### 2.2 DriverDocument ✅ IMPLEMENTED

```typescript
class DriverDocument implements BaseEntity {
  id: string;
  driverId: string;
  documentType: 'LICENSE' | 'SOAT' | 'TECHNICAL_INSPECTION' | 'PROPERTY_CARD';
  documentNumber: string;
  fileUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  approve(): void
  reject(): void
}
```

### 2.3 VerificationReview ✅ IMPLEMENTED

```typescript
class VerificationReview implements BaseEntity {
  id: string;
  driverId: string;
  reviewerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments: string;
  reviewedAt: string;

  approve(comments: string): void
  reject(comments: string): void
}
```

---

## 3. Infrastructure — API & Data

### 3.1 json-server Collections (`server/db.json`)

**Drivers collection (already exists):**
```json
{
  "drivers": [
    {
      "id": "d-001",
      "accountId": "u-002",
      "fullName": "Carlos Mendoza",
      "vehicleType": "Mototaxi",
      "verificationStatus": "APPROVED",
      "operationalStatus": "ENABLED",
      "ratingAverage": 4.8,
      "ratingCount": 120,
      "photoUrl": "https://i.pravatar.cc/150?img=33"
    }
  ]
}
```

**Sprint 3 additions — seed a pending driver for US-06:**
```json
{
  "id": "d-002",
  "accountId": "u-004",
  "fullName": "Luis Torres",
  "vehicleType": "Mototaxi",
  "verificationStatus": "PENDING_VERIFICATION",
  "operationalStatus": "ENABLED",
  "ratingAverage": 0,
  "ratingCount": 0,
  "photoUrl": "https://i.pravatar.cc/150?img=55"
}
```

### 3.2 DriverManagementApiService ⚠️ NEEDS WORK

Located at `src/app/driver-management/infrastructure/driver-management-api.service.ts`.

**Critical bug to fix first:**
```typescript
// ❌ CURRENT (line 4):
import { environment } from '../../../environments/environment.development';
// ✅ SHOULD BE:
import { environment } from '../../../environments/environment';
```

**Current methods:**

| Method | Endpoint | Status |
|---|---|---|
| `getDriverByAccountId(accountId)` | `GET /drivers?accountId={id}` | ✅ Real API |
| `getDriverDocuments(driverId)` | — | ❌ Returns empty array (stub) |
| `getPendingVerifications()` | — | ❌ Returns empty array (stub) |
| `approveDriver(id, reviewerId, comments)` | — | ❌ Returns mock (no PATCH) |
| `rejectDriver(id, reviewerId, comments)` | — | ❌ Returns mock (no PATCH) |

**Sprint 3 methods to add or fix:**

| Method | Endpoint | Story |
|---|---|---|
| `getAllDrivers()` | `GET /drivers` | US-26 |
| `getDriversByStatus(verificationStatus)` | `GET /drivers?verificationStatus={status}` | US-06 |
| `getDriverDocuments(driverId)` | `GET /driverDocuments?driverId={id}` → REAL call | US-06 |
| `approveDriver(driverId)` | `PATCH /drivers/{id} { verificationStatus: 'APPROVED' }` | US-06 |
| `rejectDriver(driverId, reason)` | `PATCH /drivers/{id} { verificationStatus: 'REJECTED' }` | US-06 |
| `setDriverOperationalStatus(driverId, status)` | `PATCH /drivers/{id} { operationalStatus }` | US-26 |

### 3.3 Response DTOs & Assemblers

| DTO | Assembler | Status |
|---|---|---|
| `DriverResponse` (id, accountId, fullName, vehicleType, verificationStatus, operationalStatus, ratingAverage, ratingCount, photoUrl) | `DriverAssembler.toEntity()` | ✅ Complete |

---

## 4. Application — DriverManagementStore ✅ IMPLEMENTED — needs extension

Located at `src/app/driver-management/application/driver-management.store.ts`.

**Current state signals:**

| Signal | Type | Description |
|---|---|---|
| `driver` | `Driver \| null` | Current driver profile |
| `documents` | `DriverDocument[]` | Driver's documents |
| `pendingVerifications` | `VerificationReview[]` | Pending reviews |
| `pendingVerificationCount` | `number` | Count of pending |
| `isLoading` | `boolean` | API call in progress |
| `error` | `string \| null` | Last error |

**Current actions:**

| Method | Story | Status |
|---|---|---|
| `loadDriverByAccountId(accountId)` | US-03 | ✅ Real |
| `loadDriverDocuments(driverId)` | US-06 | ⚠️ Returns empty (stub API) |
| `loadPendingVerifications()` | US-06 | ⚠️ Returns empty (stub API) |
| `approveDriver(id, reviewerId, comments)` | US-06 | ⚠️ Mock only |
| `rejectDriver(id, reviewerId, comments)` | US-06 | ⚠️ Mock only |

**Sprint 3 actions to add:**

| Method | Story | Description |
|---|---|---|
| `loadAllDrivers()` | US-26 | GET /drivers → allDriversSignal |
| `getDriversByStatus(status)` | US-06 | GET /drivers?verificationStatus={status} |
| `toggleDriverOperationalStatus(driverId, enabled)` | US-26 | PATCH /drivers/{id} |
| `approveDriver(driverId)` | US-06 | Real PATCH — auto-uses current admin as reviewer |
| `rejectDriver(driverId, reason)` | US-06 | Real PATCH + mandatory reason |

---

## 5. Presentation Components

### 5.1 DriversManagementPage 🆕 US-06, US-26

- **Selector:** `app-drivers-management-page`
- **Files:**
  - `drivers-management-page.ts`
  - `drivers-management-page.html`
  - `drivers-management-page.css`
- **Route:** `/admin/drivers` (loaded via admin dashboard in IAM)
- **Behavior:**
  - Two tabs: "Pendientes de verificación" (US-06) and "Todos los conductores" (US-26)
  - Tab 1: `@for (d of store.pendingDrivers(); track d.id)` → `<app-driver-verification-card>`
  - Tab 2: `<app-drivers-table [drivers]="store.allDrivers()">`
  - Summary bar: total drivers, pending count, active count
  - Inject `DriverManagementStore`

### 5.2 DriversTable 🆕 US-26

- **Selector:** `app-drivers-table`
- **Files:** `drivers-table.ts`, `drivers-table.html`, `drivers-table.css`
- **Inputs:** `drivers = input.required<Driver[]>()`, `loading = input<boolean>(false)`
- **Outputs:** `toggleStatus = output<{ driverId: string; enabled: boolean }>()`
- **Behavior:**
  - Table columns: Photo, Name, Email, Status badge, Rating, Actions
  - Status: `@if (d.accessStatus === 'ACTIVE') { ... }` — colored badges
  - Toggle enable/disable per row
  - Click row to expand details

### 5.3 DriverVerificationCard 🆕 US-06

- **Selector:** `app-driver-verification-card`
- **Files:** `driver-verification-card.ts`, `driver-verification-card.html`, `driver-verification-card.css`
- **Inputs:** `driver = input.required<Driver>()`
- **Outputs:**
  - `approve = output<string>()` — emits driverId
  - `reject = output<{ driverId: string; reason: string }>()`
- **Behavior:**
  - Card: driver photo, fullName, vehicleType, registration info
  - "Aprobar" (green) and "Rechazar" (red) buttons
  - Rechazar opens inline textarea for mandatory reason
  - After action: card shows result and fades out

---

## 6. Sprint 3 Scope — What Needs to Be Done

### 6.1 US-06 — Verificación de documentos del conductor (Ready for UI)

**Status:** Partial — entities and store exist, but API calls are stubs, no UI.

| Task ID | Description | Priority |
|---|---|---|
| **TASK-US06-01** | Seed `d-002` with `PENDING_VERIFICATION` in `db.json` | HIGH |
| **TASK-US06-02** | Fix `getDriverDocuments()` — real `GET /driverDocuments?driverId={id}` | HIGH |
| **TASK-US06-03** | Fix `getPendingVerifications()` — real `GET /drivers?verificationStatus=PENDING_VERIFICATION` | HIGH |
| **TASK-US06-04** | Fix `approveDriver()` — real `PATCH /drivers/{id}` with `verificationStatus: 'APPROVED'` | HIGH |
| **TASK-US06-05** | Fix `rejectDriver()` — real `PATCH /drivers/{id}` with `verificationStatus: 'REJECTED'` | HIGH |
| **TASK-US06-06** | Create `DriverVerificationCard` component (3 files) | HIGH |
| **TASK-US06-07** | Create `DriversManagementPage` with "Pendientes" tab | HIGH |
| **TASK-US06-08** | Add route `/admin/drivers` in `app.routes.ts` | HIGH |
| **TASK-US06-09** | Reject dialog: mandatory reason textarea | MEDIUM |
| **TASK-US06-10** | Show confirmation after approve/reject | MEDIUM |

### 6.2 US-26 — Panel de administración de conductores (Ready for UI)

**Status:** Pending — no UI, no list endpoint.

| Task ID | Description | Priority |
|---|---|---|
| **TASK-US26-01** | Add `getAllDrivers()` → `GET /drivers` in API service | HIGH |
| **TASK-US26-02** | Add `setDriverOperationalStatus(id, status)` → `PATCH /drivers/{id}` in API service | HIGH |
| **TASK-US26-03** | Add `loadAllDrivers()` + `toggleDriverOperationalStatus()` in store | HIGH |
| **TASK-US26-04** | Create `DriversTable` component (3 files) | HIGH |
| **TASK-US26-05** | Add "Todos los conductores" tab in `DriversManagementPage` | HIGH |
| **TASK-US26-06** | Implement enable/disable toggle with confirmation | MEDIUM |
| **TASK-US26-07** | Colored status badges: ACTIVE=green, RESTRICTED=red, PENDING_VERIFICATION=yellow | MEDIUM |

### 6.3 Bug fix

| Task ID | Description | Priority |
|---|---|---|
| **TASK-DM-BUG-01** | Fix `driver-management-api.service.ts:4` — `environment.development` → `environment` | CRITICAL |

---

## 7. Cross-Bounded-Context Integration

### 7.1 Driver Management → IAM (Admin Dashboard)

```
┌──────────────────────────────────────────────────────────────┐
│ Admin dashboard (IAM) → routes to driver-management pages     │
│                                                               │
│   /admin/drivers → DriversManagementPage                      │
│     → inject(DriverManagementStore)                           │
│     → loadPendingVerifications() + loadAllDrivers()           │
│                                                               │
│   Tab 1: DriverVerificationCard[]                             │
│     → approve.emit(driverId) → store.approveDriver()          │
│     → reject.emit({driverId, reason}) → store.rejectDriver()  │
│                                                               │
│   Tab 2: DriversTable                                         │
│     → toggleStatus.emit({driverId, enabled})                  │
│     → store.toggleDriverOperationalStatus()                   │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Driver Management → Ride Dispatch

```
┌──────────────────────────────────────────────────────────────┐
│ driver-dashboard-page (ride-dispatch)                         │
│                                                               │
│   inject(DriverManagementStore)                               │
│                                                               │
│   constructor():                                              │
│     account = iamStore.currentAccount()                       │
│     driverMgmtStore.loadDriverByAccountId(account.id)         │
│                                                               │
│   Template:                                                   │
│     driver = driverMgmtStore.driver()                         │
│     drivers' isAvailable, ratingAverage, photoUrl used        │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Quick Reference — Key Files

| File | Purpose | Status |
|---|---|---|
| `src/app/driver-management/application/driver-management.store.ts` | State management | ✅ → 🔧 Extend |
| `src/app/driver-management/domain/model/driver.entity.ts` | Driver entity | ✅ Complete |
| `src/app/driver-management/domain/model/driver-document.entity.ts` | DriverDocument entity | ✅ Complete |
| `src/app/driver-management/domain/model/verification-review.entity.ts` | VerificationReview entity | ✅ Complete |
| `src/app/driver-management/infrastructure/driver-management-api.service.ts` | HTTP gateway | 🔧 Fix env + stubs |
| `src/app/driver-management/infrastructure/driver-response.ts` | DTO for /drivers | ✅ Complete |
| `src/app/driver-management/infrastructure/driver-assembler.ts` | DriverResponse → Driver | ✅ Complete |
| `src/app/driver-management/presentation/components/drivers-management-page/` | Admin drivers page (3 files) | 🆕 US-06, US-26 |
| `src/app/driver-management/presentation/components/drivers-table/` | Drivers data table (3 files) | 🆕 US-26 |
| `src/app/driver-management/presentation/components/driver-verification-card/` | Pending driver card (3 files) | 🆕 US-06 |
| `server/db.json` → `drivers` | Driver records | 🔧 Seed d-002 |
| `src/app/app.routes.ts` | Routes | 🔧 Add /admin/drivers |

---

## 9. Summary

**Driver Management Sprint 3 scope:**

| Story | Description | New Files | Files Modified |
|---|---|---|---|
| 🐛 **BUG** | Fix `environment.development` import | 0 | 1 |
| 🆕 **US-06** | Driver document verification | `driver-verification-card` (3 files), `drivers-management-page` (3 files) | `driver-management-api.service.ts`, `driver-management.store.ts`, `db.json`, `app.routes.ts` |
| 🆕 **US-26** | Driver management panel | `drivers-table` (3 files) | `driver-management-api.service.ts`, `driver-management.store.ts` |
| 🔗 **US-20** | Fare configuration (admin) | — | Goes in **Monetization** bounded context (see `docs/monetization.md`) |

**Where admin functionality lives:**

```
Admin role (IAM) → routes to:
  ├── /admin/drivers    → DriverManagement components (US-06, US-26)
  └── /admin/fare-config → Monetization components (US-20)
```

> **Admin is NOT a bounded context.** It is a cross-cutting **role** whose UI delegates to the bounded contexts that own the data: Driver Management and Monetization.
