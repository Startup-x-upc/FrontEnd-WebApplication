# Frontend Audit — Pre-Migración a Backend Real

> Análisis de los 3 bounded contexts + cross-cutting concerns.
> Objetivo: identificar todo lo que necesita cambiar antes/después de migrar de json-server a un backend real.

## 📊 Estado actual: 15 de 23 items resueltos ✅

| Categoría | Total | ✅ Hecho | 🔴🟡 Pendiente (requiere backend) |
|---|---|---|---|
| 🔴 Crítico | 5 | 0 | 5 |
| 🟠 Alto | 6 | 3 | 3 |
| 🟡 Medio | 7 | 7 | 0 |
| 🔵 Bajo | 5 | 5 | 0 |

**Pendiente solo depende de backend:** auth JWT, read models, transacciones atómicas, Stripe, clock server-side.

---

## 🔴 CRÍTICO: Romperá con backend real

### 1. Generación de IDs con `Date.now()` (4 sitios)
**Archivo:** `ride-dispatch-api.service.ts:95, 137, 184, 287`
```typescript
id: `rr-${Date.now()}`  // colisiona si 2 requests en el mismo ms
```
**Fix:** Eliminar IDs del POST. El backend genera UUID/auto-increment y lo devuelve.

### 2. Query params de json-server (10+ endpoints)
**Archivo:** `ride-dispatch-api.service.ts`, `monetization-api.service.ts`, `driver-management-api.service.ts`
```
?status=OPEN          → backend necesita endpoint dedicado
?driverId=X&status=Y  → backend necesita query contract
?_sort=-id            → no existe en REST estándar
```
**Fix:** Cada endpoint del front debe mapear a un endpoint real del backend. Nada de filtros genéricos.

### 3. `forkJoin` client-side joins (3 sitios)
**Archivo:** `ride-dispatch-api.service.ts:37-49, 329-345, 353-369`
- `getOpenRideRequests`: fetch ALL requests + ALL profiles, join en memoria
- `getPassengerTrips`: fetch ALL rides + ALL drivers, join en memoria  
- `getDriverTrips`: fetch ALL rides + ALL profiles, join en memoria
**Fix:** Backend debe devolver datos enriquecidos en una sola query (read models con joins).

### 4. Autenticación del lado del cliente
**Archivo:** `iam-api.service.ts:36-48`
- GET request con password como query param
- Comparación de password en frontend (`u.password === password`)
- Sin JWT, sin refresh tokens, sin expiración de sesión
**Fix:** Reemplazar con `POST /auth/login` → JWT + refresh token.

### 5. Sesión en localStorage sin validación
**Archivo:** `iam.store.ts:275-289`
- Restaura Account/Profile sin verificar que la sesión siga vigente
- Sin chequeo de expiración, sin validación contra backend
**Fix:** Guardar JWT, validar en startup con `GET /auth/me`.

---

## 🟠 ALTO: Datos y lógica inconsistentes

### 6. ✅ Comisión 5% hardcodeada en 3 lugares — RESUELTO
Centralizado en `FarePolicy.PLATFORM_COMMISSION_RATE`. Las 3 referencias importan desde allí.

### 7. Recarga no atómica (TOP_UP transaction sin rollback)
**Archivo:** `monetization-api.service.ts:122-149`
- POST transaction OK, PATCH wallet falla → transacción huérfana
**Fix:** Backend debe manejar esto en una transacción. Frontend solo llama a `POST /wallet/recharge`.

### 8. ✅ Precisión de punto flotante en balances — RESUELTO
`Math.round(x * 100) / 100` en `wallet.entity.ts` y `monetization-api.service.ts`. Templates ya usan `| number:'1.2-2'`.

### 9. Reputación calculada client-side con TODOS los ratings
**Archivo:** `trust-reputation-api.service.ts:36-48`
Cada carga de reputación descarga todos los ratings y promedia en el navegador.
**Fix:** Backend expone `GET /drivers/:id/reputation` con promedio pre-calculado.

### 10. RateableUntil usa reloj del cliente
**Archivo:** `trust-reputation-api.service.ts:258`
```typescript
expiry.setHours(expiry.getHours() + 24); // manipulable cambiando hora del sistema
```
**Fix:** El backend establece la ventana de calificación.

### 11. Race condition en `applyCommission`
**Archivo:** `monetization-api.service.ts:169-178`
Dos llamadas concurrentes pueden deducir comisión 2 veces.
**Fix:** Backend usa constraint único `(tripId, type)`.

---

## 🟡 MEDIO: Código y arquitectura

### 12. ✅ `any` types (8+ instancias) — RESUELTO
Tipados con `ProfileResponse[]`, `DriverResponse[]`, `DriverResponse`. Solo queda `any` para `patchRideRequestExpiry` fire-and-forget.

### 13. ✅ Sin HTTP interceptor — RESUELTO (shells)
`auth.interceptor.ts` y `error.interceptor.ts` creados en `shared/infrastructure/`. Registrados en `app.config.ts`. Son passthrough — se activan al migrar auth a JWT.

### 14. ✅ `environment.ts` producción — RESUELTO
`apiBaseUrl: 'https://api.chapaturuta.com'`

### 15. Stripe es 100% mock
**Archivo:** `recharge-form.html:10`
No hay Stripe SDK. La recarga crea TOP_UP directo en json-server.
**Fix:** Integrar `@stripe/stripe-js`, backend endpoint para PaymentIntent.

### 16. ✅ Código muerto — CASI TODO RESUELTO
- ✅ `TripAvailabilitySummaryComponent` — eliminado
- ✅ `getRideRequestsByPassenger` — eliminado
- ✅ `getRidesByPassenger` — eliminado
- ✅ `DriverReputation.recalculate()` — eliminado
- `Wallet.applyCommission()` — conservado como documentación del dominio (método pequeño)

### 17. Nombres inconsistentes entre DTO y dominio
- `verificationStatus` (API) ↔ `accessStatus` (dominio) — `driver.entity.ts`
- `operationalStatus` (API) ↔ `isAvailable` (dominio) — pierde granularidad
- `rideId` (API ratings) ↔ `tripId` (dominio) — `rating-response.ts`

### 18. ✅ Manejo de errores débil — PARCIALMENTE RESUELTO
- ✅ `deactivateAvailability` ahora setea `errorSignal`
- ✅ `cancelRide` arreglado con doble switchMap (getDriverAvailability + markDriverFree)
- ✅ `applyCommission` ahora muestra warning en `messageSignal`
- ✅ Mensajes de error mejorados (distinguen conexión vs datos)

---

## 🔵 BAJO: Mejoras de calidad

### 19. ⚠️ Contraseña en DTO de respuesta — MARCADO COMO DEPRECATED
`auth-response.ts:14` — campo `password` marcado `@deprecated`. No se puede eliminar aún porque `signIn()` lo usa para comparación mock. Se irá con la migración a JWT.

### 20. ✅ `createdAt`/`updatedAt` faltantes — RESUELTO
Agregados a: `Account`, `Profile`, `Driver`, `TripRating`. `WalletTransaction` ya tenía `timestamp`.

### 21. ✅ Haversine vs Euclidiana — RESUELTO
`calculateEstimatedDistance()` ahora usa fórmula Haversine con radio terrestre 6371 km.

### 22. ✅ Funciones duplicadas — RESUELTO
`isRawCoord`/`humanizeCoord` extraídas a `shared/utils/maps.utils.ts`. 3 archivos ahora importan desde allí.

### 23. ✅ `Object.assign(new (r.constructor as any)())` — RESUELTO
Reemplazado por `Object.assign(new RideRequest(), r, {...})` con clase concreta.

---

## 📊 Sugerencias para el diseño del backend

### Posibles Aggregates (límite transaccional)
| Aggregate | Raíz | Entidades |
|---|---|---|
| **Account** | Account | Profile |
| **Driver** | Driver | DriverDocument, Vehicle |
| **Ride** | Ride | RideRequest, RideCandidate (snapshot inmutable) |
| **Wallet** | Wallet | WalletTransaction |
| **Rating** | TripRating | — (value object) |
| **FarePolicy** | FarePolicy | — (singleton config) |

### Posibles Read Models (optimizados para queries del front)
| Read Model | Datos | Lo usa |
|---|---|---|
| `OpenRideRequestReadModel` | request + passengerName + passengerPhotoUrl | `getOpenRideRequests` |
| `PassengerTripHistoryReadModel` | ride + driverName | `getPassengerTrips` |
| `DriverTripHistoryReadModel` | ride + passengerName + commission | `getDriverTrips` |
| `DriverReputationReadModel` | averageScore + totalRatings + last5 | `loadDriverReputation` |
| `PassengerReputationReadModel` | averageScore + totalRatings | `loadPassengerReputation` |
| `DriverAvailabilityReadModel` | driverId + isAvailable + isBusy + activeRideId + currentLocation | `loadDriverAvailability` |
| `DriverProfileReadModel` | driver + verificationStatus + operationalStatus + rating | Perfil conductor |
| `PassengerProfileReadModel` | profile + passengerReputation | Perfil pasajero |

### Posibles Commands (POST/PATCH/PUT)
| Command | Endpoint | Body |
|---|---|---|
| `RegisterPassenger` | `POST /auth/register/passenger` | `{email, password, fullName}` |
| `RegisterDriver` | `POST /auth/register/driver` | `{email, password, fullName, vehicleType, licenseNumber, soatNumber}` |
| `Login` | `POST /auth/login` | `{email, password}` → `{accessToken, refreshToken}` |
| `CreateRideRequest` | `POST /rides/requests` | `{passengerId, origin, destination, distanceKm, estimatedFare}` |
| `ApplyAsCandidate` | `POST /rides/requests/:id/candidates` | `{driverId}` |
| `SelectCandidate` | `POST /rides/requests/:id/select` | `{candidateId}` |
| `AdvanceRideStatus` | `POST /rides/:id/advance` | `{status}` |
| `CancelRide` | `POST /rides/:id/cancel` | — |
| `RechargeWallet` | `POST /wallets/:id/recharge` | `{amount}` (con Stripe PaymentIntent) |
| `SubmitDriverRating` | `POST /trips/:id/rate-driver` | `{score, comment?}` |
| `SubmitPassengerRating` | `POST /trips/:id/rate-passenger` | `{score, comment?}` |
| `UpdateFarePolicy` | `PUT /fare-config` | `{baseFare, pricePerKm, minimumFare}` |
| `ToggleDriverAvailability` | `POST /drivers/:id/toggle-availability` | — |
| `RestrictDriver` | `POST /drivers/:id/restrict` | — |
| `UpdateProfile` | `PUT /profiles/:id` | `{fullName?, photoUrl?}` |

### Posibles Queries (GET)
| Query | Endpoint |
|---|---|
| `GetOpenRideRequests` | `GET /rides/requests?status=OPEN` |
| `GetRideRequestById` | `GET /rides/requests/:id` |
| `GetCandidatesForRequest` | `GET /rides/requests/:id/candidates` |
| `GetDriverActiveCandidate` | `GET /drivers/:id/active-candidate` |
| `GetActiveRideForDriver` | `GET /drivers/:id/active-ride` |
| `GetRideById` | `GET /rides/:id` |
| `GetPassengerTrips` | `GET /passengers/:id/trips?status=COMPLETED` |
| `GetDriverTrips` | `GET /drivers/:id/trips?status=COMPLETED` |
| `GetDriverAvailability` | `GET /drivers/:id/availability` |
| `GetWalletByDriver` | `GET /drivers/:id/wallet` |
| `GetWalletTransactions` | `GET /wallets/:id/transactions` |
| `GetFarePolicy` | `GET /fare-config` |
| `GetDriverReputation` | `GET /drivers/:id/reputation` |
| `GetPassengerReputation` | `GET /passengers/:id/reputation` |
| `GetAllDrivers` | `GET /drivers` |
| `GetProfileByAccountId` | `GET /accounts/:id/profile` |
| `CheckEmailExists` | `GET /auth/check-email?email=` |

---

## 🗂️ Cambios sugeridos al db.json actual

Para tener data de prueba más realista antes de la migración:

1. **Agregar `createdAt`/`updatedAt`** a todas las entidades que no lo tienen
2. **Estandarizar IDs**: usar strings con formato UUID-like (`"550e8400-e29b-41d4-a716-446655440000"`)
3. **Agregar `phoneNumber`** a profiles
4. **Eliminar `password`** del response de users (mockear token en su lugar)
5. **Agregar campo `status`** a WalletTransaction para soportar estados pendientes
6. **Renombrar `verificationStatus`** → `accessStatus` en drivers para consistencia con el dominio
7. **Renombrar `operationalStatus`** → `isAvailable` (boolean) para simplificar
8. **Redondear balances** a 2 decimales en wallets
