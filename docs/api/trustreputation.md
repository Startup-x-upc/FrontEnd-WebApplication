# Trust & Reputation

**7 endpoints**  
**Base URL:** `/api/v1`

---

## Flujo típico

### Flujo: Post-ride rating

```
1. 🔴 ride:{rideId} → ride.completed     → el frontend detecta que el ride terminó
2. GET /trips/{tripId}/rating             → obtener el estado actual del rating (para saber si ya calificó)
3. POST /trips/{tripId}/rate-driver       → pasajero califica al conductor (score 1-5)
4. POST /trips/{tripId}/rate-passenger    → conductor califica al pasajero (score 1-5 + comment opcional)
5. GET /drivers/{driverId}/reputation     → consultar reputación actualizada del conductor
6. GET /passengers/{passengerId}/reputation → consultar reputación del pasajero

Alternativas si el usuario no quiere calificar:
- POST /trips/{tripId}/skip-driver-rating
- POST /trips/{tripId}/skip-passenger-rating
```

---

## Endpoints

### `POST /api/v1/trips/{tripId}/rate-driver`

**Summary:** Calificar al conductor (pasajero califica al conductor).

**Roles:** `ROLE_PASSENGER` (dueño del ride)

**Pagination:** N/A

---

**Propósito de negocio:**
Al finalizar un ride, el pasajero otorga un puntaje (1-5) al conductor. Este rating contribuye a la reputación del conductor.

**Precondiciones:**
- Usuario autenticado como pasajero.
- El `tripId` debe tener un `TripRating` asociado (se crea automáticamente al completarse el ride).
- El usuario debe ser el pasajero del ride.
- No debe haber calificado ya al conductor en este trip.

**Efectos:**
- Registra `driverScore` en el `TripRating`.
- Actualiza la reputación agregada del conductor (`DriverReputation`).

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres el pasajero de este ride |
| 404 | `NOT_FOUND` | TripRating no encontrado para este tripId |

**Schema:** Swagger UI → Trust & Reputation → `POST /trips/{tripId}/rate-driver`

---

### `POST /api/v1/trips/{tripId}/rate-passenger`

**Summary:** Calificar al pasajero (conductor califica al pasajero).

**Roles:** `ROLE_DRIVER` (conductor asignado al ride)

**Pagination:** N/A

---

**Propósito de negocio:**
Al finalizar un ride, el conductor otorga un puntaje (1-5) y un comentario opcional al pasajero. Este rating contribuye a la reputación del pasajero.

**Precondiciones:**
- Usuario autenticado como conductor.
- El conductor debe ser el asignado al ride.
- No debe haber calificado ya al pasajero en este trip.

**Efectos:**
- Registra `passengerScore` y `passengerComment` en el `TripRating`.
- Actualiza la reputación agregada del pasajero (`PassengerReputation`).

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres el conductor de este ride |
| 404 | `NOT_FOUND` | TripRating no encontrado para este tripId |

**Schema:** Swagger UI → Trust & Reputation → `POST /trips/{tripId}/rate-passenger`

---

### `POST /api/v1/trips/{tripId}/skip-driver-rating`

**Summary:** Omitir calificación del conductor.

**Roles:** `ROLE_PASSENGER` (dueño del ride)

**Pagination:** N/A

---

**Propósito de negocio:**
El pasajero decide no calificar al conductor. El rating queda como `SKIPPED` (no afecta la reputación).

**Precondiciones:**
- Usuario autenticado como pasajero.
- Debe ser el pasajero del ride.
- No debe haber calificado ya.

**Efectos:**
- El `driverScore` queda como `SKIPPED`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres el pasajero de este ride |
| 404 | `NOT_FOUND` | TripRating no encontrado para este tripId |

**Schema:** Swagger UI → Trust & Reputation → `POST /trips/{tripId}/skip-driver-rating`

---

### `POST /api/v1/trips/{tripId}/skip-passenger-rating`

**Summary:** Omitir calificación del pasajero.

**Roles:** `ROLE_DRIVER` (conductor asignado al ride)

**Pagination:** N/A

---

**Propósito de negocio:**
El conductor decide no calificar al pasajero. El rating queda como `SKIPPED`.

**Precondiciones:**
- Usuario autenticado como conductor.
- Debe ser el conductor asignado al ride.
- No debe haber calificado ya.

**Efectos:**
- El `passengerScore` queda como `SKIPPED`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres el conductor de este ride |
| 404 | `NOT_FOUND` | TripRating no encontrado para este tripId |

**Schema:** Swagger UI → Trust & Reputation → `POST /trips/{tripId}/skip-passenger-rating`

---

### `GET /api/v1/trips/{tripId}/rating`

**Summary:** Obtener el rating de un trip.

**Roles:** Participante del ride (pasajero o conductor)

**Pagination:** N/A

---

**Propósito de negocio:**
Consultar el estado de las calificaciones de un trip. Útil para que el frontend sepa si ya calificó, si el otro ya calificó, o si falta calificar.

**Precondiciones:**
- El `tripId` debe tener un `TripRating` asociado.
- El usuario debe ser participante del ride (pasajero o conductor).

**Efectos:**
- Retorna `TripRatingResponse` con `driverScore`, `passengerScore`, estado de cada uno.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres participante de este ride |
| 404 | `NOT_FOUND` | TripRating no encontrado para este tripId |

**Schema:** Swagger UI → Trust & Reputation → `GET /trips/{tripId}/rating`

---

### `GET /api/v1/drivers/{driverId}/reputation`

**Summary:** Consultar reputación de un conductor.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
Obtener el promedio de ratings, número total de calificaciones, y breakdown del conductor. Se muestra en el perfil del conductor y en las tarjetas de candidato durante la selección.

**Precondiciones:**
- El `driverId` debe existir y tener ratings.

**Efectos:**
- Retorna `DriverReputationResponse` con `averageRating`, `totalRatings`, `ratingDistribution`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |

**Schema:** Swagger UI → Trust & Reputation → `GET /drivers/{driverId}/reputation`

---

### `GET /api/v1/passengers/{passengerId}/reputation`

**Summary:** Consultar reputación de un pasajero.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
Obtener el promedio de ratings del pasajero. Los conductores pueden consultarlo al decidir si aceptan o no una solicitud (funcionalidad futura).

**Precondiciones:**
- El `passengerId` debe existir y tener ratings.

**Efectos:**
- Retorna `PassengerReputationResponse` con `averageRating`, `totalRatings`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |

**Schema:** Swagger UI → Trust & Reputation → `GET /passengers/{passengerId}/reputation`
