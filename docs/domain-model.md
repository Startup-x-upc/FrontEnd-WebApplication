# Domain Model — Frontend Extraction for Backend Design

> Extraído del código Angular del frontend. Cada entidad, atributo, tipo, relación y contrato de API documentado aquí.
> 
> **Para las especificaciones detalladas de backend (comandos, queries, reglas de negocio, contratos de error, auth):** ver los 5 documentos en [`docs/backend-specs/`](./backend-specs/).

---

## Arquitectura de Bounded Contexts

```
┌──────────────────────────────────────────────────────┐
│                    IAM (Identity)                      │
│  User, Profile, UserRole                               │
└──────────┬───────────────────────────┬────────────────┘
           │                           │
    ┌──────▼──────┐            ┌──────▼──────────────┐
    │ Driver Mgmt │            │ Trust & Reputation   │
    │ Driver      │            │ TripRating           │
    │ Documents   │            │ DriverReputation     │
    │ VerifReview │            │ PassengerReputation  │
    └──────┬──────┘            └──────────────────────┘
           │
    ┌──────▼──────────┐
    │ Ride Dispatch   │
    │ Ride, RideReq   │
    │ RideCandidate   │
    │ DriverAvail     │
    └──────┬──────────┘
           │
    ┌──────▼──────────┐
    │ Monetization    │
    │ FarePolicy      │
    │ Wallet, WalletTx│
    └─────────────────┘
```

---

## 1. IAM — Identity & Access Management

> ⚠️ **Planned changes vs código actual:**
> - `User` → `User` (nombre canónico en IAM)
> - Se agrega `passwordHash` a User (ausente en el mock actual)
> - Se elimina `email` de Profile (estaba denormalizado por json-server; con backend real el email vive solo en User)

### 1.1 Enums / Types

```typescript
type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN'
```

### 1.2 User (antes User)

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK |
| `email` | `string` | `''` | Único, sirve como login |
| `passwordHash` | `string` | `''` | Hash bcrypt/argon2. **Nuevo** — mock actual usa `password` plano en DTO |
| `role` | `UserRole` | `'PASSENGER'` | |
| `createdAt` | `string` (ISO) | `''` | |
| `updatedAt` | `string` (ISO) | `''` | |

Métodos: ninguno (data class pura).

### 1.3 Profile

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK |
| `userId` | `string` | `''` | FK → User.id **(renombrado de `accountId`)** |
| `fullName` | `string` | `''` | Nombre público |
| `photoUrl` | `string` | `''` | Avatar |
| `createdAt` | `string` (ISO) | `''` | |
| `updatedAt` | `string` (ISO) | `''` | |

Relación: 1:1 con User.
**Eliminado:** `email` — con backend real el email se obtiene del User o del read model del perfil.

---

## 2. Driver Management

### 2.1 Enums / Types

```typescript
type DriverAccessStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'RESTRICTED' | 'APPROVED' | 'REJECTED'
type DocumentType = 'LICENSE' | 'SOAT' | 'TECHNICAL_INSPECTION' | 'PROPERTY_CARD'
type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
```

### 2.2 Driver `implements BaseEntity`

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK |
| `userId` | `string` | `''` | FK → User.id **(renombrado de `accountId`)** |
| `fullName` | `string` | `''` | |
| `vehicleType` | `string` | `''` | Ej: 'Mototaxi' |
| `ratingAverage` | `number` | `0` | Denormalizado |
| `ratingCount` | `number` | `0` | Denormalizado |
| `photoUrl` | `string` | `''` | |
| `isAvailable` | `boolean` | `false` | Operativo |
| `accessStatus` | `DriverAccessStatus` | `'ACTIVE'` | |
| `licenseNumber` | `string` | `''` | Brevete |
| `soatNumber` | `string` | `''` | SOAT |
| `createdAt` | `string` (ISO) | `''` | |
| `updatedAt` | `string` (ISO) | `''` | |

Relación: 1:1 con User.

### 2.3 DriverDocument `implements BaseEntity`

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK |
| `driverId` | `string` | `''` | FK → Driver.id |
| `documentType` | `DocumentType` | `'LICENSE'` | |
| `documentNumber` | `string` | `''` | |
| `fileUrl` | `string` | `''` | |
| `status` | `DocumentStatus` | `'PENDING'` | |

Relación: N:1 con Driver.

### 2.4 VerificationReview `implements BaseEntity`

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK |
| `driverId` | `string` | `''` | FK → Driver.id |
| `reviewerId` | `string` | `''` | FK → User.id (admin) |
| `status` | `VerificationStatus` | `'PENDING'` | |
| `comments` | `string` | `''` | |
| `reviewedAt` | `string` (ISO) | `''` | |

Relación: N:1 con Driver.

### 2.5 API-Domain Field Mapping (DriverAssembler)

| API Response (`DriverResponse`) | Domain (`Driver`) | Transformación |
|---|---|---|
| `verificationStatus: string` | `accessStatus: DriverAccessStatus` | Cast directo |
| `operationalStatus: string` | `isAvailable: boolean` | `=== 'ENABLED'` |
| `ratingAverage?: number` | `ratingAverage: number` | `?? 0` |
| `ratingCount?: number` | `ratingCount: number` | `?? 0` |
| `photoUrl?: string` | `photoUrl: string` | `?? ''` |
| `licenseNumber?: string` | `licenseNumber: string` | `?? ''` |
| `soatNumber?: string` | `soatNumber: string` | `?? ''` |

---

## 3. Ride Dispatch

### 3.1 RideStatus (enum)

```
PENDING → OPEN → CONFIRMED → ACCEPTED → DRIVER_ON_THE_WAY → DRIVER_ARRIVED → STARTED → COMPLETED
                                                                                    ↘ CANCELLED (any point)
```

### 3.2 Ride `implements BaseEntity`

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK |
| `passengerId` | `string` | `''` | FK → User.id |
| `driverId` | `string` | `''` | FK → Driver.id |
| `origin` | `string` | `''` | Coordenadas "lat,lng" |
| `destination` | `string` | `''` | Coordenadas "lat,lng" |
| `status` | `RideStatus` | `PENDING` | |
| `estimatedFare` | `number` | `0` | |
| `createdAt` | `string` (ISO) | `''` | |
| `completedAt` | `string` (ISO) | `''` | Se pone al completar |
| `driverName` | `string` | `''` | ⚡ Read projection (join Drivers) |
| `passengerName` | `string` | `''` | ⚡ Read projection (join Profiles) |

Métodos: `start()`, `complete()`, `cancel()`, `accept()` — cada uno setea `status`.

### 3.3 RideRequest `implements BaseEntity`

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK |
| `passengerId` | `string` | `''` | FK → User.id |
| `selectedDriverId` | `string \| null` | `null` | FK → Driver.id, nullable |
| `origin` | `string` | `''` | |
| `destination` | `string` | `''` | |
| `distanceKm` | `number` | `0` | |
| `status` | `string` | `'OPEN'` | Usa string, no enum |
| `estimatedFare` | `number` | `0` | |
| `isExpired` | `boolean` | `false` | |
| `createdAt` | `string` (ISO) | `''` | |
| `passengerName?` | `string` | opcional | ⚡ Read projection (join Profiles) |
| `passengerPhotoUrl?` | `string` | opcional | ⚡ Read projection (join Profiles) |

Métodos: `expire()` → `isExpired = true`.

### 3.4 RideCandidate `implements BaseEntity`

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK |
| `requestId` | `string` | `''` | FK → RideRequest.id |
| `driverId` | `string` | `''` | FK → Driver.id |
| `driverName` | `string` | `''` | ⚡ Snapshot inmutable del Driver |
| `vehicleType` | `string` | `''` | ⚡ Snapshot inmutable |
| `ratingAverage` | `number` | `0` | ⚡ Snapshot inmutable |
| `photoUrl` | `string` | `''` | ⚡ Snapshot inmutable |
| `status` | `CandidateStatus` | `'PROPOSED'` | |
| `appliedAt` | `string` (ISO) | `''` | |

`CandidateStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED'`

### 3.5 DriverAvailability `implements BaseEntity`

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK |
| `driverId` | `string` | `''` | FK → Driver.id |
| `isAvailable` | `boolean` | `false` | Online/offline |
| `isBusy` | `boolean` | `false` | En ride activo |
| `activeRideId` | `string \| null` | `null` | FK → Ride.id |
| `latitude` | `number` | `0` | |
| `longitude` | `number` | `0` | |

API-Domain mapping: `currentLocation: "lat,lng"` (string) → `latitude: number, longitude: number`

---

## 4. Monetization

### 4.1 Enums / Types

```typescript
type WalletStatus = 'ACTIVE' | 'BLOCKED'
type TransactionType = 'TOP_UP' | 'TOP_UP_FAILED' | 'COMMISSION'
```

### 4.2 FarePolicy `implements BaseEntity`

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK (singleton config) |
| `baseFare` | `number` | `0` | S/ |
| `pricePerKm` | `number` | `0` | S/ por km |
| `minimumFare` | `number` | `0` | S/ mínimo |

`PLATFORM_COMMISSION_RATE = 0.05` (static)

Métodos:
- `calculate(distanceKm)` → `max(minimumFare, baseFare + pricePerKm * distanceKm)`
- `configure(baseFare, pricePerKm, minimumFare)`

API-Domain: `id` es `number` en API, `string` en dominio (.toString()).

### 4.3 Wallet `implements BaseEntity`

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK |
| `driverId` | `string` | `''` | FK → Driver.id, único |
| `balance` | `number` | `0` | Redondeado a 2 decimales |
| `status` | `WalletStatus` | `'ACTIVE'` | |

Relación: 1:1 con Driver.

### 4.4 WalletTransaction `implements BaseEntity`

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK |
| `walletId` | `string` | `''` | FK → Wallet.id |
| `tripId` | `string` | `''` | FK → Ride.id ('' si TOP_UP) |
| `type` | `TransactionType` | `'TOP_UP'` | |
| `amount` | `number` | `0` | + para TOP_UP, - para COMMISSION |
| `resultingBalance` | `number` | `0` | Saldo después de la tx |
| `timestamp` | `string` (ISO) | `''` | |

API-Domain: `tripId` es `string | null` en API, `string` (empty) en dominio.

---

## 5. Trust & Reputation

### 5.1 Enums / Types

```typescript
type RatingStatus = 'PENDING' | 'RATED' | 'SKIPPED' | 'EXPIRED'
type RatedPartyType = 'DRIVER' | 'PASSENGER'
```

### 5.2 TripRating `implements BaseEntity`

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | PK |
| `tripId` | `string` | `''` | FK → Ride.id |
| `driverId` | `string` | `''` | FK → Driver.id |
| `passengerId` | `string` | `''` | FK → User.id |
| `driverRatingStatus` | `RatingStatus` | `'PENDING'` | |
| `passengerRatingStatus` | `RatingStatus` | `'PENDING'` | |
| `driverScore` | `number` | `0` | 1-5 |
| `passengerScore` | `number` | `0` | 1-5 |
| `passengerComment` | `string` | `''` | Solo si score ≤ 2 |
| `rateableUntil` | `string` (ISO) | `''` | Ventana 24h |
| `createdAt` | `string` (ISO) | `''` | |

API-Domain: `rideId` (API) ↔ `tripId` (dominio).

### 5.3 DriverReputation `implements BaseEntity` ⚡ Read Model

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | |
| `driverId` | `string` | `''` | FK → Driver.id |
| `averageScore` | `number` | `0` | |
| `totalRatings` | `number` | `0` | |

No es una colección propia en el mock — se computa al vuelo desde ratings.

### 5.4 PassengerReputation `implements BaseEntity` ⚡ Read Model

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `id` | `string` | `''` | |
| `passengerId` | `string` | `''` | FK → User.id |
| `averageScore` | `number` | `0` | |
| `totalRatings` | `number` | `0` | |

No es una colección propia en el mock — se computa al vuelo desde ratings.

---

## 6. Relaciones entre entidades (FK graph)

```
User ───1:1──→ Profile
User ───1:1──→ Driver
Driver  ───1:N──→ DriverDocument
Driver  ───1:N──→ VerificationReview
Driver  ───1:1──→ DriverAvailability
Driver  ───1:1──→ Wallet
Driver  ───1:1──→ DriverReputation ⚡
User ───1:1──→ PassengerReputation ⚡

User ───1:N──→ RideRequest (passengerId)
Driver  ───1:N──→ RideRequest (selectedDriverId, nullable)
RideRequest ──1:N──→ RideCandidate
RideCandidate ──N:1──→ Driver

RideRequest ──1:1──→ Ride (requestId implícito)
Ride ───1:1──→ TripRating (tripId)

Wallet ───1:N──→ WalletTransaction
```

---

## 7. Convenciones de nomenclatura API vs Dominio

| API (DTO) | Dominio (Entity) | Entidad |
|---|---|---|
| `verificationStatus` | `accessStatus` | Driver |
| `operationalStatus` | `isAvailable` | Driver |
| `currentLocation` (string "lat,lng") | `latitude`, `longitude` (numbers) | DriverAvailability |
| `rideId` | `tripId` | TripRating |
| `id: number` | `id: string` | FarePolicy |
| `tripId: string \| null` | `tripId: string` ('' = null) | WalletTransaction |

---

## 8. Read Projections (datos enriquecidos en queries)

Estos campos NO se persisten como parte de la entidad base. Se pueblan haciendo JOIN en el API service:

| Entidad | Campo Proyectado | Origen del JOIN |
|---|---|---|
| RideRequest | `passengerName`, `passengerPhotoUrl` | Profile |
| Ride | `driverName` | Driver |
| Ride | `passengerName` | Profile |
| RideCandidate | `driverName`, `vehicleType`, `ratingAverage`, `photoUrl` | Driver (snapshot al aplicar) |

---

## 9. Resumen de comandos y queries (desde el frontend)

### Comandos (mutaciones)

| Acción | Endpoint actual (mock) | Endpoint sugerido (backend) |
|---|---|---|
| Login | `GET /users?email=` + client-side compare | `POST /auth/login` |
| Register Passenger | `POST /users` + `POST /profiles` | `POST /auth/register/passenger` |
| Register Driver | `POST /users` + `POST /drivers` + `POST /wallets` | `POST /auth/register/driver` |
| Update Profile | `PATCH /profiles/:id` | `PUT /profiles/:id` |
| Create RideRequest | `POST /rideRequests` | `POST /rides/requests` |
| Apply as Candidate | `POST /rideCandidates` | `POST /rides/requests/:id/candidates` |
| Select Candidate | `PATCH rideRequest + PATCH candidates + POST ride + PATCH availability` | `POST /rides/requests/:id/select` |
| Advance Ride Status | `PATCH /rides/:id` | `POST /rides/:id/advance` |
| Cancel Ride | `PATCH /rides/:id` + `PATCH driverAvailability` | `POST /rides/:id/cancel` |
| Toggle Availability | `POST` or `PATCH /driverAvailability` | `POST /drivers/:id/toggle-availability` |
| Recharge Wallet | `POST /walletTransactions` + `PATCH /wallets/:id` | `POST /wallets/:id/recharge` |
| Apply Commission | `POST /walletTransactions` + `PATCH /wallets/:id` | Automático al completar ride |
| Rate Driver | `POST` or `PATCH /ratings` | `POST /trips/:id/rate-driver` |
| Rate Passenger | `POST` or `PATCH /ratings` | `POST /trips/:id/rate-passenger` |
| Update Fare Policy | `PUT /fareConfig/:id` | `PUT /fare-config` |
| Approve/Restrict Driver | `PATCH /drivers/:id` | `POST /drivers/:id/restrict` |

### Queries (lectura)

| Acción | Endpoint actual (mock) | Endpoint sugerido (backend) |
|---|---|---|
| Get Profile | `GET /profiles?accountId=` | `GET /users/:id/profile` |
| Get Open Requests | `GET /rideRequests?status=OPEN` + `GET /profiles` (forkJoin) | `GET /rides/requests?status=OPEN` (enriched) |
| Get Candidates | `GET /rideCandidates?requestId=` | `GET /rides/requests/:id/candidates` |
| Get Driver Active Candidate | `GET /rideCandidates?driverId=X&status=PROPOSED` | `GET /drivers/:id/active-candidate` |
| Get Active Ride (driver) | `GET /rides?driverId=` + filter active | `GET /drivers/:id/active-ride` |
| Get Passenger Trips | `GET /rides?passengerId=&status=COMPLETED` + `GET /drivers` (forkJoin) | `GET /passengers/:id/trips?status=COMPLETED` (enriched) |
| Get Driver Trips | `GET /rides?driverId=&status=COMPLETED` + `GET /profiles` (forkJoin) | `GET /drivers/:id/trips?status=COMPLETED` (enriched) |
| Get Driver Availability | `GET /driverAvailability?driverId=` | `GET /drivers/:id/availability` |
| Get Wallet | `GET /wallets?driverId=` | `GET /drivers/:id/wallet` |
| Get Transactions | `GET /walletTransactions?walletId=` | `GET /wallets/:id/transactions` |
| Get Fare Policy | `GET /fareConfig` (array, toma [0]) | `GET /fare-config` |
| Get Driver Reputation | `GET /ratings?driverId=` + compute client-side | `GET /drivers/:id/reputation` |
| Get Passenger Reputation | `GET /ratings?passengerId=` + compute client-side | `GET /passengers/:id/reputation` |
| Get All Drivers (admin) | `GET /drivers` | `GET /drivers` |
| Check Email | `GET /users?email=` | `GET /auth/check-email?email=` |
