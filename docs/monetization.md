# Monetization Bounded Context — Sprint 2 Implementation Guide

> **Target audience:** AI coding agents that need to understand what already exists, what the bounded context architecture mandates, and what Sprint 2 tasks remain to be completed.
> **Last updated:** 2026-06-09

---

## 1. Architecture Overview

The Monetization bounded context follows a **layered hexagonal/clean architecture** adapted for Angular. The canonical source of truth is the PlantUML diagram at [`docs/bounded-context/monetization/monetization.puml`](bounded-context/monetization/monetization.puml).

### 1.1 Architectural Layers

```
src/app/monetization/
├── application/                 # Store (state management + orchestration)
│   └── monetization.store.ts
├── domain/
│   └── model/                   # Domain entities (pure logic, no Angular)
│       ├── fare-policy.entity.ts
│       ├── wallet.entity.ts
│       └── wallet-transaction.entity.ts
├── infrastructure/              # API gateways, DTOs, assemblers
│   ├── monetization-api.service.ts
│   ├── fare-config-assembler.ts
│   ├── fare-config-response.ts
│   ├── wallet-assembler.ts
│   └── wallet-response.ts
└── presentation/
    └── components/              # UI components (standalone Angular)
        ├── fare-summary-card/
        │   └── fare-summary-card.ts
        ├── wallet-balance-card/
        │   └── wallet-balance-card.ts
        └── .gitkeep
```

### 1.2 Layer Responsibility Map

| Layer | Responsibility | Pattern to Follow |
|---|---|---|
| **domain/model/** | Pure entities with business logic methods. No Angular decorators, no HTTP, no UI concerns. | `class FarePolicy` with `calculate(distanceKm): number`. Extends nothing, or implements `BaseEntity`. |
| **infrastructure/** | HTTP calls to json-server, raw DTOs matching `db.json` structure, static assembler classes that map DTO → Entity. | `MonetizationApiService` with `getFarePolicy(): Observable<FarePolicy>`. Assemblers use `static toEntity(response: XResponse): XEntity`. |
| **application/** | State management via Angular signals. Orchestrates API calls and exposes computed state. | `MonetizationStore` as `@Injectable({ providedIn: 'root' })`. Uses `inject()` for dependencies. |
| **presentation/** | Standalone Angular components that consume the store and emit events. | `@Component({ standalone: true })`. Receives data via `@Input()`, emits actions via `@Output()`. NO direct API calls. |

---

### 1.3 Mandatory Architecture Conventions (from `context.md`)

> **⚠️ CRITICAL:** Every AI agent generating code for this bounded context MUST follow these conventions. They are derived from the canonical project guide at [`context.md`](context.md). Violating them produces non-reviewable code.

#### 1.3.1 Angular 21 Coding Style

| Rule | Mandatory | Example |
|---|---|---|
| **Property binding** | Use `input()` signal, NOT `@Input()` decorator | `item = input.required<FarePolicy>()` |
| **Event emission** | Use `output()` function, NOT `@Output()` decorator | `confirmed = output<number>()` |
| **Control flow** | Use `@for` / `@if`, NOT `*ngFor` / `*ngIf` | `@for (item of items(); track item.id) { ... }` |
| **Dependency injection** | Use `inject()`, NOT constructor injection | `private store = inject(MonetizationStore)` |
| **Standalone** | ALL components are `standalone: true` | `@Component({ standalone: true, ... })` |
| **ProvidedIn** | ALL services use `providedIn: 'root'` | `@Injectable({ providedIn: 'root' })` |

#### 1.3.2 Naming Conventions (English Only)

| Element | Convention | Example |
|---|---|---|
| **Files** | `kebab-case` | `wallet-balance-card.ts`, `monetization-api.service.ts` |
| **Classes** | `PascalCase` | `MonetizationStore`, `WalletAssembler` |
| **Properties / Methods** | `camelCase` | `loadWallet()`, `hasPositiveBalance` |
| **Entity files** | `<name>.entity.ts` | `wallet.entity.ts` |
| **API services** | `<context>-api.service.ts` | `monetization-api.service.ts` |
| **Assemblers** | `<entity>-assembler.ts` | `wallet-assembler.ts` |
| **DTOs (Response)** | `<endpoint>-response.ts` | `fare-config-response.ts` |
| **Stores** | `<context>.store.ts` | `monetization.store.ts` |
| **Component selectors** | `app-<feature>` | `app-fare-summary-card` |

#### 1.3.3 JSDoc — Mandatory on Every File

Every `.ts` file MUST start with:

```typescript
/**
 * @summary Brief description of the file's purpose in the Monetization bounded context.
 * @author Sprint 3 — Monetization Bounded Context
 */
```

Every **public method** MUST have:

```typescript
/**
 * Loads the wallet for a given driver from the API.
 *
 * @param driverId - The driver's unique identifier.
 */
loadWallet(driverId: string): void { ... }
```

Every **property/signal** MUST have an inline comment:

```typescript
/** Internal signal holding the current fare policy configuration. */
private farePolicySignal = signal<FarePolicy | null>(null);
```

#### 1.3.4 Layer-Specific Coding Patterns

**Entity (domain/model/):**

```typescript
/**
 * @summary Represents a wallet in the Monetization bounded context.
 * @author Sprint 3 — Monetization Bounded Context
 */
export class Wallet {
  /** Unique identifier for the wallet. */
  id: string = '';
  /** Foreign key linking to the driver. */
  driverId: string = '';
  /** Current balance in soles (PEN). */
  balance: number = 0;

  /** Business logic: checks if the wallet has funds available. */
  hasPositiveBalance(): boolean {
    return this.balance > 0;
  }
}
```

> **Rule:** Plain class, NO Angular decorators, NO HttpClient imports, constructor or default property values.

**DTO / Response Interface (infrastructure/):**

```typescript
/**
 * @summary Raw response contract for the /wallets endpoint from json-server.
 * @author Sprint 3 — Monetization Bounded Context
 */
export interface WalletResponse {
  /** Unique identifier of the wallet. */
  id: string;
  /** ID of the driver who owns this wallet. */
  driverId: string;
  /** Current balance in soles. */
  balance: number;
}
```

> **Rule:** Use `interface`, NOT `class`. Field names match `db.json` EXACTLY.

**Assembler (infrastructure/):**

```typescript
/**
 * @summary Maps WalletResponse DTOs into Wallet domain entities.
 * Uses static methods — no @Injectable, no side effects.
 */
export class WalletAssembler {
  static toEntity(response: WalletResponse): Wallet {
    const entity = new Wallet();
    entity.id = response.id;
    entity.driverId = response.driverId;
    entity.balance = response.balance;
    return entity;
  }

  static toResponse(entity: Wallet): WalletResponse {
    return {
      id: entity.id,
      driverId: entity.driverId,
      balance: entity.balance,
    };
  }
}
```

> **Rule:** Static methods only. `toEntity()` converts DTO → Entity. `toResponse()` converts Entity → DTO (for POST/PATCH). NO `@Injectable`.

**API Service (infrastructure/):**

```typescript
@Injectable({ providedIn: 'root' })
/**
 * @summary Infrastructure gateway to Monetization endpoints on json-server.
 */
export class MonetizationApiService {
  /** HttpClient injected via inject() (Angular 21 style). */
  private http = inject(HttpClient);
  /** Base URL resolved from environment configuration. */
  private baseUrl = environment.apiBaseUrl;

  /**
   * Retrieves a wallet by driver ID.
   *
   * @param driverId - The driver's unique identifier.
   * @returns Observable<Wallet> on success, or a fallback wallet if not found.
   */
  getWalletByDriverId(driverId: string): Observable<Wallet> {
    return this.http
      .get<WalletResponse[]>(`${this.baseUrl}/wallets?driverId=${driverId}`)
      .pipe(
        map((responses) => {
          if (responses.length > 0) return WalletAssembler.toEntity(responses[0]);
          const fallback = new Wallet();
          fallback.driverId = driverId;
          return fallback;
        })
      );
  }
}
```

> **Rule:** Use `inject(HttpClient)`. Import from `environment`, NEVER `environment.development`. Return `Observable<Entity>` already mapped by the Assembler.

**Store (application/):**

```typescript
@Injectable({ providedIn: 'root' })
/**
 * @summary Application service coordinating state for the Monetization bounded context.
 * Uses Angular signals for reactive state management.
 */
export class MonetizationStore {
  /** Infrastructure gateway for Monetization API calls. */
  private api = inject(MonetizationApiService);

  /** Internal signal holding the current wallet. */
  private walletSignal = signal<Wallet | null>(null);
  /** Internal signal indicating an API call is in progress. */
  private loadingSignal = signal<boolean>(false);
  /** Internal signal holding the current error message. */
  private errorSignal = signal<string | null>(null);

  /** The current wallet. Null if not yet loaded. */
  readonly wallet = computed(() => this.walletSignal());
  /** True while an API request is pending. */
  readonly isLoading = computed(() => this.loadingSignal());
  /** The current error message, or null if none. */
  readonly error = computed(() => this.errorSignal());
  /** True if the wallet exists and has a positive balance. */
  readonly hasPositiveBalance = computed(() => {
    const w = this.walletSignal();
    return w !== null && w.hasPositiveBalance();
  });

  /**
   * Loads the wallet for a given driver from the API.
   *
   * @param driverId - The driver's unique identifier.
   */
  loadWallet(driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getWalletByDriverId(driverId).subscribe({
      next: (w) => {
        this.walletSignal.set(w);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar el wallet del conductor.');
      },
    });
  }

  /** Clears the current error signal. */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
```

> **Rule:** Private `signal()` for internal state, public `computed()` for readonly access. Actions subscribe to API service methods. Error messages in Spanish (user-facing). Use `inject()` for dependencies.

**Component (presentation/components/):**

Every component MUST have **3 separate files**: `.ts` + `.html` + `.css`. NO inline templates or styles.

```typescript
// wallet-balance-card.ts
@Component({
  selector: 'app-wallet-balance-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './wallet-balance-card.html',
  styleUrl: './wallet-balance-card.css'
})
/**
 * @summary Displays the driver's wallet balance with a visual status indicator.
 */
export class WalletBalanceCard {
  /** The wallet entity to display. Null shows a loading skeleton. */
  readonly wallet = input.required<Wallet | null>();

  /** True when the wallet indicates a positive balance. */
  get hasBalance(): boolean {
    const w = this.wallet();
    return w !== null && w.hasPositiveBalance();
  }
}
```

```html
<!-- wallet-balance-card.html -->
<div class="wallet-card" [class.wallet-card--warning]="!hasBalance">
  <div class="wallet-header">
    <mat-icon class="wallet-icon">account_balance_wallet</mat-icon>
    <span class="wallet-label">Saldo disponible</span>
  </div>
  <div class="wallet-amount">
    <span class="currency">S/</span>
    <span class="value">{{ wallet()?.balance | number:'1.2-2' }}</span>
  </div>
  @if (hasBalance) {
    <div class="wallet-status status--ok">
      <mat-icon>check_circle</mat-icon>
      <span>Wallet activo</span>
    </div>
  } @else {
    <div class="wallet-status status--warn">
      <mat-icon>warning</mat-icon>
      <span>Saldo insuficiente</span>
    </div>
    <p class="wallet-warning">
      Recarga tu wallet para poder activar tu disponibilidad.
    </p>
  }
</div>
```

```css
/* wallet-balance-card.css */
.wallet-card {
  background: white;
  border-radius: 12px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.wallet-card--warning {
  border-color: #fcd34d;
  background: #fffbeb;
}
/* ... remaining styles */
```

> **Rule:** Use `input.required<>()` for required data, `input<>()` with default for optional. Use `output()` for events. Template uses `@if`/`@for` control flow. Styles in separate `.css` file (plain CSS, no SCSS required). Selector is `app-<feature>`.

#### 1.3.5 i18n — Internationalization

All **user-visible static text** in HTML MUST use `@ngx-translate/core`:

```html
<h2>{{ 'monetization.wallet.title' | translate }}</h2>
<p>{{ 'monetization.wallet.insufficient' | translate }}</p>
```

Translation keys are organized by bounded context in `public/i18n/es.json` and `public/i18n/en.json`:

```json
{
  "monetization": {
    "wallet": {
      "title": "Mi Wallet",
      "insufficient": "Recarga tu wallet para poder activar tu disponibilidad.",
      "active": "Wallet activo",
      "balance": "Saldo disponible"
    }
  }
}
```

> **Exception:** Dynamic error messages from the store (already in Spanish) may remain as-is for simplicity in the Sprint 2/3 fake-API context.

#### 1.3.6 Accessibility (a11y) — Mandatory Checklist

- [ ] All `<img>` have descriptive `alt` attribute
- [ ] Interactive buttons have `aria-label`
- [ ] Material icons used decoratively have `aria-hidden="true"`
- [ ] Form inputs have associated `<label>` elements
- [ ] Color is never the only indicator of state (always pair with text/icon)
- [ ] Status badges include screen-reader text via `aria-label` or hidden `<span>`

#### 1.3.7 Component File Structure

```
presentation/components/<feature>/
├── <feature>.ts          # Component logic + imports
├── <feature>.html        # Template (use @if / @for)
└── <feature>.css         # Styles (plain CSS)
```

> **Never use inline `template:` or `styles:` in `@Component` decorator. Always 3 separate files.**

---

## 2. Domain Model — Canonical Entities

> The following reflects the PUML domain model. **Bold** = already implemented. *Italic* = not yet implemented / deferred.

### 2.1 FarePolicy ✅ IMPLEMENTED

```typescript
// src/app/monetization/domain/model/fare-policy.entity.ts
class FarePolicy implements BaseEntity {
  id: string;
  baseFare: number;       // Soles — fixed cost per trip
  pricePerKm: number;     // Soles per kilometer
  minimumFare: number;    // Floor price

  configure(baseFare, pricePerKm, minimumFare): void
  calculate(distanceKm: number): number  // max(minimumFare, baseFare + pricePerKm * distanceKm)
}
```

### 2.2 Wallet ✅ IMPLEMENTED

```typescript
// src/app/monetization/domain/model/wallet.entity.ts
type WalletStatus = 'ACTIVE' | 'BLOCKED';

class Wallet implements BaseEntity {
  id: string;
  driverId: string;
  balance: number;
  status: WalletStatus;

  topUp(amount): void
  applyCommission(amount): void
  block(): void
  unblock(): void
  hasPositiveBalance(): boolean
}
```

### 2.3 WalletTransaction ✅ IMPLEMENTED (entity exists, no UI/API usage yet)

```typescript
// src/app/monetization/domain/model/wallet-transaction.entity.ts
type TransactionType = 'TOP_UP' | 'TOP_UP_FAILED' | 'COMMISSION';

class WalletTransaction implements BaseEntity {
  id: string;
  walletId: number;
  tripId: number;
  type: TransactionType;
  amount: number;
  resultingBalance: number;
}
```

### 2.4 Domain Events (deferred — not for Sprint 2)

*All domain events from the PUML are deferred. No event bus or observable events exist yet.* These include: `EstimatedFareCalculatedEvent`, `WalletTopUpRequestedEvent`, `RideCommissionAppliedEvent`, `DriverWalletDepletedEvent`, etc.

---

## 3. Infrastructure — API & Data

### 3.1 json-server Collections (`server/db.json`)

**Both collections already exist and are seeded:**

```json
{
  "fareConfig": [
    {
      "id": "1",
      "baseFare": 2.5,
      "pricePerKm": 1.2,
      "minimumFare": 4
    }
  ],
  "wallets": [
    {
      "id": "w-001",
      "driverId": "d-001",
      "balance": 25.5,
      "status": "ACTIVE"
    }
  ]
}
```

**IMPORTANT:** There is NO `walletTransactions` collection in `db.json` yet. This is deferred (US-30).

### 3.2 API Service ✅ IMPLEMENTED

`MonetizationApiService` (`src/app/monetization/infrastructure/monetization-api.service.ts`) provides:

| Method | Endpoint | Returns | Notes |
|---|---|---|---|
| `getFarePolicy()` | `GET /fareConfig` | `Observable<FarePolicy>` | Takes first element; falls back to hardcoded defaults if empty |
| `getWalletByDriverId(driverId)` | `GET /wallets?driverId={id}` | `Observable<Wallet>` | Falls back to empty wallet with given driverId |
| `getWalletTransactions(walletId)` | `GET /walletTransactions?walletId={id}` | `Observable<WalletTransaction[]>` | **Stub — returns `[]` always** |

### 3.3 Response DTOs & Assemblers ✅ IMPLEMENTED

| DTO (API contract) | Assembler (DTO→Entity) |
|---|---|
| `FareConfigResponse` (id, baseFare, pricePerKm, minimumFare) | `FareConfigAssembler.toEntity()` |
| `WalletResponse` (id, driverId, balance, status) | `WalletAssembler.toEntity()` |

---

## 4. Application — Store (State Management)

### 4.1 MonetizationStore ✅ PARTIALLY IMPLEMENTED

Located at `src/app/monetization/application/monetization.store.ts`.

**Current state signals:**

| Signal | Type | Description |
|---|---|---|
| `farePolicy` | `FarePolicy \| null` | Current fare configuration from API |
| `estimatedFare` | `number \| null` | Result of last `calculateEstimatedFare()` call |
| `wallet` | `Wallet \| null` | Current driver's wallet |
| `isLoading` | `boolean` | True during any API call |
| `error` | `string \| null` | Last error message |
| `hasPositiveBalance` | `boolean` | Computed: wallet exists && wallet.hasPositiveBalance() |

**Current actions:**

| Method | Description |
|---|---|
| `loadFarePolicy()` | Fetches fare config from API, sets `farePolicySignal` |
| `calculateEstimatedFare(distanceKm)` | Uses loaded policy to calculate fare; sets `estimatedFareSignal` |
| `loadWallet(driverId)` | Fetches wallet from API, sets `walletSignal` |
| `clearError()` | Resets error signal to null |

---

## 5. Presentation Components ✅ IMPLEMENTED

### 5.1 FareSummaryCardComponent

- **Selector:** `app-fare-summary-card`
- **File:** `src/app/monetization/presentation/components/fare-summary-card/fare-summary-card.ts`
- **Used by:** Passenger request page (ride-dispatch)
- **Inputs:** `estimatedFare: number | null`, `distanceKm: number`, `loading: boolean`
- **Outputs:** `confirm: EventEmitter<void>`
- **Behavior:** Displays fare in Soles (PEN), distance, estimated time (~20 km/h), and a "Confirmar solicitud" button.

### 5.2 WalletBalanceCardComponent

- **Selector:** `app-wallet-balance-card`
- **File:** `src/app/monetization/presentation/components/wallet-balance-card/wallet-balance-card.ts`
- **Used by:** Driver dashboard page (ride-dispatch)
- **Inputs:** `wallet: Wallet | null`
- **Behavior:** Displays balance with status indicator. Shows yellow warning and message when balance is zero/negative.

---

### 5.3 MonetizationPage 🆕 Sprint 3

- **Selector:** `app-monetization-page`
- **File:** `src/app/monetization/presentation/components/monetization-page/monetization-page.ts` ✅ IMPLEMENTED (Sprint 2 completion)
- **Behavior:** Driver wallet page with balance, status summary, and transaction history placeholder.
- **Route:** `/driver/wallet`

### 5.4 TransactionHistory 🆕 US-30

- **Selector:** `app-transaction-history`
- **File:** `src/app/monetization/presentation/components/transaction-history/transaction-history.ts` 🆕
- **Inputs:** `transactions: WalletTransaction[]`, `loading: boolean`
- **Behavior:**
  - List of transaction cards sorted by date (newest first)
  - Each card shows: type icon (TOP_UP = green ↑, COMMISSION = orange ↓, TOP_UP_FAILED = red ✗), amount (colored), resulting balance, date
  - Filter tabs: "Todas", "Recargas", "Comisiones"
  - Empty state: "Aún no tienes movimientos en tu wallet"
- **Used by:** `MonetizationPage` (replaces the deferred placeholder)

### 5.5 RechargeForm 🆕 US-27

- **Selector:** `app-recharge-form`
- **File:** `src/app/monetization/presentation/components/recharge-form/recharge-form.ts` 🆕
- **Inputs:** `currentBalance: number | null`
- **Outputs:** `recharged: EventEmitter<number>` — emits the new balance
- **Behavior:**
  - Input for recharge amount (minimum S/ 5.00)
  - Quick-select chips: S/ 5, S/ 10, S/ 20, S/ 50
  - "Recargar" button (mock — calls store action, updates db.json directly)
  - Success feedback: shows new balance with animation
  - Note: "Simulación de recarga. Stripe se integrará próximamente."
- **Used by:** `MonetizationPage`

---

## 6. Sprint 2 Scope — What Needs to Be Done

> **Critical constraint:** Sprint 2 uses json-server (fake API) and manual refresh. NO realtime, NO Stripe integration, NO admin flows.

### 6.1 US-19 — Cálculo de tarifa por distancia (Ready for UI)

**Status:** Partial — core logic exists but may need wiring/validation.

| Task ID | Description | Status | Notes |
|---|---|---|---|
| **TASK-US19-01** | Consumir `GET /fareConfig` | ✅ DONE | `MonetizationApiService.getFarePolicy()` already implemented |
| **TASK-US19-02** | Implementar cálculo en `monetization.store.ts` | ✅ DONE | `calculateEstimatedFare(distanceKm)` already delegates to `FarePolicy.calculate()` |
| **TASK-US19-03** | Mostrar tarifa estimada en panel/resumen | ✅ DONE | `FareSummaryCardComponent` exists and is used by `passenger-request-page` |
| **TASK-US19-04** | Integrar cálculo con cambios origen/destino | ✅ DONE | `passenger-request-page` calls `calculateEstimatedFare(dist)` when destination changes |
| **TASK-US19-05** | Mostrar distancia estimada en UI | ✅ DONE | `FareSummaryCardComponent` shows `distanceKm` with km label |

**Verdict:** US-19 is essentially complete. A verification pass is warranted to ensure the wiring works end-to-end with json-server running.

**TODO for verification:**
- [ ] Confirm `passenger-request-page` correctly passes the fare to `ride-dispatch.store.submitRideRequest()`
- [ ] Verify the fare updates reactively when origin/destination changes
- [ ] Test edge case: what happens when `fareConfig` is empty in `db.json`? (The fallback in `MonetizationApiService` handles this.)
- [ ] Test edge case: negative distance should show error (handled in `calculateEstimatedFare`)

---

### 6.2 US-28 — Visualización del saldo del wallet (Ready for UI)

**Status:** Partial — core wallet display exists but may need validation and integration polish.

| Task ID | Description | Status | Notes |
|---|---|---|---|
| **TASK-US28-01** | Consumir `GET /wallets?driverId={driverId}` | ✅ DONE | `MonetizationApiService.getWalletByDriverId()` already implemented |
| **TASK-US28-02** | Mostrar saldo en vista del conductor | ✅ DONE | `WalletBalanceCardComponent` exists and is used by `driver-dashboard-page` |
| **TASK-US28-03** | Integrar validación de saldo con US-13 (toggle disponibilidad) | ✅ DONE | `driver-dashboard-page` checks `monetizationStore.hasPositiveBalance()` before allowing toggle |
| **TASK-US28-04** | Mostrar mensaje claro cuando no pueda activarse | ✅ DONE | `WalletBalanceCardComponent` shows "Recarga tu wallet para poder activar tu disponibilidad." |

**Verdict:** US-28 is essentially complete. Integration with US-13 exists.

**TODO for verification:**
- [ ] Confirm a driver with balance = 0 in db.json sees "Saldo insuficiente" and cannot toggle availability
- [ ] Confirm a driver with balance > 0 sees "Wallet activo" and can toggle availability
- [ ] Verify `MonetizationStore.loadWallet()` is called with the correct driver ID when the driver dashboard loads
- [ ] Test fallback behavior when `/wallets?driverId=X` returns empty array (the service creates a fallback wallet with balance=0)

---

### 6.3 Deferred Stories (NOT for Sprint 2)

The following user stories from the monetization bounded context are **explicitly deferred** and should NOT be implemented:

| Story | Description | Reason |
|---|---|---|
| **US-20** | Configuración de tarifas por administrador | Out of Sprint Core |
| **US-27** | Recarga del wallet mediante Stripe | Deferred (requires payment integration) |
| **US-29** | Descuento automático de comisión por viaje | Deferred |
| **US-30** | Historial de transacciones del wallet | Deferred |

---

### 6.4 Sprint 3 Scope — Monetization Completion

The following stories were deferred in Sprint 2 and are now in scope for Sprint 3.

---

#### US-30 — Historial de transacciones del wallet (Ready for UI)

**Status:** Pending — `WalletTransaction` entity exists, `getWalletTransactions()` is a stub returning `[]`.

| Task ID | Description | Priority |
|---|---|---|
| **TASK-US30-01** | Create `walletTransactions` collection in `db.json` with seed entries | HIGH |
| **TASK-US30-02** | Implement real `GET /walletTransactions?walletId={id}` in `MonetizationApiService.getWalletTransactions()` (replace stub) | HIGH |
| **TASK-US30-03** | Create `TransactionHistory` component with list, filter, and empty state | HIGH |
| **TASK-US30-04** | Add `loadTransactionHistory(walletId)` action in `MonetizationStore` | HIGH |
| **TASK-US30-05** | Add `transactions` signal and `filteredTransactions` computed in `MonetizationStore` | HIGH |
| **TASK-US30-06** | Replace placeholder in `MonetizationPage` with `<app-transaction-history>` | HIGH |
| **TASK-US30-07** | Implement filter by type (ALL, TOP_UP, COMMISSION) using query params or client-side filter | MEDIUM |
| **TASK-US30-08** | Seed sample transactions in `db.json` for the demo driver (d-001) | MEDIUM |

**db.json seed for walletTransactions:**
```json
{
  "walletTransactions": [
    {
      "id": "wt-001",
      "walletId": "w-001",
      "tripId": null,
      "type": "TOP_UP",
      "amount": 30.00,
      "resultingBalance": 30.00,
      "timestamp": "2026-06-01T10:00:00Z"
    },
    {
      "id": "wt-002",
      "walletId": "w-001",
      "tripId": "zNdsrkgXOCw",
      "type": "COMMISSION",
      "amount": -0.20,
      "resultingBalance": 29.80,
      "timestamp": "2026-06-02T14:30:00Z"
    }
  ]
}
```

---

#### US-27 — Recarga del wallet (Mock para frontend)

**Status:** Pending — requires Stripe backend, so Sprint 3 implements a **mock version**.

**Redefinición funcional:**
- Se simula la recarga sin Stripe real
- `POST /walletTransactions` (tipo `TOP_UP`) + `PATCH /wallets/{id}` (actualizar saldo)
- La UI muestra el nuevo saldo tras la "recarga"

| Task ID | Description | Priority |
|---|---|---|
| **TASK-US27-01** | Create `RechargeForm` component with amount input + quick-select chips | HIGH |
| **TASK-US27-02** | Add `rechargeWallet(driverId, amount)` in `MonetizationApiService`: POST transaction → PATCH wallet balance | HIGH |
| **TASK-US27-03** | Add `recharge(amount)` action in `MonetizationStore`: API call → reload wallet → reload transactions | HIGH |
| **TASK-US27-04** | Integrate `RechargeForm` into `MonetizationPage` | HIGH |
| **TASK-US27-05** | Validate minimum amount (S/ 5.00) | MEDIUM |
| **TASK-US27-06** | Show success animation and updated balance | MEDIUM |
| **TASK-US27-07** | Add disclaimer: "Simulación de recarga. Stripe será integrado próximamente." | LOW |

**Implementation notes — mock recharge flow:**
```
rechargeWallet(driverId, amount):
  1. GET /wallets?driverId={driverId} → get wallet.id
  2. POST /walletTransactions {
       walletId: wallet.id,
       type: 'TOP_UP',
       amount: amount,
       resultingBalance: wallet.balance + amount
     }
  3. PATCH /wallets/{wallet.id} { balance: wallet.balance + amount }
  4. Return new Wallet entity
```

---

#### US-29 — Descuento automático de comisión por viaje (Frontend mock)

**Status:** Pending — backend logic would handle this, but frontend needs to simulate it.

**Redefinición funcional:**
- Al marcar un viaje como `COMPLETED`, el frontend simula el descuento del 5%
- Se crea una transacción `COMMISSION` y se actualiza el wallet
- La UI refleja el nuevo saldo

| Task ID | Description | Priority |
|---|---|---|
| **TASK-US29-01** | Add `applyCommission(driverId, tripId, rideFare)` in `MonetizationApiService` | HIGH |
| **TASK-US29-02** | In `RideDispatchStore.onCompleteRide()`, call `MonetizationStore.applyCommission()` after marking COMPLETED | HIGH |
| **TASK-US29-03** | Commission calculation: `rideFare * 0.05` (5%) | HIGH |
| **TASK-US29-04** | Create transaction `COMMISSION` and `PATCH /wallets/{id}` with new balance | HIGH |
| **TASK-US29-05** | Add `applyCommission` action in `MonetizationStore`: API call → update wallet signal → reload transactions | HIGH |
| **TASK-US29-06** | Show visual feedback on driver dashboard: "Comisión de S/ X.XX descontada" | MEDIUM |
| **TASK-US29-07** | Handle edge case: wallet balance reaches zero after commission → block availability | MEDIUM |
| **TASK-US29-08** | Ensure commission is only applied ONCE per completed ride (idempotency check by tripId) | HIGH |

**Implementation notes — mock commission flow:**
```
applyCommission(driverId, tripId, rideFare):
  1. Check if transaction already exists for this tripId (GET /walletTransactions?tripId={id})
     → if exists, skip (idempotency)
  2. GET /wallets?driverId={driverId} → get wallet
  3. commissionAmount = rideFare * 0.05
  4. newBalance = wallet.balance - commissionAmount
  5. POST /walletTransactions {
       walletId: wallet.id,
       tripId: tripId,
       type: 'COMMISSION',
       amount: -commissionAmount,
       resultingBalance: newBalance
     }
  6. PATCH /wallets/{wallet.id} { balance: newBalance }
  7. If newBalance <= 0: PATCH /drivers/{id} { operationalStatus: 'BLOCKED' }
  8. Return new Wallet entity
```

**Integration point in RideDispatchStore:**
```typescript
// In ride-dispatch.store.ts → advanceRideStatus(COMPLETED):
// After PATCH /rides/{id} { status: 'COMPLETED' }:
const ride = this.currentRideSignal();
if (ride) {
  this.monetizationStore.applyCommission(ride.driverId, ride.id, ride.estimatedFare);
}
```

---

## 7. Cross-Bounded-Context Integration

### 7.1 Monetization → Ride Dispatch (Passenger Side)

```
┌─────────────────────────────────────────────────────────────┐
│ passenger-request-page.ts (ride-dispatch presentation)       │
│                                                              │
│   inject(MonetizationStore)                                  │
│   inject(RideDispatchStore)                                  │
│                                                              │
│   constructor() {                                            │
│     this.monetizationStore.loadFarePolicy()  ◄── loads config│
│   }                                                          │
│                                                              │
│   onDestinationChange(dest) {                                │
│     const dist = calculateEstimatedDistance(origin, dest)    │
│     this.rideStore.setDestination(dest, dist)               │
│     this.monetizationStore.calculateEstimatedFare(dist) ◄─┐ │
│   }                                                         │ │
│                                                             │ │
│   onConfirmRequest() {                                      │ │
│     const fare = this.monetizationStore.estimatedFare() ◄───┘ │
│     this.rideStore.submitRideRequest(passengerId, fare)      │
│   }                                                          │
│                                                              │
│   <!-- Template uses: -->                                    │
│   <app-fare-summary-card                                     │
│     [estimatedFare]="monetizationStore.estimatedFare()"      │
│     [distanceKm]="rideStore.distanceKm()"                    │
│     (confirm)="onConfirmRequest()">                          │
│   </app-fare-summary-card>                                   │
└─────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. Monetization loads fare policy from API
2. When destination changes, distance is calculated (geo utils), fare is estimated (monetization store)
3. On confirm, estimated fare is passed as part of the ride request to ride-dispatch

### 7.2 Monetization → Ride Dispatch (Driver Side)

```
┌─────────────────────────────────────────────────────────────┐
│ driver-dashboard-page.ts (ride-dispatch presentation)        │
│                                                              │
│   inject(MonetizationStore)                                  │
│   inject(RideDispatchStore)                                  │
│   inject(DriverManagementStore)                              │
│                                                              │
│   constructor() {                                            │
│     const driver = this.driverMgmtStore.driver()            │
│     if (driver?.id) {                                       │
│       this.monetizationStore.loadWallet(driver.id) ◄── loads │
│     }                                                        │
│   }                                                          │
│                                                              │
│   onToggleAvailability() {                                   │
│     // US-13: check wallet before activating                │
│     this.rideStore.toggleAvailability(                       │
│       driver.id,                                             │
│       this.monetizationStore.hasPositiveBalance() ◄── guard  │
│     )                                                        │
│   }                                                          │
│                                                              │
│   uiState computed:                                          │
│     if (!monetizationStore.hasPositiveBalance())             │
│       → 'INSUFFICIENT_BALANCE'                               │
│                                                              │
│   <!-- Template uses: -->                                    │
│   <app-wallet-balance-card                                  │
│     [wallet]="monetizationStore.wallet()">                   │
│   </app-wallet-balance-card>                                 │
└─────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. On driver dashboard init, wallet is loaded via driver ID from DriverManagement
2. HasPositiveBalance acts as a guard for US-13 (toggle availability)
3. Wallet UI shows balance and status indicator

### 7.3 Connection Map

```
                    ┌──────────────┐
                    │   IAM Store  │
                    │ (session,    │
                    │  account ID, │
                    │  role)       │
                    └──────┬───────┘
                           │ account.id
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   Ride Dispatch Store                         │
│                                                               │
│  submitRideRequest(passengerId, ← estimatedFare from monet.   │
│                    estimatedFare)                              │
│  toggleAvailability(driverId, ← hasPositiveBalance from monet.│
│                     hasBalance)                                │
└──────┬────────────────────────────┬──────────────────────────┘
       │                            │
       │ fare config                │ wallet balance
       ▼                            ▼
┌──────────────┐            ┌──────────────┐
│ Monetization │            │   Driver     │
│    Store     │            │ Management   │
│              │            │    Store     │
│ farePolicy   │            │              │
│ estimatedFare│            │ driver.id    │
│ wallet       │◄───────────│ (used to     │
│ hasPositive  │  driverId  │  load wallet)│
│ Balance      │            │              │
└──────┬───────┘            └──────────────┘
       │
       │ HTTP
       ▼
┌────────────────┐
│  json-server   │
│                │
│  /fareConfig   │
│  /wallets      │
└────────────────┘
```

---

## 8. Implementation Checklist for AI Agents

If you are an AI agent tasked with **completing or verifying** the monetization bounded context for Sprint 2, follow this ordered checklist:

### Phase 1: Verification (confirm what already works)

1. **Read existing code** in this order:
   - `docs/bounded-context/monetization/monetization.puml` — canonical architecture
   - `docs/user-stories/sprint-2.md` — sprint scope (# Monetization section, lines 301-383)
   - `src/app/monetization/domain/model/*.entity.ts` — all 3 entities
   - `src/app/monetization/infrastructure/*.ts` — API service, DTOs, assemblers
   - `src/app/monetization/application/monetization.store.ts` — store with signals
   - `src/app/monetization/presentation/components/**/*.ts` — UI components

2. **Check db.json** at `server/db.json`:
   - Verify `fareConfig` has at least one entry with `baseFare`, `pricePerKm`, `minimumFare`
   - Verify `wallets` has at least one entry with `driverId` matching a seed driver
   - If adding more drivers, add corresponding wallet entries

3. **Trace the integration points:**
   - `passenger-request-page.ts` → `MonetizationStore.loadFarePolicy()` + `calculateEstimatedFare(dist)`
   - `driver-dashboard-page.ts` → `MonetizationStore.loadWallet(driverId)` + `hasPositiveBalance()`

### Phase 2: Fix gaps (only if verification reveals issues)

1. **If fare calculation doesn't react to destination change:**
   - Ensure `passenger-request-page` calls `calculateEstimatedFare()` inside the destination change handler
   - Ensure the template binds to `monetizationStore.estimatedFare()` (computed signal)

2. **If wallet balance doesn't show:**
   - Ensure `driver-dashboard-page` calls `loadWallet(driver.id)` after driver profile loads
   - Check `walletResponse` interface matches `db.json` wallet structure exactly

3. **If toggle availability doesn't respect wallet balance:**
   - Verify `hasPositiveBalance()` computed signal is used in the `onToggleAvailability()` call
   - Verify the `uiState` computed includes the `INSUFFICIENT_BALANCE` branch

### Phase 3: Do NOT implement

- ❌ Admin fare configuration UI (US-20)
- ❌ Stripe/payment integration (US-27)
- ❌ Automatic commission deduction on ride completion (US-29)
- ❌ Transaction history UI or API (US-30)
- ❌ Any domain event publishing mechanism
- ❌ WebSocket or realtime sync
- ❌ New collections in db.json beyond what already exists

---

## 9. File Naming Convention Reference

Based on the IAM bounded context pattern, use these conventions for any new monetization files:

| Concept | Naming Pattern | Example |
|---|---|---|
| **Entity** | `{concept}.entity.ts` | `wallet.entity.ts`, `fare-policy.entity.ts` |
| **Store** | `{context}.store.ts` | `monetization.store.ts` |
| **API Service** | `{context}-api.service.ts` | `monetization-api.service.ts` |
| **API Response DTO** | `{concept}-response.ts` | `fare-config-response.ts`, `wallet-response.ts` |
| **Assembler** | `{concept}-assembler.ts` | `fare-config-assembler.ts`, `wallet-assembler.ts` |
| **Component** | `{feature-name}.ts` in its own folder | `fare-summary-card/fare-summary-card.ts` |
| **Component selector** | `app-{feature-name}` | `app-fare-summary-card`, `app-wallet-balance-card` |

### Folder structure for NEW components:

```
src/app/monetization/presentation/components/
└── my-new-component/
    ├── my-new-component.ts     # Component logic + inline template/styles
    ├── my-new-component.css    # (optional, if styles are extracted)
    └── my-new-component.html   # (optional, if template is extracted)
```

Currently, all components use **inline templates and styles** (single `.ts` file). Follow this pattern for consistency.

---

## 10. Coding Patterns Reference

### 10.1 Entity Pattern

```typescript
import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class MyEntity implements BaseEntity {
  id: string = '';
  // ... properties with defaults

  // Business logic methods (no side effects, no HTTP)
  someBusinessMethod(): ReturnType { ... }
}
```

### 10.2 Assembler Pattern

```typescript
import { MyEntity } from '../domain/model/my-entity.entity';
import { MyResponse } from './my-response';

export class MyAssembler {
  static toEntity(response: MyResponse): MyEntity {
    const entity = new MyEntity();
    entity.id = response.id;
    // ... map fields
    return entity;
  }
}
```

### 10.3 API Service Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class MonetizationApiService {
  private http = inject(HttpClient);          // Angular 21+ style
  private baseUrl = environment.apiBaseUrl;   // or environment.apiBaseUrl

  getSomething(): Observable<Something> {
    return this.http.get<SomethingResponse[]>(`${this.baseUrl}/collection`)
      .pipe(map(responses => {
        if (responses.length > 0) return MyAssembler.toEntity(responses[0]);
        // Return sensible fallback
        return new Something();
      }));
  }
}
```

### 10.4 Store (Application Service) Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class MonetizationStore {
  private api = inject(MonetizationApiService);

  // Internal signals (private)
  private mySignal = signal<MyType | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public computed state (readonly)
  readonly myData = computed(() => this.mySignal());
  readonly isLoading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  // Actions (public methods)
  loadSomething(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getSomething().subscribe({
      next: (data) => { this.mySignal.set(data); this.loadingSignal.set(false); },
      error: () => { this.loadingSignal.set(false); this.errorSignal.set('Mensaje claro de error.'); }
    });
  }

  clearError(): void { this.errorSignal.set(null); }
}
```

### 10.5 Component (Presentation) Pattern

```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `...`,   // inline template
  styles: [`...`],   // inline styles (use backtick for multiline)
})
export class MyComponent {
  @Input() data: SomeType | null = null;
  @Output() action = new EventEmitter<void>();
}
```

---

## 11. Quick Reference — Key Files

| File | Purpose | Status |
|---|---|---|
| `docs/bounded-context/monetization/monetization.puml` | Canonical architecture diagram | ✅ Reference |
| `docs/user-stories/sprint-2.md` | Sprint 2 scope | ✅ Done |
| `docs/sprint-3.md` | Sprint 3 scope (monetization section) | ✅ Reference |
| `server/db.json` → `fareConfig` | Fare parameters | ✅ Exists |
| `server/db.json` → `wallets` | Wallet records | ✅ Exists |
| `server/db.json` → `walletTransactions` | Transaction records | 🆕 Create + seed |
| `src/app/monetization/application/monetization.store.ts` | State management (signals) | 🔧 Extend: transactions, recharge, commission |
| `src/app/monetization/domain/model/fare-policy.entity.ts` | Fare policy entity + calculate() | ✅ Complete |
| `src/app/monetization/domain/model/wallet.entity.ts` | Wallet entity + hasPositiveBalance() | ✅ Complete |
| `src/app/monetization/domain/model/wallet-transaction.entity.ts` | Transaction entity | ✅ Complete |
| `src/app/monetization/infrastructure/monetization-api.service.ts` | HTTP gateway | 🔧 Extend: transactions, recharge, commission |
| `src/app/monetization/infrastructure/fare-config-response.ts` | DTO for /fareConfig | ✅ Complete |
| `src/app/monetization/infrastructure/fare-config-assembler.ts` | FareConfigResponse → FarePolicy | ✅ Complete |
| `src/app/monetization/infrastructure/wallet-response.ts` | DTO for /wallets | ✅ Complete |
| `src/app/monetization/infrastructure/wallet-assembler.ts` | WalletResponse → Wallet | ✅ Complete |
| `src/app/monetization/infrastructure/wallet-transaction-response.ts` | DTO for /walletTransactions | 🆕 Create |
| `src/app/monetization/infrastructure/wallet-transaction-assembler.ts` | DTO → WalletTransaction | 🆕 Create |
| `src/app/monetization/presentation/components/fare-summary-card/fare-summary-card.ts` | Passenger fare display | ✅ Complete |
| `src/app/monetization/presentation/components/wallet-balance-card/wallet-balance-card.ts` | Driver wallet display | ✅ Complete |
| `src/app/monetization/presentation/components/monetization-page/monetization-page.ts` | Unified wallet page | ✅ Implemented |
| `src/app/monetization/presentation/components/transaction-history/transaction-history.ts` | Transaction list + filter | 🆕 US-30 |
| `src/app/monetization/presentation/components/recharge-form/recharge-form.ts` | Mock recharge form | 🆕 US-27 |
| `src/app/ride-dispatch/application/ride-dispatch.store.ts` | Consumer (commission trigger) | 🔧 Add commission call on COMPLETED |
| `src/app/ride-dispatch/presentation/components/passenger-request-page/passenger-request-page.ts` | Consumer (passenger fare) | ✅ Complete |
| `src/app/ride-dispatch/presentation/components/driver-dashboard-page/driver-dashboard-page.ts` | Consumer (driver wallet) | ✅ Complete |

---

## 12. Summary

**Sprint 2 monetization scope — completed:**

1. ✅ **US-19** (Fare calculation) — Core logic, UI component, and ride-dispatch integration exist
2. ✅ **US-28** (Wallet balance display) — Core logic, UI component, and driver toggle guard exist
3. ❌ **US-20, US-27, US-29, US-30** — All explicitly deferred from Sprint 2

**Sprint 3 monetization scope — new implementation:**

4. 🆕 **US-30** (Transaction history) — 8 tasks: seed db.json, real API, component, store actions, filter
5. 🆕 **US-27** (Wallet recharge mock) — 7 tasks: form component, API mock, store action, validation
6. 🆕 **US-29** (Auto commission mock) — 8 tasks: API mock, ride-dispatch integration, idempotency, visual feedback

**Total Sprint 3 monetization work:**
- 3 new presentation components: `TransactionHistory`, `RechargeForm`, and integration wiring in `MonetizationPage`
- 1 new infrastructure file: `wallet-transaction-response.ts`, `wallet-transaction-assembler.ts`
- 1 new db.json collection: `walletTransactions`
- 2 files modified: `monetization.store.ts`, `monetization-api.service.ts`
- 1 cross-context modification: `ride-dispatch.store.ts` (commission trigger)

**What remains deferred (post-Sprint 3):**
- ❌ **US-20** — Admin fare configuration (handled by Admin bounded context in Sprint 3)
- ❌ Stripe real integration (backend required)
- ❌ Domain events (not needed for fake API architecture)
