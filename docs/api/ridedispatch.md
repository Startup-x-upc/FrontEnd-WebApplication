# Ride Dispatch

**14 endpoints**  
**Base URL:** `/api/v1`

---

## Máquina de estados del Ride

```
RideRequest:  OPEN → CONFIRMED (al seleccionar candidato)
Ride:         ACCEPTED → DRIVER_ON_THE_WAY → DRIVER_ARRIVED → STARTED → COMPLETED
                                                                        ↘ CANCELLED
```

**Estados completos del enum `RideStatus`:**
`PENDING` | `OPEN` | `CONFIRMED` | `ACCEPTED` | `DRIVER_ON_THE_WAY` | `DRIVER_ARRIVED` | `STARTED` | `COMPLETED` | `CANCELLED`

**Reglas:**
- `RideRequest` nace en `OPEN`, pasa a `CONFIRMED` cuando se selecciona candidato.
- `Ride` nace en `ACCEPTED` al crearse.
- Las transiciones son secuenciales y solo hacia adelante (no se puede saltar ni retroceder).
- `CANCELLED` solo es válido antes de `STARTED`. Una vez iniciado (`STARTED`), ya no se puede cancelar.
- `COMPLETED` y `CANCELLED` son estados terminales (no se puede avanzar desde ellos).

---

## Flujos típicos

### Flujo 1: Solicitud de viaje (pasajero → conductor asignado)

```
1. POST /rides/requests                         → pasajero crea solicitud
   🔴 ride-request:open → request.created
2. [Conductor] GET /rides/requests              → ver solicitudes abiertas
   (el frontend del conductor también escucha ride-request:open para notificaciones push)
3. POST /rides/requests/{requestId}/candidates  → conductor aplica
   🔴 ride-request:{requestId} → candidate.applied
4. [Pasajero] GET /rides/requests/{requestId}/candidates → revisar candidatos
5. POST /rides/requests/{requestId}/select       → pasajero elige conductor
   🔴 driver:{driverId} → ride.assigned
   🔴 ride-request:{requestId} → ride.assigned
```

### Flujo 2: Ejecución del ride (conductor)

```
1. GET /drivers/{driverId}/active-ride          → obtener ride asignado
2. POST /rides/{rideId}/advance {DRIVER_ON_THE_WAY} → conductor va en camino
   🔴 ride:{rideId} → ride.status-updated
3. POST /rides/{rideId}/advance {DRIVER_ARRIVED}    → conductor llegó
   🔴 ride:{rideId} → ride.status-updated
4. POST /rides/{rideId}/advance {STARTED}           → ride iniciado
   🔴 ride:{rideId} → ride.status-updated
5. POST /rides/{rideId}/advance {COMPLETED}         → ride completado
   🔴 ride:{rideId} → ride.status-updated
   🔴 ride:{rideId} → ride.completed
```

### Flujo 3: Cancelación

```
1. POST /rides/{rideId}/cancel                   → pasajero o conductor cancelan
   🔴 ride:{rideId} → ride.cancelled
   ⚠️ Solo antes de STARTED. Si el ride ya empezó, devuelve 422 CANNOT_CANCEL.
```

### Flujo 4: Historial de viajes

```
1. GET /passengers/{passengerId}/trips           → historial del pasajero
2. GET /drivers/{driverId}/trips                 → historial del conductor
   Ambos aceptan filtro opcional ?status=COMPLETED
```

---

## Endpoints

### `POST /api/v1/rides/requests`

**Summary:** Crear una solicitud de ride.

**Roles:** `ROLE_PASSENGER` | `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
Un pasajero solicita un viaje desde un origen hasta un destino. La solicitud queda en estado `OPEN` y se transmite a todos los conductores disponibles vía Ably.

**Precondiciones:**
- Usuario autenticado como pasajero.
- Origen y destino en formato `"lat, lng"` (ej. `"-12.0464, -77.0428"`).
- `distanceKm` > 0.
- `estimatedFare` >= tarifa mínima configurada en Monetization.
- El pasajero no debe tener otra solicitud `OPEN`.

**Efectos:**
- Crea un `RideRequest` en estado `OPEN`.
- 🔴 Publica `request.created` en `ride-request:open`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres pasajero ni admin |
| 400 | `VALIDATION_ERROR` | Coordenadas inválidas, distancia <= 0, tarifa < mínima |
| 422 | `ALREADY_HAS_OPEN_REQUEST` | Ya tienes una solicitud abierta |

**Schema:** Swagger UI → Ride Dispatch → `POST /rides/requests`

---

### `POST /api/v1/rides/requests/{requestId}/candidates`

**Summary:** Aplicar como candidato a una solicitud de ride.

**Roles:** `ROLE_DRIVER` | `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
Un conductor disponible se postula para tomar una solicitud de ride. El pasajero recibe una notificación en tiempo real.

**Precondiciones:**
- Usuario autenticado como conductor.
- El conductor debe tener un `Driver` registrado (no restringido).
- El conductor debe estar disponible (`isAvailable = true`) y no ocupado (`isBusy = false`).
- El `RideRequest` debe existir y estar en estado `OPEN`.
- El conductor no debe haber aplicado ya a este request.

**Efectos:**
- Agrega un `RideCandidate` a la solicitud.
- 🔴 Publica `candidate.applied` en `ride-request:{requestId}`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres conductor ni admin; o no tienes registro de conductor |
| 404 | `RIDEREQUEST_NOT_FOUND` | La solicitud no existe |
| 422 | `REQUEST_EXPIRED` | La solicitud ya expiró |
| 422 | `REQUEST_NOT_OPEN` | La solicitud ya no está abierta |
| 422 | `DRIVER_NOT_AVAILABLE` | No estás disponible, estás ocupado, o tienes cuenta restringida |
| 422 | `ALREADY_APPLIED` | Ya aplicaste a este request |

**Schema:** Swagger UI → Ride Dispatch → `POST /rides/requests/{requestId}/candidates`

---

### `POST /api/v1/rides/requests/{requestId}/select`

**Summary:** Seleccionar un conductor candidato para la solicitud.

**Roles:** `ROLE_PASSENGER` | `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
El pasajero revisa los candidatos y elige uno. Esto cierra el `RideRequest`, crea un `Ride`, y notifica al conductor seleccionado.

**Precondiciones:**
- Usuario autenticado como pasajero.
- El pasajero debe ser el dueño del `RideRequest`.
- El `RideRequest` debe estar en estado `OPEN`.
- El `candidateId` debe corresponder a un candidato que aplicó a este request.

**Efectos:**
- El `RideRequest` pasa a estado `CONFIRMED`.
- Los candidatos no seleccionados quedan como `REJECTED`.
- Crea un `Ride` en estado `ACCEPTED`.
- Marca al conductor como `isBusy = true`.
- 🔴 Publica `ride.assigned` en `driver:{driverId}` y `ride-request:{requestId}`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres pasajero ni admin; o no eres el dueño del request |
| 404 | `RIDEREQUEST_NOT_FOUND` | La solicitud no existe |
| 404 | `RIDECANDIDATE_NOT_FOUND` | El candidato no aplicó a este request |
| 422 | `REQUEST_NOT_OPEN` | La solicitud ya fue confirmada o expiró |
| 422 | `REQUEST_EXPIRED` | La solicitud expiró |

**Schema:** Swagger UI → Ride Dispatch → `POST /rides/requests/{requestId}/select`

---

### `POST /api/v1/rides/{rideId}/advance`

**Summary:** Avanzar el estado del ride.

**Roles:** `ROLE_DRIVER` | `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
El conductor asignado avanza el ride por las etapas: `ACCEPTED → DRIVER_ON_THE_WAY → DRIVER_ARRIVED → STARTED → COMPLETED`. Cada transición se notifica al pasajero vía Ably.

**Precondiciones:**
- Usuario autenticado como conductor.
- El conductor debe ser el asignado al ride.
- El `rideId` debe existir.
- El `status` enviado debe ser una transición válida desde el estado actual.

**Efectos:**
- Cambia el estado del `Ride` al `status` solicitado.
- 🔴 Publica `ride.status-updated` en `ride:{rideId}`.
- Si el nuevo estado es `COMPLETED`:
  - Libera al conductor (`isBusy = false`).
  - 🔴 Publica `ride.completed` en `ride:{rideId}`.

**Estados válidos para enviar en `status`:**
`DRIVER_ON_THE_WAY` | `DRIVER_ARRIVED` | `STARTED` | `COMPLETED`

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres conductor ni admin; o no eres el conductor asignado; o no tienes registro de conductor |
| 404 | `RIDE_NOT_FOUND` | El ride no existe |
| 422 | `INVALID_TRANSITION` | Transición no permitida (ej. saltar de ACCEPTED a COMPLETED, o status inválido) |

**Schema:** Swagger UI → Ride Dispatch → `POST /rides/{rideId}/advance`

---

### `POST /api/v1/rides/{rideId}/cancel`

**Summary:** Cancelar un ride.

**Roles:** `ROLE_PASSENGER` | `ROLE_DRIVER` | `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
El pasajero o el conductor cancelan el ride. Solo es posible antes de que el ride llegue a `STARTED`.

**Precondiciones:**
- Usuario autenticado (pasajero o conductor).
- El usuario debe ser participante del ride (pasajero o conductor asignado).
- El ride no debe estar en `STARTED`, `COMPLETED`, ni `CANCELLED`.

**Efectos:**
- Cambia el estado a `CANCELLED`.
- Libera al conductor (`isBusy = false`).
- 🔴 Publica `ride.cancelled` en `ride:{rideId}`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres participante del ride |
| 404 | `RIDE_NOT_FOUND` | El ride no existe |
| 422 | `CANNOT_CANCEL` | El ride ya empezó (STARTED), ya se completó, o ya fue cancelado |

**Schema:** Swagger UI → Ride Dispatch → `POST /rides/{rideId}/cancel`

---

### `GET /api/v1/rides/requests`

**Summary:** Listar solicitudes de ride abiertas.

**Roles:** `ROLE_DRIVER` | `ROLE_ADMIN`

**Pagination:** N/A (lista completa, sin paginación)

---

**Propósito de negocio:**
El conductor consulta las solicitudes disponibles para aplicar. Solo retorna requests en estado `OPEN`.

**Precondiciones:**
- Usuario autenticado como conductor o admin.

**Efectos:**
- Retorna lista de `RideRequestResource` con datos del pasajero (nombre, photoUrl).

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres conductor ni admin |

**Schema:** Swagger UI → Ride Dispatch → `GET /rides/requests`

---

### `GET /api/v1/rides/requests/{requestId}`

**Summary:** Obtener una solicitud de ride por ID.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
Consultar el detalle de una solicitud específica (origen, destino, tarifa, estado, pasajero).

**Precondiciones:**
- El `requestId` debe existir.

**Efectos:**
- Retorna `RideRequestResource` con datos del pasajero.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 404 | `RIDE_REQUEST_NOT_FOUND` | La solicitud no existe |

**Schema:** Swagger UI → Ride Dispatch → `GET /rides/requests/{requestId}`

---

### `GET /api/v1/rides/requests/{requestId}/candidates`

**Summary:** Listar candidatos de una solicitud.

**Roles:** `ROLE_PASSENGER` (dueño del request) | `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
El pasajero revisa los conductores que han aplicado a su solicitud para elegir uno.

**Precondiciones:**
- El usuario autenticado debe ser el pasajero dueño del `RideRequest`.
- El `requestId` debe existir.

**Efectos:**
- Retorna lista de `RideCandidateResource` (driverId, nombre, vehículo, rating, foto).

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres el dueño del request |

**Schema:** Swagger UI → Ride Dispatch → `GET /rides/requests/{requestId}/candidates`

---

### `GET /api/v1/drivers/{driverId}/active-candidate`

**Summary:** Obtener la aplicación activa de un conductor.

**Roles:** Dueño del driver | `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
El conductor consulta si tiene una aplicación pendiente (a qué request aplicó y si fue aceptado/rechazado). Retorna `null` si no tiene ninguna.

**Precondiciones:**
- El usuario autenticado debe ser el dueño del registro de conductor o admin.

**Efectos:**
- Retorna `RideCandidateResource` o `null`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres el dueño del conductor ni admin |

**Schema:** Swagger UI → Ride Dispatch → `GET /drivers/{driverId}/active-candidate`

---

### `GET /api/v1/drivers/{driverId}/active-ride`

**Summary:** Obtener el ride activo de un conductor.

**Roles:** Dueño del driver | `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
El conductor consulta el ride que tiene asignado y activo. Retorna `null` si no tiene ninguno.

**Precondiciones:**
- El usuario autenticado debe ser el dueño del registro de conductor o admin.

**Efectos:**
- Retorna `RideResource` con datos del ride y del pasajero, o `null`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres el dueño del conductor ni admin |

**Schema:** Swagger UI → Ride Dispatch → `GET /drivers/{driverId}/active-ride`

---

### `GET /api/v1/rides/{rideId}`

**Summary:** Obtener un ride por ID.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
Consultar el estado actual y los detalles de un ride. Útil como fallback si Ably no está disponible.

**Precondiciones:**
- El `rideId` debe existir.

**Efectos:**
- Retorna `RideResource` con datos de pasajero y conductor.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 404 | `RIDE_NOT_FOUND` | El ride no existe |

**Schema:** Swagger UI → Ride Dispatch → `GET /rides/{rideId}`

---

### `GET /api/v1/passengers/{passengerId}/trips`

**Summary:** Historial de viajes del pasajero.

**Roles:** Cualquier rol autenticado

**Pagination:** **0-based** — `page` (default=0), `perPage` (default=20)

---

**Propósito de negocio:**
Consultar el historial de rides completados/cancelados de un pasajero.

**Precondiciones:**
- El `passengerId` debe existir.

**Efectos:**
- Retorna lista paginada de `RideResource` con metadata.

**Query params:**

| Param | Default | Descripción |
|-------|---------|-------------|
| `status` | (todos) | Filtrar por `COMPLETED`, `CANCELLED`, etc. |
| `page` | 0 | Página (0-based) |
| `perPage` | 20 | Resultados por página |

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |

**Schema:** Swagger UI → Ride Dispatch → `GET /passengers/{passengerId}/trips`

---

### `GET /api/v1/drivers/{driverId}/trips`

**Summary:** Historial de viajes del conductor.

**Roles:** Cualquier rol autenticado

**Pagination:** **0-based** — `page` (default=0), `perPage` (default=20)

---

**Propósito de negocio:**
Consultar el historial de rides completados/cancelados de un conductor.

**Precondiciones:**
- El `driverId` debe existir.

**Efectos:**
- Retorna lista paginada de `RideResource` con metadata.

**Query params:**

| Param | Default | Descripción |
|-------|---------|-------------|
| `status` | (todos) | Filtrar por `COMPLETED`, `CANCELLED`, etc. |
| `page` | 0 | Página (0-based) |
| `perPage` | 20 | Resultados por página |

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |

**Schema:** Swagger UI → Ride Dispatch → `GET /drivers/{driverId}/trips`

---

### `GET /api/v1/drivers/{driverId}/availability`

**Summary:** Consultar disponibilidad del conductor.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
Saber si un conductor está disponible, ocupado, o inactivo.

**Precondiciones:**
- El `driverId` debe tener un registro de disponibilidad.

**Efectos:**
- Retorna `DriverAvailabilityResource` con `isAvailable`, `isBusy`, y `activeRideId` (si tiene).

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 404 | `AVAILABILITY_NOT_FOUND` | No hay registro de disponibilidad para ese driver |

**Schema:** Swagger UI → Ride Dispatch → `GET /drivers/{driverId}/availability`
