# 02 — Driver Management Bounded Context

> **Dependencias:** IAM (User), Trust & Reputation (rating avg/count)
> **Agregado raíz:** Driver
> **Entidades satélite:** DriverDocument, VerificationReview (modo informativo)

---

## 1. Entities & Value Objects

### 1.1 Driver (Aggregate Root)

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK |
| `userId` | `UUID` | ✅ | FK → User.id, unique (1:1) |
| `fullName` | `string` | ✅ | Sincronizado con Profile.fullName |
| `vehicleType` | `string` | ✅ | Ej: 'Mototaxi' |
| `accessStatus` | `DriverAccessStatus` | ✅ | `'ACTIVE'` por defecto |
| `isAvailable` | `boolean` | ✅ | `false` por defecto. Toggle operativo |
| `ratingAverage` | `number` | auto | Computado desde TripRating. 0 si no tiene ratings |
| `ratingCount` | `number` | auto | Computado desde TripRating |
| `photoUrl` | `string` | No | Sincronizado con Profile.photoUrl |
| `licenseNumber` | `string` | ✅ | Brevete |
| `soatNumber` | `string` | ✅ | SOAT |
| `createdAt` | `ISO 8601` | auto | |
| `updatedAt` | `ISO 8601` | auto | |

**DriverAccessStatus**: `'ACTIVE' | 'PENDING_VERIFICATION' | 'RESTRICTED' | 'APPROVED' | 'REJECTED'`

> **Decisión de diseño:** `PENDING_VERIFICATION` y `APPROVED` existen por compatibilidad con datos mock. En producción, todos los drivers son `ACTIVE` por defecto. El admin puede cambiarlos a `RESTRICTED`. No hay flujo de aprobación.

### 1.2 DriverDocument

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK |
| `driverId` | `UUID` | ✅ | FK → Driver.id |
| `documentType` | `DocumentType` | ✅ | |
| `documentNumber` | `string` | ✅ | |
| `fileUrl` | `string` | No | URL del documento escaneado |
| `status` | `DocumentStatus` | ✅ | `'PENDING'` por defecto |
| `createdAt` | `ISO 8601` | auto | |

**DocumentType**: `'LICENSE' | 'SOAT' | 'TECHNICAL_INSPECTION' | 'PROPERTY_CARD'`
**DocumentStatus**: `'PENDING' | 'APPROVED' | 'REJECTED'`

### 1.3 VerificationReview

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK |
| `driverId` | `UUID` | ✅ | FK → Driver.id |
| `reviewerId` | `UUID` | ✅ | FK → User.id (admin) |
| `status` | `VerificationStatus` | ✅ | |
| `comments` | `string` | No | |
| `reviewedAt` | `ISO 8601` | auto | |

**VerificationStatus**: `'PENDING' | 'APPROVED' | 'REJECTED'`

> **Nota:** DriverDocument y VerificationReview existen en el modelo pero NO tienen UI implementada actualmente. Son para funcionalidad futura de verificación documental.

---

## 2. Business Rules & Invariants

| # | Regla |
|---|---|
| BR1 | Un User DRIVER tiene exactamente un Driver (1:1) |
| BR2 | Solo ADMIN puede cambiar `accessStatus` de un Driver |
| BR3 | Solo el propio DRIVER o ADMIN puede togglear `isAvailable` |
| BR4 | `ratingAverage` y `ratingCount` son read-only desde este contexto. Se actualizan vía eventos desde Trust & Reputation |
| BR5 | Un Driver RESTRICTED no puede activar disponibilidad ni recibir rides |
| BR6 | `fullName` y `photoUrl` se sincronizan desde Profile cuando este se actualiza |

---

## 3. State Machine

```
Driver accessStatus:
  [Registro] → ACTIVE
  ACTIVE → RESTRICTED (admin)
  RESTRICTED → ACTIVE (admin)

Driver isAvailable:
  [Registro] → false
  false ⇄ true (toggle por driver o admin)
  (RESTRICTED bloquea el toggle a true)
```

---

## 4. Commands

### 4.1 Toggle Driver Availability

```
POST /drivers/:id/toggle-availability
Auth: Bearer token (DRIVER propio o ADMIN)
```

**Request Body:** (vacío)

**Validaciones:**
- Driver debe existir
- Driver.accessStatus !== 'RESTRICTED'
- Driver debe tener wallet con balance > 0 (ver BR del contexto Monetization)

**Response 200:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440003",
  "userId": "550e8400-e29b-41d4-a716-446655440002",
  "isAvailable": true,
  "isBusy": false,
  "activeRideId": null,
  "currentLocation": null
}
```

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 401 | `UNAUTHORIZED` | Token inválido |
| 403 | `FORBIDDEN` | No eres el driver ni admin |
| 404 | `NOT_FOUND` | Driver no encontrado |
| 409 | `DRIVER_RESTRICTED` | No puedes activarte, cuenta restringida |
| 409 | `INSUFFICIENT_BALANCE` | Saldo insuficiente para activarse |
| 422 | `ALREADY_BUSY` | Tienes un ride activo, no puedes cambiar disponibilidad |

### 4.2 Restrict Driver (Admin)

```
POST /drivers/:id/restrict
Auth: Bearer token (ADMIN)
```

**Request Body:**
```json
{
  "reason": "Documentos vencidos"
}
```

**Response 200:** Driver entity con `accessStatus: "RESTRICTED"`

### 4.3 Unrestrict Driver (Admin)

```
POST /drivers/:id/unrestrict
Auth: Bearer token (ADMIN)
```

**Response 200:** Driver entity con `accessStatus: "ACTIVE"`

---

## 5. Queries

### 5.1 Get All Drivers (Admin)

```
GET /drivers
Auth: Bearer token (ADMIN)
```

**Query Params:**
- `?accessStatus=ACTIVE` (opcional, filtro)
- `?page=1&perPage=20` (paginación)

**Response 200:**
```json
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "userId": "550e8400-e29b-41d4-a716-446655440002",
      "fullName": "Carlos Mendoza",
      "vehicleType": "Mototaxi",
      "accessStatus": "ACTIVE",
      "isAvailable": true,
      "ratingAverage": 4.8,
      "ratingCount": 120,
      "photoUrl": "https://i.pravatar.cc/150?img=33",
      "licenseNumber": "Q12345678",
      "soatNumber": "S987654321",
      "createdAt": "2026-06-15T21:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 1,
    "pages": 1
  }
}
```

### 5.2 Get Driver By ID

```
GET /drivers/:id
Auth: Bearer token (cualquier rol autenticado)
```

**Response 200:** Driver entity (mismo shape que en 5.1, objeto singular)

### 5.3 Get Driver By User ID

```
GET /users/:userId/driver
Auth: Bearer token (cualquier rol autenticado)
```

**Response 200:** Driver entity asociado al User

> **Nota:** Este endpoint reemplaza el mock `GET /drivers?accountId=X`. El frontend lo usa en `DriverManagementStore.loadDriverByAccountId()`.

---

## 6. Integration Events

### Events Consumed

| Evento | Origen | Acción |
|---|---|---|
| `DriverRegistered` | IAM | Crear Driver entity |
| `ProfileUpdated` | IAM | Sincronizar fullName, photoUrl en Driver |
| `DriverReputationUpdated` | Trust & Reputation | Actualizar ratingAverage, ratingCount |

### Events Emitted

| Evento | Trigger | Consumidores |
|---|---|---|
| `DriverAvailabilityChanged` | Toggle availability | Ride Dispatch (actualizar DriverAvailability) |

---

## 7. Auth Requirements Summary

| Endpoint | Roles |
|---|---|
| `POST /drivers/:id/toggle-availability` | DRIVER (propio), ADMIN |
| `POST /drivers/:id/restrict` | ADMIN |
| `POST /drivers/:id/unrestrict` | ADMIN |
| `GET /drivers` | ADMIN |
| `GET /drivers/:id` | Autenticado |
| `GET /users/:userId/driver` | Autenticado |
