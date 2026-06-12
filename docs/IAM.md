# IAM Bounded Context — Sprint 3 Implementation Guide

> **Target audience:** AI coding agents that need to understand what exists and what Sprint 3 tasks remain.
> **Last updated:** 2026-06-10
> **Bounded context:** Identity & Access Management (Gestión de Identidad y Acceso)
> **Epic:** EP-01

---

## 1. Architecture Overview

The IAM bounded context follows a **layered hexagonal/clean architecture** adapted for Angular. It handles authentication, registration, profile management, and session state.

### 1.1 Current Folder Structure

```
src/app/iam/
├── application/
│   └── iam.store.ts                     # ✅ State management (signals)
├── domain/
│   └── model/
│       ├── account.entity.ts             # ✅ Account entity
│       └── profile.entity.ts             # ✅ Profile entity
├── infrastructure/
│   ├── iam-api.service.ts                # ✅ HTTP gateway (signIn, getProfileByAccountId)
│   ├── account-assembler.ts              # ✅ AuthResponse → Account
│   ├── auth-response.ts                  # ✅ DTO for /users
│   ├── profile-assembler.ts              # ✅ ProfileResponse → Profile
│   └── profile-response.ts               # ✅ DTO for /profiles
└── presentation/
    └── components/
        ├── login-form/                   # ✅ Login page (email, password)
        │   ├── login-form.ts
        │   ├── login-form.html
        │   └── login-form.css
        ├── passenger-dashboard/          # ⚠️ Stub (redirects to passenger layout)
        ├── driver-dashboard/             # ⚠️ Stub (redirects to driver layout)
        └── admin-dashboard/              # ⚠️ Stub (placeholder page)
```

### 1.2 Sprint 3 Target Structure

```
src/app/iam/
├── application/
│   └── iam.store.ts                     # 🔧 Extend: register actions, profile update
├── domain/
│   └── model/
│       ├── account.entity.ts             # ✅ Complete
│       ├── profile.entity.ts             # ✅ Complete
│       └── registration-status.type.ts   # 🆕 PENDING_VERIFICATION | APPROVED | REJECTED
├── infrastructure/
│   ├── iam-api.service.ts                # 🔧 Extend: registerPassenger, registerDriver,
│   │                                      #   updateProfile
│   ├── account-assembler.ts              # 🔧 Extend: handle registration DTOs
│   ├── auth-response.ts                  # ✅ Complete
│   ├── profile-assembler.ts              # ✅ Complete
│   └── profile-response.ts               # ✅ Complete
└── presentation/
    └── components/
        ├── login-form/                   # ✅ Complete (Sprint 2)
        ├── register-passenger-form/      # 🆕 US-01
        ├── register-driver-form/         # 🆕 US-02
        ├── profile-page/                 # 🆕 US-04
        └── profile-edit-form/            # 🆕 US-04 (child of profile-page)
```

---

### 1.3 Mandatory Architecture Conventions (from `context.md`)

> **⚠️ CRITICAL:** Every AI agent generating code for this bounded context MUST follow these conventions. Derived from the canonical project guide at [`context.md`](context.md).

#### Angular 21 Coding Style

| Rule | Mandatory | Example |
|---|---|---|
| Property binding | `input()` signal, NOT `@Input()` | `account = input.required<Account>()` |
| Event emission | `output()`, NOT `@Output()` | `registered = output<Account>()` |
| Control flow | `@for` / `@if`, NOT `*ngFor` / `*ngIf` | `@if (store.isLoading()) { ... }` |
| Dependency injection | `inject()`, NOT constructor injection | `private store = inject(IamStore)` |
| Standalone | ALL components `standalone: true` | `@Component({ standalone: true, ... })` |
| ProvidedIn | ALL services `providedIn: 'root'` | `@Injectable({ providedIn: 'root' })` |

#### Naming Conventions (English Only)

| Element | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `register-passenger-form.ts`, `iam-api.service.ts` |
| Classes | `PascalCase` | `IamStore`, `AccountAssembler` |
| Properties/Methods | `camelCase` | `signIn()`, `currentAccount` |
| Entity files | `<name>.entity.ts` | `account.entity.ts`, `profile.entity.ts` |
| API services | `<context>-api.service.ts` | `iam-api.service.ts` |
| Assemblers | `<entity>-assembler.ts` | `account-assembler.ts` |
| DTOs (Response) | `<endpoint>-response.ts` | `auth-response.ts` |
| Stores | `<context>.store.ts` | `iam.store.ts` |
| Component selectors | `app-<feature>` | `app-register-passenger-form` |

#### JSDoc — Mandatory on Every File

```typescript
/**
 * @summary [Purpose of this file in the IAM bounded context.]
 * @author Sprint 3 — IAM Bounded Context
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
<h2>{{ 'iam.register.title' | translate }}</h2>
```

Translation keys in `public/i18n/es.json` under `"iam": { ... }`.

#### Accessibility (a11y) Checklist

- [ ] `<img>` have `alt`, buttons have `aria-label`
- [ ] Form inputs have associated `<label>`
- [ ] Color not the only state indicator

---

## 2. Domain Model — Entities

### 2.1 Account ✅ IMPLEMENTED

```typescript
// src/app/iam/domain/model/account.entity.ts
type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN';

class Account {
  id: string;
  email: string;
  role: UserRole;
}
```

**Sprint 3 additions:** The `Account` entity is complete. For driver registration (US-02), the role is set to `DRIVER` at creation time.

### 2.2 Profile ✅ IMPLEMENTED

```typescript
// src/app/iam/domain/model/profile.entity.ts
class Profile {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
  photoUrl: string;
}
```

**Sprint 3 additions:** Profile is complete. US-04 (profile management) reads and writes this entity.

### 2.3 Registration Status (Sprint 3 — US-02)

```typescript
// 🆕 src/app/iam/domain/model/registration-status.type.ts
export type VerificationStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
export type OperationalStatus = 'ENABLED' | 'DISABLED';
```

This type is used by the driver registration flow (US-02) and admin verification (US-06).

---

## 3. Infrastructure — API & Data

### 3.1 json-server Collections (`server/db.json`)

**Users collection (already exists):**
```json
{
  "users": [
    { "id": "u-001", "email": "pasajero@correo.com", "password": "pass123", "role": "PASSENGER" },
    { "id": "u-002", "email": "conductor@correo.com", "password": "pass123", "role": "DRIVER" },
    { "id": "u-003", "email": "admin@correo.com", "password": "admin123", "role": "ADMIN" }
  ]
}
```

**Profiles collection (already exists):**
```json
{
  "profiles": [
    { "id": "p-001", "accountId": "u-001", "fullName": "María Quispe", "email": "pasajero@correo.com", "photoUrl": "https://i.pravatar.cc/150?img=12" }
  ]
}
```

**Sprint 3 additions to `db.json`:**
- No new collections needed — `users` and `profiles` already exist.
- For driver registration, a `drivers` entry must be created alongside the `users` entry (see US-02 below).

### 3.2 IamApiService ✅ IMPLEMENTED — needs extension

Located at `src/app/iam/infrastructure/iam-api.service.ts`.

**Current methods:**

| Method | Endpoint | Returns | Status |
|---|---|---|---|
| `signIn(email, password)` | `GET /users?email={email}` | `Observable<Account>` | ✅ |
| `getProfileByAccountId(accountId)` | `GET /profiles?accountId={id}` | `Observable<Profile>` | ✅ |

**Sprint 3 methods to add:**

| Method | Endpoint | Returns | Story |
|---|---|---|---|
| `registerPassenger(email, password)` | `POST /users` + `POST /profiles` | `Observable<Account>` | US-01 |
| `registerDriver(email, password, brevete, soat)` | `POST /users` + `POST /profiles` + `POST /drivers` | `Observable<Account>` | US-02 |
| `checkEmailExists(email)` | `GET /users?email={email}` | `Observable<boolean>` | US-01, US-02 |
| `updateProfile(profileId, data)` | `PATCH /profiles/{id}` | `Observable<Profile>` | US-04 |

### 3.3 Response DTOs & Assemblers

| DTO | Assembler | Status |
|---|---|---|
| `AuthResponse` (id, email, password, role) | `AccountAssembler.toEntity()` | ✅ |
| `ProfileResponse` (id, accountId, fullName, email, photoUrl) | `ProfileAssembler.toEntity()` | ✅ |

---

## 4. Application — IamStore ✅ IMPLEMENTED — needs extension

Located at `src/app/iam/application/iam.store.ts`.

**Current state signals:**

| Signal | Type | Description |
|---|---|---|
| `currentAccount` | `Account \| null` | Authenticated account |
| `currentProfile` | `Profile \| null` | Loaded profile |
| `isLoading` | `boolean` | Auth request in progress |
| `isAuthenticated` | `boolean` | Has authenticated account |
| `role` | `UserRole \| null` | Current user role |
| `error` | `string \| null` | Last error message |

**Current actions:**

| Method | Description | Status |
|---|---|---|
| `signIn(email, password)` | Authenticate + load profile + persist session + redirect by role | ✅ |
| `signOut()` | Clear state, localStorage, redirect to /login | ✅ |
| `clearError()` | Reset error signal | ✅ |

**Sprint 3 actions to add:**

| Method | Description | Story |
|---|---|---|
| `registerPassenger(email, password)` | Create passenger account + profile, then sign in | US-01 |
| `registerDriver(email, password, brevete, soat)` | Create driver account + profile + driver record, show pending message | US-02 |
| `updateProfile(data)` | PATCH profile, update signal, persist session | US-04 |
| `checkEmail(email)` | Verify email uniqueness before registration | US-01, US-02 |

---

## 5. Presentation Components

### 5.1 LoginForm ✅ IMPLEMENTED

- **Selector:** `app-login-form`
- **File:** `src/app/iam/presentation/components/login-form/login-form.ts`
- **Behavior:** Reactive form (email + password), delegates to `IamStore.signIn()`.
- **Route:** `/login`
- **Uses:** External template (`login-form.html`) and stylesheet (`login-form.css`)

### 5.2 RegisterPassengerForm 🆕 US-01

- **Selector:** `app-register-passenger-form`
- **File:** `src/app/iam/presentation/components/register-passenger-form/register-passenger-form.ts` 🆕
- **Behavior:**
  - Reactive form: email, password, confirmPassword
  - Validates email format, password minLength (4), password match
  - Checks email uniqueness via `IamStore.checkEmail()`
  - On submit: calls `IamStore.registerPassenger()`
  - On success: redirects to `/login` with "Registro exitoso" message
  - On duplicate email: shows error "El correo ya está registrado"
- **Route:** `/register/passenger`
- **Template:** Inline (follow monetization pattern — single .ts file)

### 5.3 RegisterDriverForm 🆕 US-02

- **Selector:** `app-register-driver-form`
- **File:** `src/app/iam/presentation/components/register-driver-form/register-driver-form.ts` 🆕
- **Behavior:**
  - Reactive form: email, password, confirmPassword, brevete, soat
  - All fields required with validation
  - On submit: calls `IamStore.registerDriver()`
  - Creates `users` entry (role: DRIVER) + `profiles` entry + `drivers` entry (status: PENDING_VERIFICATION)
  - On success: redirects to `/login` with "Registro pendiente de verificación" message
- **Route:** `/register/driver`
- **Template:** Inline

### 5.4 ProfilePage 🆕 US-04

- **Selector:** `app-profile-page`
- **File:** `src/app/iam/presentation/components/profile-page/profile-page.ts` 🆕
- **Behavior:**
  - View mode: shows fullName, email, photoUrl (with avatar image)
  - Edit button toggles to edit mode → renders `ProfileEditForm`
  - If role is DRIVER: also shows verificationStatus and documents (brevete, SOAT)
  - Shows reputation score (US-23 — delegates to TrustReputationStore)
- **Routes:** `/passenger/profile`, `/driver/profile`
- **Template:** Inline

### 5.5 ProfileEditForm 🆕 US-04

- **Selector:** `app-profile-edit-form`
- **File:** `src/app/iam/presentation/components/profile-edit-form/profile-edit-form.ts` 🆕
- **Behavior:**
  - Reactive form: fullName, photoUrl (pre-populated from current profile)
  - Save button → `IamStore.updateProfile()`
  - Cancel button → revert to view mode
  - Photo URL preview (thumbnail beside the input)
- **Template:** Inline

---

## 6. Sprint 3 Scope — What Needs to Be Done

### 6.1 US-01 — Registro de pasajero (Ready for UI)

**Status:** Pending — 0% implemented.

| Task ID | Description | Priority |
|---|---|---|
| **TASK-US01-01** | Create `register-passenger-form` component with reactive form (email, password, confirmPassword) | HIGH |
| **TASK-US01-02** | Add `registerPassenger(email, password)` action in `IamStore`: POST /users → POST /profiles → auto sign-in | HIGH |
| **TASK-US01-03** | Add `checkEmailExists(email)` in `IamApiService`: GET /users?email={email} | HIGH |
| **TASK-US01-04** | Add route `/register/passenger` in `app.routes.ts` (outside any layout — standalone) | HIGH |
| **TASK-US01-05** | Add route `/register/driver` (needed for navigation from landing page) | HIGH |
| **TASK-US01-06** | Add form validation: email format, password ≥ 4 chars, passwords match | HIGH |
| **TASK-US01-07** | Handle duplicate email error with clear message | MEDIUM |
| **TASK-US01-08** | Redirect to `/login` with success query param after registration | MEDIUM |
| **TASK-US01-09** | Show success toast/message on login page when coming from registration | LOW |

**Implementation notes:**
```
registerPassenger(email, password):
  1. POST /users { email, password, role: 'PASSENGER' }
  2. POST /profiles { accountId: <newUserId>, fullName: '', email, photoUrl: '' }
  3. Auto sign-in: set currentAccount, persist session, redirect to /passenger/request-ride
```

### 6.2 US-02 — Registro de conductor (Ready for UI)

**Status:** Pending — 0% implemented.

| Task ID | Description | Priority |
|---|---|---|
| **TASK-US02-01** | Create `register-driver-form` component with reactive form (email, password, confirmPassword, brevete, soat) | HIGH |
| **TASK-US02-02** | Add `registerDriver(...)` in `IamStore`: POST /users → POST /profiles → POST /drivers | HIGH |
| **TASK-US02-03** | Create `drivers` schema in `db.json` (already exists with d-001) — ensure `verificationStatus` and `operationalStatus` fields | HIGH |
| **TASK-US02-04** | Add driver-specific validations: brevete required, SOAT required | MEDIUM |
| **TASK-US02-05** | On success: show "Registro pendiente de verificación por el administrador" message | MEDIUM |
| **TASK-US02-06** | Redirect to `/login` with pending verification message | MEDIUM |
| **TASK-US02-07** | Handle duplicate email error (reuse checkEmailExists from US-01) | LOW |

**Implementation notes:**
```
registerDriver(email, password, brevete, soat):
  1. POST /users { email, password, role: 'DRIVER' }
  2. POST /profiles { accountId: <newUserId>, fullName: '', email, photoUrl: '' }
  3. POST /drivers { accountId: <newUserId>, fullName: '', vehicleType: 'Mototaxi',
       verificationStatus: 'PENDING_VERIFICATION', operationalStatus: 'ENABLED',
       ratingAverage: 0, ratingCount: 0, photoUrl: '' }
  4. DO NOT auto sign-in — redirect to /login with pending message
```

### 6.3 US-04 — Gestión de perfil (Ready for UI)

**Status:** Pending — 0% implemented.

| Task ID | Description | Priority |
|---|---|---|
| **TASK-US04-01** | Create `profile-page` component with view/edit toggle | HIGH |
| **TASK-US04-02** | Create `profile-edit-form` component (fullName, photoUrl fields) | HIGH |
| **TASK-US04-03** | Add `updateProfile(profileId, data)` in `IamApiService`: PATCH /profiles/{id} | HIGH |
| **TASK-US04-04** | Add `updateProfile(data)` action in `IamStore`: API call → update signal → persist session | HIGH |
| **TASK-US04-05** | Add routes `/passenger/profile` and `/driver/profile` as children of passenger/driver layouts | HIGH |
| **TASK-US04-06** | Show driver documents (brevete, SOAT, verificationStatus) when role is DRIVER | MEDIUM |
| **TASK-US04-07** | Show reputation score section (integrate with TrustReputationStore — US-23) | MEDIUM |
| **TASK-US04-08** | Update sidebar avatar and name reactively when profile changes | MEDIUM |
| **TASK-US04-09** | Add nav items: "Mi perfil" already exists in passenger-layout.html. Add "Mi perfil" to driver-layout.html | HIGH |

### 6.4 US-05 — Cierre de sesión (Verification only)

**Status:** ✅ Implemented — needs verification pass.

| Task ID | Description | Priority |
|---|---|---|
| **TASK-US05-01** | Verify logout button in `passenger-layout.html` calls `IamStore.signOut()` | MEDIUM |
| **TASK-US05-02** | Verify logout button in `driver-layout.html` calls `IamStore.signOut()` | MEDIUM |
| **TASK-US05-03** | Verify localStorage is cleared on sign out | MEDIUM |
| **TASK-US05-04** | Verify redirect to `/login` after sign out | MEDIUM |

---

## 7. Cross-Bounded-Context Integration

### 7.1 IAM → All Bounded Contexts

```
┌──────────────────────────────────────────────────────────┐
│                      IAM Store                            │
│                                                           │
│  currentAccount() → { id, email, role }                   │
│  currentProfile() → { id, accountId, fullName, photoUrl } │
│  isAuthenticated() → boolean                              │
│  role() → 'PASSENGER' | 'DRIVER' | 'ADMIN'               │
└──────────┬───────────────────────────────────────────────┘
           │
           │ consumed by ALL bounded contexts
           │
    ┌──────┼──────────────────┬──────────────────┐
    ▼      ▼                  ▼                  ▼
┌────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────┐
│ Ride   │ │Monetization│ │ Driver   │ │Trust &       │
│Dispatch│ │            │ │ Mgmt     │ │Reputation    │
└────────┘ └────────────┘ └──────────┘ └──────────────┘
```

**Key integration points:**
- `passenger-request-page` uses `IamStore.currentAccount()?.id` to submit ride requests
- `driver-dashboard-page` uses `IamStore.currentAccount()?.id` to load driver profile
- `MonetizationPage` uses `IamStore` to identify current driver
- Layout components use `IamStore.currentProfile()` for sidebar user info
- `IamStore.role()` determines which layout/dashboard to show

---

## 8. File Naming Convention

| Concept | Pattern | Example |
|---|---|---|
| **Entity** | `{concept}.entity.ts` | `account.entity.ts`, `profile.entity.ts` |
| **Type** | `{concept}.type.ts` | `registration-status.type.ts` |
| **Store** | `iam.store.ts` | `iam.store.ts` |
| **API Service** | `iam-api.service.ts` | `iam-api.service.ts` |
| **API Response DTO** | `{concept}-response.ts` | `auth-response.ts`, `profile-response.ts` |
| **Assembler** | `{concept}-assembler.ts` | `account-assembler.ts`, `profile-assembler.ts` |
| **Component** | `{feature-name}.ts` in own folder | `register-passenger-form/register-passenger-form.ts` |
| **Component selector** | `app-{feature-name}` | `app-register-passenger-form` |

---

## 9. Coding Patterns Reference

### 9.1 Entity Pattern

```typescript
export class Account {
  id: string = '';
  email: string = '';
  role: UserRole = 'PASSENGER';
}
```

### 9.2 Store Action Pattern (for registration)

```typescript
registerPassenger(email: string, password: string): void {
  this.loadingSignal.set(true);
  this.errorSignal.set(null);
  this.api.registerPassenger(email, password).subscribe({
    next: (account) => {
      this.currentAccountSignal.set(account);
      this.loadProfile(account.id);  // reuse existing flow
    },
    error: (err) => {
      this.loadingSignal.set(false);
      this.errorSignal.set('El correo ya está registrado.');
    }
  });
}
```

### 9.3 API Service Pattern (for POST operations)

```typescript
registerPassenger(email: string, password: string): Observable<Account> {
  // Step 1: Create user
  return this.http.post<AuthResponse>(`${this.baseUrl}/users`, {
    email, password, role: 'PASSENGER'
  }).pipe(
    switchMap(user => {
      // Step 2: Create profile
      return this.http.post(`${this.baseUrl}/profiles`, {
        accountId: user.id, fullName: '', email, photoUrl: ''
      }).pipe(map(() => AccountAssembler.toEntity(user)));
    })
  );
}
```

### 9.4 Component Pattern (Reactive Form)

```typescript
@Component({
  selector: 'app-register-passenger-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `...`,
  styles: [`...`],
})
export class RegisterPassengerForm {
  protected store = inject(IamStore);
  protected form = new FormGroup({ ... });
  // ...validation, submit, error handling
}
```

---

## 10. Quick Reference — Key Files

| File | Purpose | Status |
|---|---|---|
| `src/app/iam/application/iam.store.ts` | State management (signals + actions) | ✅ → 🔧 Extend |
| `src/app/iam/domain/model/account.entity.ts` | Account entity | ✅ Complete |
| `src/app/iam/domain/model/profile.entity.ts` | Profile entity | ✅ Complete |
| `src/app/iam/infrastructure/iam-api.service.ts` | HTTP gateway | ✅ → 🔧 Extend |
| `src/app/iam/infrastructure/auth-response.ts` | DTO for /users | ✅ Complete |
| `src/app/iam/infrastructure/account-assembler.ts` | AuthResponse → Account | ✅ Complete |
| `src/app/iam/infrastructure/profile-response.ts` | DTO for /profiles | ✅ Complete |
| `src/app/iam/infrastructure/profile-assembler.ts` | ProfileResponse → Profile | ✅ Complete |
| `src/app/iam/presentation/components/login-form/login-form.ts` | Login page | ✅ Complete |
| `src/app/iam/presentation/components/register-passenger-form/register-passenger-form.ts` | Passenger registration form | 🆕 Create |
| `src/app/iam/presentation/components/register-driver-form/register-driver-form.ts` | Driver registration form | 🆕 Create |
| `src/app/iam/presentation/components/profile-page/profile-page.ts` | Profile view/edit page | 🆕 Create |
| `src/app/iam/presentation/components/profile-edit-form/profile-edit-form.ts` | Profile edit form | 🆕 Create |
| `server/db.json` → `users` collection | Seed user accounts | ✅ → 🔧 Add new entries |
| `server/db.json` → `profiles` collection | Seed user profiles | ✅ → 🔧 Add new entries |
| `server/db.json` → `drivers` collection | Seed driver records | ✅ → 🔧 Add new entries |
| `src/app/app.routes.ts` | Application routes | 🔧 Add /register/*, /passenger/profile, /driver/profile |

---

## 11. Summary

**IAM Sprint 3 scope:**

| Story | Description | Effort | New Files |
|---|---|---|---|
| ✅ **US-03** | Login | Done (Sprint 2) | 0 |
| ✅ **US-05** | Logout | Done (needs verify) | 0 |
| 🆕 **US-01** | Register passenger | 4 tasks | `register-passenger-form` |
| 🆕 **US-02** | Register driver | 4 tasks | `register-driver-form` |
| 🆕 **US-04** | Profile management | 5 tasks | `profile-page`, `profile-edit-form` |

**What NOT to implement (deferred/backend):**
- ❌ JWT token generation and validation (backend — TS-03, TS-04, TS-05)
- ❌ Password hashing (backend concern — mock passwords in db.json are acceptable)
- ❌ OAuth/social login
- ❌ Email verification flows
- ❌ Password reset flows
