# Trust & Reputation Bounded Context — Sprint 3 Implementation Guide

> **Target audience:** AI coding agents that need to understand what exists and what Sprint 3 tasks remain.
> **Last updated:** 2026-06-10
> **Bounded context:** Trust & Reputation (Calificaciones y Reputación)
> **Epic:** EP-04

---

## 1. Architecture Overview

The Trust & Reputation bounded context follows the same **layered hexagonal/clean architecture** adapted for Angular. It handles post-trip ratings for both drivers and passengers, and exposes reputation scores.

### 1.1 Current Folder Structure

```
src/app/trust-reputation/
├── application/
│   └── trust-reputation.store.ts        # ✅ State management (signals)
├── domain/
│   └── model/
│       ├── trip-rating.entity.ts         # ✅ TripRating entity
│       ├── driver-reputation.entity.ts   # ✅ DriverReputation entity
│       └── passenger-reputation.entity.ts # ✅ PassengerReputation entity
├── infrastructure/
│   ├── trust-reputation-api.service.ts   # ⚠️ Mock data + partial POST
│   ├── rating-assembler.ts              # ✅ RatingResponse → TripRating
│   └── rating-response.ts              # ✅ DTO for /ratings
└── presentation/
    └── components/
        └── .gitkeep                     # ⚠️ Empty — no UI components exist
```

### 1.2 Sprint 3 Target Structure

```
src/app/trust-reputation/
├── application/
│   └── trust-reputation.store.ts        # 🔧 Extend: submitDriverRating, submitPassengerRating
├── domain/
│   └── model/
│       ├── trip-rating.entity.ts         # ✅ Complete
│       ├── driver-reputation.entity.ts   # ✅ Complete
│       └── passenger-reputation.entity.ts # ✅ Complete
├── infrastructure/
│   ├── trust-reputation-api.service.ts   # 🔧 Fix: environment import, add real GET/POST
│   ├── rating-assembler.ts              # 🔧 Extend: support passenger vs driver ratings
│   └── rating-response.ts              # 🔧 Extend: add ratedPartyType field
└── presentation/
    └── components/
        ├── rating-form/                  # 🆕 US-21, US-22 (star selector)
        ├── reputation-badge/             # 🆕 US-23 (stars display)
        └── rating-summary/              # 🆕 US-23 (profile section)
```

---

### 1.3 Mandatory Architecture Conventions (from `context.md`)

> **⚠️ CRITICAL:** Every AI agent generating code for this bounded context MUST follow these conventions. Derived from the canonical project guide at [`context.md`](context.md).

#### Angular 21 Coding Style

| Rule | Mandatory | Example |
|---|---|---|
| Property binding | `input()` signal, NOT `@Input()` | `ratedParty = input.required<'DRIVER' \| 'PASSENGER'>()` |
| Event emission | `output()`, NOT `@Output()` | `submitted = output<{ score: number }>()` |
| Control flow | `@for` / `@if`, NOT `*ngFor` / `*ngIf` | `@for (star of stars; track star) { ... }` |
| Dependency injection | `inject()`, NOT constructor injection | `private store = inject(TrustReputationStore)` |
| Standalone | ALL components `standalone: true` | `@Component({ standalone: true, ... })` |
| ProvidedIn | ALL services `providedIn: 'root'` | `@Injectable({ providedIn: 'root' })` |

#### Naming Conventions (English Only)

| Element | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `rating-form.ts`, `trust-reputation-api.service.ts` |
| Classes | `PascalCase` | `TrustReputationStore`, `RatingAssembler` |
| Properties/Methods | `camelCase` | `submitDriverRating()`, `averageScore` |
| Entity files | `<name>.entity.ts` | `trip-rating.entity.ts` |
| API services | `<context>-api.service.ts` | `trust-reputation-api.service.ts` |
| Assemblers | `<entity>-assembler.ts` | `rating-assembler.ts` |
| DTOs (Response) | `<endpoint>-response.ts` | `rating-response.ts` |
| Stores | `<context>.store.ts` | `trust-reputation.store.ts` |
| Component selectors | `app-<feature>` | `app-rating-form`, `app-reputation-badge` |

#### JSDoc — Mandatory on Every File

```typescript
/**
 * @summary [Purpose of this file in the Trust & Reputation bounded context.]
 * @author Sprint 3 — Trust & Reputation Bounded Context
 */
```

Every **public method** MUST have `@param` and description. Every **property/signal** MUST have an inline comment.

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
<h3>{{ 'trustReputation.rating.title' | translate }}</h3>
```

Translation keys in `public/i18n/es.json` under `"trustReputation": { ... }`.

#### Accessibility (a11y) Checklist

- [ ] Star buttons have `aria-label` (e.g., `aria-label="Calificar con 4 estrellas"`)
- [ ] Form inputs have associated `<label>`
- [ ] Status badges have screen-reader text

---

## 2. Domain Model — Entities

### 2.1 TripRating ✅ IMPLEMENTED

```typescript
// src/app/trust-reputation/domain/model/trip-rating.entity.ts
type RatingStatus = 'PENDING' | 'RATED' | 'SKIPPED' | 'EXPIRED';
type RatedPartyType = 'DRIVER' | 'PASSENGER';

class TripRating implements BaseEntity {
  id: string;
  tripId: string;
  driverId: string;
  passengerId: string;
  driverRatingStatus: RatingStatus;      // 'PENDING' by default
  passengerRatingStatus: RatingStatus;   // 'PENDING' by default
  driverScore: number;                   // 0 until rated
  passengerScore: number;                // 0 until rated
  passengerComment: string;             // Optional, for low scores
  rateableUntil: string;                // ISO date — 24h after trip completion

  openForRating(): void
  rateDriver(score: number): void
  ratePassenger(score: number): void
  skipDriverRating(): void
  skipPassengerRating(): void
  recordPassengerLowRatingComment(comment: string): void
  isStillRateable(): boolean
}
```

### 2.2 DriverReputation ✅ IMPLEMENTED

```typescript
class DriverReputation implements BaseEntity {
  id: string;
  driverId: string;
  averageScore: number;     // Rolling average
  totalRatings: number;     // Count of ratings received

  recalculate(newScore: number): void   // Updates running average
  hasRatings(): boolean
}
```

### 2.3 PassengerReputation ✅ IMPLEMENTED

```typescript
class PassengerReputation implements BaseEntity {
  id: string;
  passengerId: string;
  averageScore: number;
  totalRatings: number;

  recalculate(newScore: number): void
  hasRatings(): boolean
}
```

---

## 3. Infrastructure — API & Data

### 3.1 json-server Collections (`server/db.json`)

**Ratings collection (already exists — empty):**
```json
{
  "ratings": []
}
```

**Sprint 3 schema for rating entries:**
```json
{
  "ratings": [
    {
      "id": "rt-001",
      "rideId": "zNdsrkgXOCw",
      "driverId": "d-001",
      "passengerId": "u-001",
      "driverRatingStatus": "RATED",
      "passengerRatingStatus": "PENDING",
      "driverScore": 5,
      "passengerScore": 0,
      "passengerComment": "",
      "rateableUntil": "2026-06-11T12:00:00Z"
    }
  ]
}
```

**Drivers collection (already exists — needs ratingAverage/ratingCount):**
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

### 3.2 TrustReputationApiService ⚠️ NEEDS WORK

Located at `src/app/trust-reputation/infrastructure/trust-reputation-api.service.ts`.

**Critical bug to fix first:**
```typescript
// ❌ CURRENT (line 4):
import { environment } from '../../../environments/environment.development';
// ✅ SHOULD BE:
import { environment } from '../../../environments/environment';
```

**Current methods:**

| Method | Endpoint | Returns | Status |
|---|---|---|---|
| `getDriverReputation(driverId)` | — (mock) | `Observable<DriverReputation>` | ⚠️ Returns hardcoded mock data |
| `getPassengerReputation(passengerId)` | — (mock) | `Observable<PassengerReputation>` | ⚠️ Returns hardcoded mock data |
| `getTripRating(tripId)` | `GET /ratings?rideId={tripId}` | `Observable<TripRating>` | ⚠️ Reads from db.json but response may not match |
| `rateDriver(tripId, score)` | `POST /ratings` | `Observable<TripRating>` | ⚠️ POSTs but DTO mapping incomplete |
| `ratePassenger(tripId, score, comment)` | `POST /ratings` | `Observable<TripRating>` | ⚠️ POSTs but DTO mapping incomplete |

**Sprint 3 required changes:**

| Method | What to change | Story |
|---|---|---|
| `getDriverReputation(driverId)` | Replace mock with real `GET /ratings?driverId={id}` + calculate average | US-23 |
| `getPassengerReputation(passengerId)` | Replace mock with real `GET /ratings?passengerId={id}` + calculate average | US-23 |
| `getTripRating(tripId)` | Verify `rideId` field matches `ratings` collection in db.json | US-21, US-22 |
| `rateDriver(tripId, score)` | Update to PATCH existing rating or create if not exists. Update driver's ratingAverage. | US-21 |
| `ratePassenger(tripId, score, comment)` | Update to PATCH existing rating. Update passenger's ratingAverage. | US-22 |

**Key implementation detail — db.json `ratings` schema:**
The `ratings` collection uses `rideId` (not `tripId`). The `RatingAssembler` maps `response.rideId` → `entity.tripId`. Ensure consistency:
- `db.json`: `"rideId": "zNdsrkgXOCw"`
- `RatingResponse`: `rideId: string`
- `TripRating`: `tripId: string` (assembler maps it)

### 3.3 Response DTOs & Assemblers

| DTO | Assembler | Status |
|---|---|---|
| `RatingResponse` (id, rideId, rating, comment) | `RatingAssembler.toEntity()` | ⚠️ Needs extension for driverId, passengerId, separate scores |

**RatingResponse needs update for Sprint 3:**
```typescript
// 🆕 Extended RatingResponse
export interface RatingResponse {
  id: string;
  rideId: string;
  driverId: string;           // 🆕
  passengerId: string;        // 🆕
  driverRatingStatus: string; // 🆕 'PENDING' | 'RATED' | 'SKIPPED'
  passengerRatingStatus: string; // 🆕
  driverScore: number;        // 🆕 (replaces generic 'rating')
  passengerScore: number;     // 🆕
  passengerComment: string;   // Already exists
  rateableUntil: string;      // 🆕
}
```

**RatingAssembler needs update:**
```typescript
static toEntity(response: RatingResponse): TripRating {
  const entity = new TripRating();
  entity.id = response.id;
  entity.tripId = response.rideId;
  entity.driverId = response.driverId;
  entity.passengerId = response.passengerId;
  entity.driverRatingStatus = response.driverRatingStatus as RatingStatus;
  entity.passengerRatingStatus = response.passengerRatingStatus as RatingStatus;
  entity.driverScore = response.driverScore;
  entity.passengerScore = response.passengerScore;
  entity.passengerComment = response.passengerComment;
  entity.rateableUntil = response.rateableUntil;
  return entity;
}
```

---

## 4. Application — TrustReputationStore ✅ IMPLEMENTED — minor extensions

Located at `src/app/trust-reputation/application/trust-reputation.store.ts`.

**Current state signals:**

| Signal | Type | Description |
|---|---|---|
| `driverReputation` | `DriverReputation \| null` | Current driver's rating average |
| `passengerReputation` | `PassengerReputation \| null` | Current passenger's rating average |
| `currentRating` | `TripRating \| null` | Rating record for a specific trip |
| `isLoading` | `boolean` | API call in progress |
| `error` | `string \| null` | Last error message |
| `driverHasRatings` | `boolean` | Computed: driverReputation.hasRatings() |

**Current actions (all exist but need verification):**

| Method | Description | Story |
|---|---|---|
| `loadDriverReputation(driverId)` | Fetch driver reputation | US-23 |
| `loadPassengerReputation(passengerId)` | Fetch passenger reputation | US-23 |
| `loadTripRating(tripId)` | Fetch rating for a specific trip | US-21, US-22 |
| `submitDriverRating(tripId, score)` | Rate driver (1-5), validates range | US-21 |
| `submitPassengerRating(tripId, score, comment)` | Rate passenger (1-5), validates range | US-22 |
| `clearError()` | Reset error signal | — |

**Store is mostly complete.** Sprint 3 focus is on:
1. Verifying the store methods work with updated API service
2. Adding a `refreshReputation()` method that reloads after a rating is submitted
3. Ensuring `submitDriverRating` also calls `loadDriverReputation` after success to refresh the average

---

## 5. Presentation Components

### 5.1 RatingForm 🆕 US-21, US-22

- **Selector:** `app-rating-form`
- **File:** `src/app/trust-reputation/presentation/components/rating-form/rating-form.ts` 🆕
- **Inputs:**
  - `ratedParty: 'DRIVER' | 'PASSENGER'` — who is being rated
  - `ratedPartyName: string` — display name
  - `tripId: string` — the trip being rated
- **Outputs:**
  - `submitted: EventEmitter<{ score: number; comment?: string }>`
  - `skipped: EventEmitter<void>`
- **Behavior:**
  - Shows 5 clickable stars (☆/★) using Material Icons
  - Hover state: highlights stars up to hovered position
  - Selected state: fills stars up to selected score
  - If ratedParty is `PASSENGER` and score ≤ 2: shows optional comment textarea
  - Submit button disabled until a star is selected
  - "Omitir" (skip) button available
- **Template:** Inline (single .ts file)
- **Used by:** `passenger-request-page` (RIDE_COMPLETED state), `driver-dashboard-page` (RIDE_COMPLETED state)

**Integration points:**
```
passenger-request-page.html (RIDE_COMPLETED state):
  <app-rating-form
    ratedParty="DRIVER"
    [ratedPartyName]="rideStore.currentRide()?.driverName"
    [tripId]="rideStore.currentRide()?.id"
    (submitted)="onDriverRatingSubmitted($event)"
    (skipped)="onRatingSkipped()">
  </app-rating-form>

driver-dashboard-page.html (RIDE_COMPLETED state):
  <app-rating-form
    ratedParty="PASSENGER"
    [ratedPartyName]="rideStore.currentRide()?.passengerName"
    [tripId]="rideStore.currentRide()?.id"
    (submitted)="onPassengerRatingSubmitted($event)"
    (skipped)="onRatingSkipped()">
  </app-rating-form>
```

### 5.2 ReputationBadge 🆕 US-23

- **Selector:** `app-reputation-badge`
- **File:** `src/app/trust-reputation/presentation/components/reputation-badge/reputation-badge.ts` 🆕
- **Inputs:**
  - `averageScore: number | null` — rating average
  - `totalRatings: number` — count of ratings
  - `size: 'small' | 'medium' | 'large'` — display size (default: 'medium')
- **Behavior:**
  - Displays stars (☆/★) filled proportionally to average score
  - Shows numeric score (e.g., "4.8") and count (e.g., "(120)")
  - If no ratings (totalRatings = 0): shows "Sin calificaciones" with empty stars
- **Used by:** `profile-page` (US-04), driver cards, passenger info in ride views

### 5.3 RatingSummary 🆕 US-23

- **Selector:** `app-rating-summary`
- **File:** `src/app/trust-reputation/presentation/components/rating-summary/rating-summary.ts` 🆕
- **Inputs:**
  - `reputation: DriverReputation | PassengerReputation | null`
  - `role: 'DRIVER' | 'PASSENGER'`
- **Behavior:**
  - Wraps `ReputationBadge` with a labeled card
  - Shows "Reputación como conductor" or "Reputación como pasajero"
  - Handles loading and empty states
- **Used by:** `profile-page` (US-04, US-23)

---

## 6. Sprint 3 Scope — What Needs to Be Done

### 6.1 US-21 — Calificación post-viaje al conductor (Ready for UI)

**Status:** Partial — store exists, API service partially exists, no UI component.

| Task ID | Description | Priority |
|---|---|---|
| **TASK-US21-01** | Create `rating-form` component with 5-star selector | HIGH |
| **TASK-US21-02** | Integrate `rating-form` into `passenger-request-page` (RIDE_COMPLETED state) | HIGH |
| **TASK-US21-03** | Wire passenger page: `onDriverRatingSubmitted({score})` → `TrustReputationStore.submitDriverRating(tripId, score)` | HIGH |
| **TASK-US21-04** | After rating submission, create/update `ratings` entry in db.json with `driverRatingStatus: 'RATED'` | HIGH |
| **TASK-US21-05** | After rating, recalculate driver's `ratingAverage` in `drivers` collection via `PATCH /drivers/{id}` | MEDIUM |
| **TASK-US21-06** | Show confirmation toast: "Calificación enviada. ¡Gracias!" | MEDIUM |
| **TASK-US21-07** | Auto-hide rating form after submission or skip | LOW |
| **TASK-US21-08** | Handle edge case: trip not completed → rating blocked (store validates this) | LOW |

### 6.2 US-22 — Calificación post-viaje al pasajero (Ready for UI)

**Status:** Partial — store exists, no UI component.

| Task ID | Description | Priority |
|---|---|---|
| **TASK-US22-01** | Integrate `rating-form` into `driver-dashboard-page` (RIDE_COMPLETED state) | HIGH |
| **TASK-US22-02** | Wire driver page: `onPassengerRatingSubmitted({score, comment})` → `TrustReputationStore.submitPassengerRating(tripId, score, comment)` | HIGH |
| **TASK-US22-03** | Enable comment field in `rating-form` when `ratedParty === 'PASSENGER'` and score ≤ 2 | HIGH |
| **TASK-US22-04** | After rating, update `ratings` entry with `passengerRatingStatus: 'RATED'` | HIGH |
| **TASK-US22-05** | After rating, recalculate passenger's rating (store in profiles or separate aggregation) | MEDIUM |
| **TASK-US22-06** | Handle edge case: driver completes trip but doesn't rate → auto-skip after 24h (backend logic; frontend just shows "Calificar" prompt) | LOW |

### 6.3 US-23 — Visualización del puntaje de reputación (Ready for UI)

**Status:** Partial — store can load reputation, no UI component.

| Task ID | Description | Priority |
|---|---|---|
| **TASK-US23-01** | Create `reputation-badge` component (stars + numeric + count) | HIGH |
| **TASK-US23-02** | Create `rating-summary` component (wraps badge with label + loading/empty states) | HIGH |
| **TASK-US23-03** | Integrate `rating-summary` into `profile-page` — show reputation section | HIGH |
| **TASK-US23-04** | Fix `getDriverReputation(driverId)` to use real data from `GET /ratings?driverId={id}` instead of mock | HIGH |
| **TASK-US23-05** | Fix `getPassengerReputation(passengerId)` to use real data from `GET /ratings?passengerId={id}` instead of mock | HIGH |
| **TASK-US23-06** | Calculate average server-side or in the store from the ratings array | MEDIUM |
| **TASK-US23-07** | Add `reputation-badge` to driver cards shown in ride-dispatch (driver list, candidate list) | MEDIUM |
| **TASK-US23-08** | Handle empty state: "Aún no tienes calificaciones registradas" | MEDIUM |

---

## 7. Cross-Bounded-Context Integration

### 7.1 Trust & Reputation → Ride Dispatch

```
┌──────────────────────────────────────────────────────────────┐
│ passenger-request-page (RIDE_COMPLETED)                       │
│                                                               │
│   inject(TrustReputationStore)                                │
│                                                               │
│   <app-rating-form                                            │
│     ratedParty="DRIVER"                                       │
│     [tripId]="ride.id"                                        │
│     (submitted)="onDriverRatingSubmitted($event)">            │
│   </app-rating-form>                                          │
│                                                               │
│   onDriverRatingSubmitted(event):                             │
│     trustRepStore.submitDriverRating(tripId, event.score)     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ driver-dashboard-page (RIDE_COMPLETED)                        │
│                                                               │
│   inject(TrustReputationStore)                                │
│                                                               │
│   <app-rating-form                                            │
│     ratedParty="PASSENGER"                                    │
│     [tripId]="ride.id"                                        │
│     (submitted)="onPassengerRatingSubmitted($event)">         │
│   </app-rating-form>                                          │
│                                                               │
│   onPassengerRatingSubmitted(event):                          │
│     trustRepStore.submitPassengerRating(                      │
│       tripId, event.score, event.comment)                     │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Trust & Reputation → IAM (Profile)

```
┌──────────────────────────────────────────────────────────────┐
│ profile-page (US-04)                                          │
│                                                               │
│   inject(TrustReputationStore)                                │
│                                                               │
│   <app-rating-summary                                         │
│     [reputation]="trustRepStore.driverReputation()"           │
│     role="DRIVER">                                            │
│   </app-rating-summary>                                       │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 Trust & Reputation → Driver Management

```
┌──────────────────────────────────────────────────────────────┐
│ driver-dashboard-page / passenger-request-page                │
│                                                               │
│   Driver cards show reputation:                               │
│   <app-reputation-badge                                       │
│     [averageScore]="driver.ratingAverage"                     │
│     [totalRatings]="driver.ratingCount"                       │
│     size="small">                                             │
│   </app-reputation-badge>                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. File Naming Convention

| Concept | Pattern | Example |
|---|---|---|
| **Entity** | `{concept}.entity.ts` | `trip-rating.entity.ts` |
| **Store** | `trust-reputation.store.ts` | `trust-reputation.store.ts` |
| **API Service** | `trust-reputation-api.service.ts` | `trust-reputation-api.service.ts` |
| **API Response DTO** | `{concept}-response.ts` | `rating-response.ts` |
| **Assembler** | `{concept}-assembler.ts` | `rating-assembler.ts` |
| **Component** | `{feature-name}.ts` in own folder | `rating-form/rating-form.ts` |
| **Component selector** | `app-{feature-name}` | `app-rating-form`, `app-reputation-badge` |

---

## 9. Quick Reference — Key Files

| File | Purpose | Status |
|---|---|---|
| `src/app/trust-reputation/application/trust-reputation.store.ts` | State management (signals) | ✅ → 🔧 Verify methods |
| `src/app/trust-reputation/domain/model/trip-rating.entity.ts` | TripRating entity | ✅ Complete |
| `src/app/trust-reputation/domain/model/driver-reputation.entity.ts` | DriverReputation entity | ✅ Complete |
| `src/app/trust-reputation/domain/model/passenger-reputation.entity.ts` | PassengerReputation entity | ✅ Complete |
| `src/app/trust-reputation/infrastructure/trust-reputation-api.service.ts` | HTTP gateway | ⚠️ Fix env import + mock data |
| `src/app/trust-reputation/infrastructure/rating-response.ts` | DTO for /ratings | 🔧 Extend fields |
| `src/app/trust-reputation/infrastructure/rating-assembler.ts` | RatingResponse → TripRating | 🔧 Extend mapping |
| `src/app/trust-reputation/presentation/components/rating-form/rating-form.ts` | Star rating form (5 stars) | 🆕 Create |
| `src/app/trust-reputation/presentation/components/reputation-badge/reputation-badge.ts` | Stars + score display | 🆕 Create |
| `src/app/trust-reputation/presentation/components/rating-summary/rating-summary.ts` | Labeled reputation section | 🆕 Create |
| `server/db.json` → `ratings` collection | Rating records | 🔧 Seed with sample entries |
| `server/db.json` → `drivers` collection | Driver ratingAverage/Count | ✅ Already exists |
| `src/app/ride-dispatch/.../passenger-request-page.ts` | Consumer (US-21) | 🔧 Add rating form after RIDE_COMPLETED |
| `src/app/ride-dispatch/.../driver-dashboard-page.ts` | Consumer (US-22) | 🔧 Add rating form after RIDE_COMPLETED |
| `src/app/iam/.../profile-page/profile-page.ts` | Consumer (US-23) | 🔧 Add reputation section |

---

## 10. Summary

**Trust & Reputation Sprint 3 scope:**

| Story | Description | Status | New Files |
|---|---|---|---|
| 🆕 **US-21** | Rate driver (passenger side) | Store exists, no UI | `rating-form` component |
| 🆕 **US-22** | Rate passenger (driver side) | Store exists, no UI | (reuses rating-form) |
| 🆕 **US-23** | Display reputation scores | Store exists, no UI | `reputation-badge`, `rating-summary` |

**Key architectural decisions:**
- A single `rating-form` component serves both US-21 and US-22, parameterized by `ratedParty` input
- Reputation data lives in two places: `ratings` collection (raw data) and `drivers.ratingAverage` (denormalized for quick display)
- The trust-reputation bounded context is consumed by ride-dispatch (for rating submission) and IAM (for profile display)
- Both `environment.development` imports must be fixed to `environment`

**Bug to fix BEFORE starting:**
- `trust-reputation-api.service.ts:4` — `environment.development` → `environment`
