# 05 — Trust & Reputation Bounded Context

> **Dependencias:** IAM (User), Driver Management (Driver), Ride Dispatch (Ride)
> **Agregado raíz:** TripRating
> **Read Models:** DriverReputation, PassengerReputation

---

## 1. Entities & Value Objects

### 1.1 TripRating (Aggregate Root)

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK |
| `tripId` | `UUID` | ✅ | FK → Ride.id, unique (un rating por ride) |
| `driverId` | `UUID` | ✅ | FK → Driver.id |
| `passengerId` | `UUID` | ✅ | FK → User.id |
| `driverRatingStatus` | `RatingStatus` | ✅ | `'PENDING'` al crear |
| `passengerRatingStatus` | `RatingStatus` | ✅ | `'PENDING'` al crear |
| `driverScore` | `number \| null` | No | 1-5. null hasta que se califique |
| `passengerScore` | `number \| null` | No | 1-5. null hasta que se califique |
| `passengerComment` | `string \| null` | No | Se requiere si passengerScore ≤ 2 |
| `rateableUntil` | `ISO 8601` | ✅ | Ventana de 24h desde que se completa el ride |
| `createdAt` | `ISO 8601` | auto | |

**RatingStatus**: `'PENDING' | 'RATED' | 'SKIPPED' | 'EXPIRED'`

Métodos:
- `isStillRateable()` → `new Date() < rateableUntil`
- `rateDriver(score)` → set driverScore, driverRatingStatus='RATED'
- `ratePassenger(score)` → set passengerScore, passengerRatingStatus='RATED'
- `skipDriverRating()` → driverRatingStatus='SKIPPED'
- `skipPassengerRating()` → passengerRatingStatus='SKIPPED'

### 1.2 DriverReputation (Read Model)

| Campo | Tipo | Notas |
|---|---|---|
| `driverId` | `UUID` | FK → Driver.id |
| `averageScore` | `number` | Promedio de driverScore en ratings RATED |
| `totalRatings` | `number` | Count de ratings RATED para este driver |

> **No es una entidad persistida.** Se computa al vuelo desde TripRating. El endpoint GET lo calcula con una query agregada SQL o se cachea en Redis.

### 1.3 PassengerReputation (Read Model)

| Campo | Tipo | Notas |
|---|---|---|
| `passengerId` | `UUID` | FK → User.id |
| `averageScore` | `number` | Promedio de passengerScore en ratings RATED |
| `totalRatings` | `number` | Count de ratings RATED para este passenger |

> Igual que DriverReputation: read model computado, no entidad persistida.

---

## 2. Business Rules & Invariants

| # | Regla |
|---|---|
| BR1 | Solo existe UN TripRating por Ride (unique constraint en tripId) |
| BR2 | La ventana de rating es de 24 horas desde que el ride se completa |
| BR3 | No se puede calificar fuera de la ventana (rateableUntil) |
| BR4 | El score debe ser 1-5 (inclusive) |
| BR5 | Si passengerScore ≤ 2, se requiere passengerComment |
| BR6 | Un usuario no puede calificar dos veces al mismo party en el mismo ride |
| BR7 | El pasajero califica al driver; el driver califica al pasajero. Son independientes |
| BR8 | Se puede "skippear" una calificación (no es obligatorio calificar) |
| BR9 | `averageScore` se calcula como `SUM(scores) / COUNT(rated)` de TODOS los ratings del driver/passenger |
| BR10 | El read model de reputación se recalcula cada vez que se consulta (o se cachea por tiempo limitado) |

---

## 3. State Machine

```
TripRating lifecycle:
  [RideCompleted] → (se crea TripRating con ambos PENDING, rateableUntil = now + 24h)
  
  driverRatingStatus:   PENDING → RATED (driverScore 1-5)
                               → SKIPPED
  
  passengerRatingStatus: PENDING → RATED (passengerScore 1-5)
                                 → SKIPPED
  
  Después de rateableUntil → EXPIRED (no se puede calificar)
```

---

## 4. Commands

### 4.1 Submit Driver Rating (Passenger rates driver)

```
POST /trips/:tripId/rate-driver
Auth: Bearer token (PASSENGER del ride)
```

**Request Body:**
```json
{
  "score": 4
}
```

**Validaciones:**
- TripRating debe existir para este tripId
- `driverRatingStatus` debe ser PENDING
- Debe estar dentro de la ventana (rateableUntil > now)
- Solo el passenger del ride puede calificar
- `score`: 1-5

**Lógica:**
1. Actualizar TripRating: driverScore=score, driverRatingStatus='RATED'
2. Recalcular DriverReputation (o invalidar cache)

**Response 200:**
```json
{
  "id": "tr-550e8400-0009",
  "tripId": "r-550e8400-0003",
  "driverId": "770e8400-e29b-41d4-a716-446655440003",
  "passengerId": "550e8400-e29b-41d4-a716-446655440000",
  "driverRatingStatus": "RATED",
  "passengerRatingStatus": "PENDING",
  "driverScore": 4,
  "passengerScore": null,
  "passengerComment": null,
  "rateableUntil": "2026-06-16T21:15:00.000Z",
  "createdAt": "2026-06-15T21:15:00.000Z"
}
```

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | No eres el pasajero de este ride |
| 404 | `NOT_FOUND` | TripRating no encontrado |
| 409 | `ALREADY_RATED` | Ya calificaste a este conductor |
| 409 | `RATING_WINDOW_EXPIRED` | La ventana de 24h expiró |
| 422 | `INVALID_SCORE` | Score debe ser 1-5 |

---

### 4.2 Submit Passenger Rating (Driver rates passenger)

```
POST /trips/:tripId/rate-passenger
Auth: Bearer token (DRIVER del ride)
```

**Request Body:**
```json
{
  "score": 2,
  "comment": "El pasajero no estaba en el punto de recojo"
}
```

**Validaciones:**
- TripRating debe existir
- `passengerRatingStatus` debe ser PENDING
- Debe estar dentro de la ventana
- Solo el driver del ride puede calificar
- `score`: 1-5
- `comment`: requerido si score ≤ 2, máximo 500 caracteres

**Lógica:**
1. Actualizar TripRating: passengerScore=score, passengerRatingStatus='RATED', passengerComment=comment (si existe)
2. Recalcular PassengerReputation (o invalidar cache)

**Response 200:** TripRating actualizado.

**Errores:** Mismos que 4.1.

---

### 4.3 Skip Driver Rating

```
POST /trips/:tripId/skip-driver-rating
Auth: Bearer token (PASSENGER del ride)
```

**Request Body:** (vacío)

**Response 200:** TripRating con driverRatingStatus='SKIPPED'

---

### 4.4 Skip Passenger Rating

```
POST /trips/:tripId/skip-passenger-rating
Auth: Bearer token (DRIVER del ride)
```

**Request Body:** (vacío)

**Response 200:** TripRating con passengerRatingStatus='SKIPPED'

---

## 5. Queries

### 5.1 Get Driver Reputation

```
GET /drivers/:driverId/reputation
Auth: Bearer token (cualquier rol)
```

**Response 200:**
```json
{
  "driverId": "770e8400-e29b-41d4-a716-446655440003",
  "averageScore": 4.75,
  "totalRatings": 120
}
```

> **Nota para el frontend:** Actualmente `getDriverReputation()` descarga TODOS los ratings del driver y calcula el promedio en el navegador (`trust-reputation-api.service.ts:36-48`). Este endpoint devuelve el promedio pre-calculado por el backend.

### 5.2 Get Passenger Reputation

```
GET /passengers/:passengerId/reputation
Auth: Bearer token (cualquier rol)
```

**Response 200:**
```json
{
  "passengerId": "550e8400-e29b-41d4-a716-446655440000",
  "averageScore": 4.5,
  "totalRatings": 8
}
```

### 5.3 Get Trip Rating

```
GET /trips/:tripId/rating
Auth: Bearer token (passenger o driver del ride)
```

**Response 200:** TripRating entity completa.

---

## 6. Rating Flow (End-to-End)

```
1. RideDispatch: ride.status → COMPLETED → emite RideCompleted
2. Trust & Reputation recibe RideCompleted:
   a. Crear TripRating (tripId, driverId, passengerId)
   b. Ambos status = PENDING
   c. rateableUntil = now + 24h
3. Passenger califica → POST /trips/:tripId/rate-driver
4. Driver califica → POST /trips/:tripId/rate-passenger
5. (Opcional) Cualquiera puede skippear
6. Después de 24h, si sigue PENDING → EXPIRED (tarea programada o lazy check)
7. Cada rating actualiza el read model de reputación
```

---

## 7. Integration Events

### Events Consumed

| Evento | Origen | Acción |
|---|---|---|
| `RideCompleted` | Ride Dispatch | Crear TripRating con ventana 24h |

### Events Emitted

| Evento | Trigger | Consumidores |
|---|---|---|
| `DriverReputationUpdated` | Rating o skip de driver | Driver Management (actualizar ratingAverage/ratingCount) |
| `PassengerReputationUpdated` | Rating o skip de passenger | Ninguno actualmente |

---

## 8. Auth Requirements Summary

| Endpoint | Roles |
|---|---|
| `POST /trips/:id/rate-driver` | PASSENGER (del ride) |
| `POST /trips/:id/rate-passenger` | DRIVER (del ride) |
| `POST /trips/:id/skip-driver-rating` | PASSENGER (del ride) |
| `POST /trips/:id/skip-passenger-rating` | DRIVER (del ride) |
| `GET /drivers/:id/reputation` | Autenticado |
| `GET /passengers/:id/reputation` | Autenticado |
| `GET /trips/:id/rating` | Passenger o Driver del ride |
