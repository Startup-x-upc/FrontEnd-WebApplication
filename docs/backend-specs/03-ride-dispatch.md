# 03 — Ride Dispatch Bounded Context

> **Dependencias:** IAM (User), Driver Management (Driver), Monetization (Wallet, FarePolicy)
> **Agregados:** RideRequest, Ride, DriverAvailability
> **Entidades satélite:** RideCandidate

---

## 1. Entities & Value Objects

### 1.1 RideStatus (Value Object / Enum)

```
PENDING → OPEN → CONFIRMED → ACCEPTED → DRIVER_ON_THE_WAY → DRIVER_ARRIVED → STARTED → COMPLETED
                                                                                   ↘ CANCELLED
```

- `PENDING`: estado inicial interno (nunca expuesto al frontend)
- `OPEN`: visible a drivers disponibles
- `CONFIRMED`: pasajero seleccionó candidato, ride aún no creado
- `ACCEPTED`: ride creado, conductor asignado
- `DRIVER_ON_THE_WAY`: conductor marcó "estoy en camino"
- `DRIVER_ARRIVED`: conductor marcó "llegué al origen"
- `STARTED`: viaje iniciado
- `COMPLETED`: viaje finalizado
- `CANCELLED`: cancelado antes de STARTED

### 1.2 RideRequest (Aggregate Root)

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK |
| `passengerId` | `UUID` | ✅ | FK → User.id |
| `selectedDriverId` | `UUID \| null` | No | Se setea al confirmar candidato |
| `origin` | `string` | ✅ | Coordenadas "lat,lng" |
| `destination` | `string` | ✅ | Coordenadas "lat,lng" |
| `distanceKm` | `number` | ✅ | Calculado por Haversine |
| `estimatedFare` | `number` | ✅ | Calculado desde FarePolicy |
| `status` | `RideStatus` | ✅ | `OPEN` al crear |
| `isExpired` | `boolean` | ✅ | `false` al crear |
| `createdAt` | `ISO 8601` | auto | |

**Read projections (pobladas en queries):**
| Campo | Tipo | Origen |
|---|---|---|
| `passengerName` | `string` | Profile.fullName |
| `passengerPhotoUrl` | `string` | Profile.photoUrl |

### 1.3 RideCandidate

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK |
| `requestId` | `UUID` | ✅ | FK → RideRequest.id |
| `driverId` | `UUID` | ✅ | FK → Driver.id |
| `driverName` | `string` | ✅ | Snapshot inmutable de Driver.fullName |
| `vehicleType` | `string` | ✅ | Snapshot inmutable de Driver.vehicleType |
| `ratingAverage` | `number` | ✅ | Snapshot inmutable de Driver.ratingAverage |
| `photoUrl` | `string` | No | Snapshot inmutable de Driver.photoUrl |
| `status` | `CandidateStatus` | ✅ | `'PROPOSED'` al crear |
| `appliedAt` | `ISO 8601` | auto | |

**CandidateStatus**: `'PROPOSED' | 'ACCEPTED' | 'REJECTED'`

> Los campos driverName/vehicleType/ratingAverage/photoUrl son snapshots inmutables tomados al momento de aplicar. No se actualizan si el driver cambia su perfil después.

### 1.4 Ride (Aggregate Root)

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK |
| `requestId` | `UUID` | ✅ | FK → RideRequest.id |
| `passengerId` | `UUID` | ✅ | FK → User.id |
| `driverId` | `UUID` | ✅ | FK → Driver.id |
| `origin` | `string` | ✅ | Copiado de RideRequest |
| `destination` | `string` | ✅ | Copiado de RideRequest |
| `estimatedFare` | `number` | ✅ | Copiado de RideRequest |
| `status` | `RideStatus` | ✅ | `ACCEPTED` al crear |
| `createdAt` | `ISO 8601` | auto | |
| `completedAt` | `ISO 8601 \| null` | No | Se setea al completar |

**Read projections (pobladas en queries):**
| Campo | Tipo | Origen |
|---|---|---|
| `driverName` | `string` | Driver.fullName |
| `passengerName` | `string` | Profile.fullName |

### 1.5 DriverAvailability

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK |
| `driverId` | `UUID` | ✅ | FK → Driver.id, unique (1:1) |
| `isAvailable` | `boolean` | ✅ | `false` por defecto |
| `isBusy` | `boolean` | ✅ | `false` por defecto |
| `activeRideId` | `UUID \| null` | No | FK → Ride.id |
| `latitude` | `number \| null` | No | |
| `longitude` | `number \| null` | No | |

> **Nota:** `latitude`/`longitude` existen en el modelo pero el frontend web no envía ubicación en tiempo real. Se poblarán cuando se implemente GPS nativo.

---

## 2. Business Rules & Invariants

| # | Regla |
|---|---|
| BR1 | Un pasajero solo puede tener UN RideRequest OPEN a la vez |
| BR2 | Un conductor solo puede aplicar UNA vez por RideRequest |
| BR3 | Solo el pasajero dueño del request puede seleccionar un candidato |
| BR4 | Al seleccionar un candidato: el elegido → ACCEPTED, los demás → REJECTED, el request → CONFIRMED, se crea el Ride |
| BR5 | Solo el conductor asignado puede avanzar el estado del Ride |
| BR6 | El Ride solo se puede cancelar antes de STARTED |
| BR7 | Al cancelar, se libera la disponibilidad del conductor (isBusy=false, activeRideId=null) |
| BR8 | Un RideRequest expira si pasan >60 segundos sin que el pasajero seleccione candidato y no hay candidatos |
| BR9 | El pasajero puede refrescar manualmente (polling) para ver cambios de estado |
| BR10 | Al completar un Ride (COMPLETED), se emite evento para que Monetization aplique la comisión |
| BR11 | Al completar un Ride, se emite evento para que Trust & Reputation abra la ventana de rating |
| BR12 | La transición de estados debe ser secuencial (no se puede saltar de ACCEPTED a STARTED) |
| BR13 | Un conductor con `isAvailable=false` o `isBusy=true` no debe aparecer en búsquedas de candidatos |

---

## 3. State Machine

```
RideRequest:        OPEN → CONFIRMED → (se crea Ride)
                        ↘ (expira si >60s sin candidato)

RideCandidate:      PROPOSED → ACCEPTED (seleccionado)
                             → REJECTED (no seleccionado)

Ride:               ACCEPTED → DRIVER_ON_THE_WAY → DRIVER_ARRIVED → STARTED → COMPLETED
                    ACCEPTED → CANCELLED (antes de STARTED)
                    DRIVER_ON_THE_WAY → CANCELLED
                    DRIVER_ARRIVED → CANCELLED
```

---

## 4. Commands

### 4.1 Create Ride Request

```
POST /rides/requests
Auth: Bearer token (PASSENGER)
```

**Request Body:**
```json
{
  "origin": "-9.47114,-78.30307",
  "destination": "-9.47219,-78.29879",
  "distanceKm": 1,
  "estimatedFare": 4.0
}
```

**Validaciones:**
- `origin`: requerido, formato "lat,lng"
- `destination`: requerido, formato "lat,lng"
- `distanceKm`: requerido, > 0
- `estimatedFare`: requerido, >= FarePolicy.minimumFare
- El pasajero no debe tener otro request OPEN

**Response 201:**
```json
{
  "id": "rr-550e8400-0001",
  "passengerId": "550e8400-e29b-41d4-a716-446655440000",
  "passengerName": "María Quispe",
  "passengerPhotoUrl": "https://i.pravatar.cc/150?img=47",
  "origin": "-9.47114,-78.30307",
  "destination": "-9.47219,-78.29879",
  "distanceKm": 1,
  "estimatedFare": 4.0,
  "status": "OPEN",
  "isExpired": false,
  "createdAt": "2026-06-15T21:00:00.000Z"
}
```

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | Solo pasajeros pueden crear solicitudes |
| 409 | `ALREADY_HAS_OPEN_REQUEST` | Ya tienes una solicitud abierta |
| 422 | `VALIDATION_ERROR` | Datos inválidos |

---

### 4.2 Apply as Candidate

```
POST /rides/requests/:requestId/candidates
Auth: Bearer token (DRIVER)
```

**Request Body:** (vacío — el backend obtiene driverId del token)

**Lógica:**
1. Verificar que el driver está disponible (isAvailable=true, isBusy=false)
2. Verificar que el driver no es RESTRICTED
3. Verificar que el driver no ha aplicado ya a este request
4. Crear RideCandidate con snapshot de Driver (fullName, vehicleType, ratingAverage, photoUrl)

**Response 201:**
```json
{
  "id": "rc-550e8400-0002",
  "requestId": "rr-550e8400-0001",
  "driverId": "770e8400-e29b-41d4-a716-446655440003",
  "driverName": "Carlos Mendoza",
  "vehicleType": "Mototaxi",
  "ratingAverage": 4.8,
  "photoUrl": "https://i.pravatar.cc/150?img=33",
  "status": "PROPOSED",
  "appliedAt": "2026-06-15T21:01:00.000Z"
}
```

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | Solo conductores pueden aplicar |
| 404 | `NOT_FOUND` | Request no encontrado |
| 409 | `DRIVER_NOT_AVAILABLE` | No estás disponible o estás ocupado |
| 409 | `ALREADY_APPLIED` | Ya aplicaste a este request |
| 409 | `REQUEST_EXPIRED` | La solicitud ya expiró |

---

### 4.3 Select Candidate (Passenger confirms driver)

```
POST /rides/requests/:requestId/select
Auth: Bearer token (PASSENGER, dueño del request)
```

**Request Body:**
```json
{
  "candidateId": "rc-550e8400-0002"
}
```

**Lógica (atómica):**
1. Validar que el request está OPEN y pertenece al pasajero
2. Validar que el candidato existe y está en PROPOSED
3. Marcar candidato seleccionado → ACCEPTED
4. Marcar otros candidatos → REJECTED
5. Marcar request → CONFIRMED, selectedDriverId = driverId
6. Crear Ride con status ACCEPTED
7. Marcar DriverAvailability: isBusy=true, activeRideId=ride.id

**Response 201:**
```json
{
  "ride": {
    "id": "r-550e8400-0003",
    "requestId": "rr-550e8400-0001",
    "passengerId": "550e8400-e29b-41d4-a716-446655440000",
    "driverId": "770e8400-e29b-41d4-a716-446655440003",
    "driverName": "Carlos Mendoza",
    "passengerName": "María Quispe",
    "origin": "-9.47114,-78.30307",
    "destination": "-9.47219,-78.29879",
    "estimatedFare": 4.0,
    "status": "ACCEPTED",
    "createdAt": "2026-06-15T21:02:00.000Z",
    "completedAt": null
  }
}
```

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | No eres el dueño del request |
| 404 | `NOT_FOUND` | Request o candidato no encontrado |
| 409 | `REQUEST_NOT_OPEN` | El request ya fue confirmado o expiró |
| 409 | `CANDIDATE_NOT_PROPOSED` | El candidato ya no está disponible |

---

### 4.4 Advance Ride Status

```
POST /rides/:rideId/advance
Auth: Bearer token (DRIVER asignado al ride)
```

**Request Body:**
```json
{
  "status": "DRIVER_ON_THE_WAY"
}
```

**Validaciones:**
- Solo el driver asignado puede avanzar
- La transición de estado debe ser válida (secuencial)
- No se puede avanzar si el ride está CANCELLED o COMPLETED

**Transiciones válidas:**
| De | A |
|---|---|
| `ACCEPTED` | `DRIVER_ON_THE_WAY` |
| `DRIVER_ON_THE_WAY` | `DRIVER_ARRIVED` |
| `DRIVER_ARRIVED` | `STARTED` |
| `STARTED` | `COMPLETED` |

**Response 200:** Ride entity actualizada

**Side effects cuando status=COMPLETED:**
1. `completedAt` = now
2. DriverAvailability: isBusy=false, activeRideId=null
3. Emitir `RideCompleted` event → Monetization (aplicar comisión)
4. Emitir `RideCompleted` event → Trust & Reputation (abrir ventana de rating)

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | No eres el conductor asignado |
| 404 | `NOT_FOUND` | Ride no encontrado |
| 409 | `INVALID_TRANSITION` | Transición de estado no permitida |

---

### 4.5 Cancel Ride

```
POST /rides/:rideId/cancel
Auth: Bearer token (PASSENGER dueño o DRIVER asignado)
```

**Validaciones:**
- Ride.status debe ser ACCEPTED, DRIVER_ON_THE_WAY, o DRIVER_ARRIVED
- Solo el passenger o driver del ride pueden cancelar

**Lógica (atómica):**
1. Marcar ride.status = CANCELLED
2. Liberar DriverAvailability: isBusy=false, activeRideId=null

**Response 200:** Ride entity con status CANCELLED

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | No eres parte de este ride |
| 404 | `NOT_FOUND` | Ride no encontrado |
| 409 | `CANNOT_CANCEL` | El ride ya empezó o ya fue cancelado |

---

## 5. Queries

### 5.1 Get Open Ride Requests

```
GET /rides/requests?status=OPEN
Auth: Bearer token (DRIVER)
```

**Response 200 (Read Model — enriquecido):**
```json
{
  "data": [
    {
      "id": "rr-550e8400-0001",
      "passengerId": "550e8400-e29b-41d4-a716-446655440000",
      "passengerName": "María Quispe",
      "passengerPhotoUrl": "https://i.pravatar.cc/150?img=47",
      "origin": "-9.47114,-78.30307",
      "destination": "-9.47219,-78.29879",
      "distanceKm": 1,
      "estimatedFare": 4.0,
      "status": "OPEN",
      "isExpired": false,
      "createdAt": "2026-06-15T21:00:00.000Z"
    }
  ]
}
```

> **Nota para el frontend:** Actualmente `getOpenRideRequests()` hace `forkJoin` de `GET /rideRequests?status=OPEN` + `GET /profiles` y joinea client-side. Con este endpoint el join lo hace el backend.

### 5.2 Get Ride Request By ID

```
GET /rides/requests/:requestId
Auth: Bearer token
```

**Response 200:** RideRequest enriquecido con passengerName, passengerPhotoUrl.

### 5.3 Get Candidates for Request

```
GET /rides/requests/:requestId/candidates
Auth: Bearer token (dueño del request)
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "rc-550e8400-0002",
      "requestId": "rr-550e8400-0001",
      "driverId": "770e8400-e29b-41d4-a716-446655440003",
      "driverName": "Carlos Mendoza",
      "vehicleType": "Mototaxi",
      "ratingAverage": 4.8,
      "photoUrl": "https://i.pravatar.cc/150?img=33",
      "status": "PROPOSED",
      "appliedAt": "2026-06-15T21:01:00.000Z"
    }
  ]
}
```

### 5.4 Get Driver Active Candidate

```
GET /drivers/:driverId/active-candidate
Auth: Bearer token (DRIVER propio)
```

**Response 200:** El RideCandidate PROPOSED del driver, o `null` si no tiene.

### 5.5 Get Active Ride for Driver

```
GET /drivers/:driverId/active-ride
Auth: Bearer token (DRIVER propio)
```

**Response 200:** El Ride activo del driver (no COMPLETED ni CANCELLED), enriquecido con passengerName. `null` si no tiene.

### 5.6 Get Ride By ID

```
GET /rides/:rideId
Auth: Bearer token
```

**Response 200:** Ride enriquecido con driverName, passengerName.

> **Nota para el frontend:** `getRideById()` actualmente hace `GET /rides/:id` y luego `GET /drivers?id=X` para enriquecer driverName. Con este endpoint el join lo hace el backend.

### 5.7 Get Passenger Trip History

```
GET /passengers/:passengerId/trips?status=COMPLETED
Auth: Bearer token
```

**Query Params:**
- `?status=COMPLETED` (opcional)
- `?sort=-completedAt` (default: más reciente primero)
- `?page=1&perPage=20`

**Response 200 (Read Model — enriquecido):**
```json
{
  "data": [
    {
      "id": "r-550e8400-0003",
      "driverName": "Carlos Mendoza",
      "origin": "-9.47114,-78.30307",
      "destination": "-9.47219,-78.29879",
      "estimatedFare": 4.0,
      "status": "COMPLETED",
      "createdAt": "2026-06-15T21:02:00.000Z",
      "completedAt": "2026-06-15T21:15:00.000Z"
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 1, "pages": 1 }
}
```

> **Nota:** Solo incluye `driverName`, no `passengerName` (el pasajero ya sabe quién es).

### 5.8 Get Driver Trip History

```
GET /drivers/:driverId/trips?status=COMPLETED
Auth: Bearer token
```

**Response 200:** Mismo formato que 5.7, pero con `passengerName` (sin `driverName`).

### 5.9 Get Driver Availability

```
GET /drivers/:driverId/availability
Auth: Bearer token
```

**Response 200:**
```json
{
  "id": "da-550e8400-0005",
  "driverId": "770e8400-e29b-41d4-a716-446655440003",
  "isAvailable": true,
  "isBusy": false,
  "activeRideId": null,
  "latitude": null,
  "longitude": null
}
```

---

## 6. Integration Events

### Events Consumed

| Evento | Origen | Acción |
|---|---|---|
| `DriverAvailabilityChanged` | Driver Management | Sincronizar DriverAvailability.isAvailable |

### Events Emitted

| Evento | Trigger | Consumidores |
|---|---|---|
| `RideCompleted` | Advance Ride a COMPLETED | Monetization (aplicar comisión 5%), Trust & Reputation (abrir ventana rating 24h) |
| `RideCancelled` | Cancel Ride | Driver Management (asegurar isBusy=false) |

---

## 7. Auth Requirements Summary

| Endpoint | Roles |
|---|---|
| `POST /rides/requests` | PASSENGER |
| `POST /rides/requests/:id/candidates` | DRIVER |
| `POST /rides/requests/:id/select` | PASSENGER (dueño) |
| `POST /rides/:id/advance` | DRIVER (asignado) |
| `POST /rides/:id/cancel` | PASSENGER o DRIVER (del ride) |
| `GET /rides/requests` | DRIVER |
| `GET /rides/requests/:id` | Autenticado |
| `GET /rides/requests/:id/candidates` | PASSENGER (dueño) |
| `GET /drivers/:id/active-candidate` | DRIVER (propio) |
| `GET /drivers/:id/active-ride` | DRIVER (propio) |
| `GET /rides/:id` | Autenticado |
| `GET /passengers/:id/trips` | Autenticado |
| `GET /drivers/:id/trips` | Autenticado |
| `GET /drivers/:id/availability` | Autenticado |
