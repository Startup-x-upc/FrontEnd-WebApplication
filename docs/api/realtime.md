# Realtime — Documentación Ably

> **Convención de nombrado de canales:**
> - `ride-request:open` — canal público para solicitudes abiertas (broadcast).
> - `ride-request:{requestId}` — canal de una solicitud específica (pasajero + candidatos).
> - `ride:{rideId}` — canal del ride activo (pasajero + conductor asignado).
> - `driver:{driverId}` — canal privado del conductor (asignaciones, alertas de wallet).

Todos los eventos se publican **después de confirmar la transacción** en base de datos (`@TransactionalEventListener(phase = AFTER_COMMIT)`). Si una llamada HTTP devuelve 2xx, el evento Ably correspondiente **ya fue publicado** (o se intentó publicar; si falla, se loguea el error).

---

## Canales y eventos

### Canal: `ride-request:open`

| Evento | Payload | Disparador HTTP |
|--------|---------|-----------------|
| `request.created` | `RideRequestCreatedEvent` | `POST /rides/requests` |

**Propósito:** Broadcast a todos los conductores disponibles de que hay una nueva solicitud abierta.

**Payload (`request.created`):**
```json
{
  "requestId": "uuid",
  "passengerId": "uuid",
  "origin": "-12.0464, -77.0428",
  "destination": "-12.1200, -77.0300",
  "distanceKm": 10.5,
  "estimatedFare": 25.0
}
```

---

### Canal: `ride-request:{requestId}`

| Evento | Payload | Disparador HTTP |
|--------|---------|-----------------|
| `candidate.applied` | `DriverAppliedEvent` | `POST /rides/requests/{requestId}/candidates` |
| `ride.assigned` | `RideAssignedEvent` | `POST /rides/requests/{requestId}/select` |

**Propósito:** El pasajero escucha este canal para saber cuándo un conductor aplica a su solicitud y cuándo se confirma la asignación.

**Payload (`candidate.applied`):**
```json
{
  "requestId": "uuid",
  "driverId": "uuid"
}
```

**Payload (`ride.assigned`):**
```json
{
  "rideId": "uuid",
  "requestId": "uuid",
  "driverId": "uuid"
}
```

---

### Canal: `ride:{rideId}`

| Evento | Payload | Disparador HTTP |
|--------|---------|-----------------|
| `ride.status-updated` | `RideStatusAdvancedEvent` | `POST /rides/{rideId}/advance` |
| `ride.completed` | `RideCompletedEvent` | `POST /rides/{rideId}/advance` (status=COMPLETED) |
| `ride.cancelled` | `RideCancelledEvent` | `POST /rides/{rideId}/cancel` |

**Propósito:** Tanto el pasajero como el conductor se suscriben a este canal para seguir el ciclo de vida del ride en tiempo real.

**Payload (`ride.status-updated`):**
```json
{
  "rideId": "uuid",
  "driverId": "uuid",
  "passengerId": "uuid",
  "status": "DRIVER_ON_THE_WAY"
}
```

**Valores posibles de `status`:**
`ACCEPTED` | `DRIVER_ON_THE_WAY` | `DRIVER_ARRIVED` | `STARTED` | `COMPLETED` | `CANCELLED`

**Payload (`ride.completed`):**
```json
{
  "rideId": "uuid",
  "driverId": "uuid",
  "estimatedFare": 25.0
}
```

**Payload (`ride.cancelled`):**
```json
{
  "rideId": "uuid",
  "driverId": "uuid"
}
```

---

### Canal: `driver:{driverId}`

| Evento | Payload | Disparador |
|--------|---------|------------|
| `ride.assigned` | `RideAssignedEvent` | `POST /rides/requests/{requestId}/select` |
| `wallet.empty` | `WalletEmptyEvent` | Sistema (al aplicar comisión que deja saldo en 0) |

**Propósito:** Canal privado del conductor. Recibe notificaciones de nuevas asignaciones y alertas de wallet vacía.

**Payload (`ride.assigned`):**
```json
{
  "rideId": "uuid",
  "requestId": "uuid",
  "driverId": "uuid"
}
```

**Payload (`wallet.empty`):**
```json
{
  "walletId": "uuid",
  "driverId": "uuid"
}
```

> ⚠️ `wallet.empty` no se dispara desde un endpoint HTTP directo. Ocurre como efecto secundario al aplicar una comisión (`POST /monetization/wallets/{walletId}/apply-commission`) cuando el saldo resultante es 0.00.

---

## Flujos de suscripción

### Flujo 1: Pasajero crea solicitud y espera conductor

```
1. POST /rides/requests                → request.created en ride-request:open
2. Frontend se suscribe a:
   ride-request:{requestId}            → candidate.applied (cada vez que un conductor aplica)
   ride-request:{requestId}            → ride.assigned (cuando el pasajero selecciona)
3. POST /rides/requests/{id}/candidates → candidate.applied en ride-request:{requestId}
4. GET /rides/requests/{id}/candidates  → el pasajero revisa la lista
5. POST /rides/requests/{id}/select     → ride.assigned en driver:{driverId} y ride-request:{requestId}
```

### Flujo 2: Conductor recibe asignación y ejecuta el ride

```
1. Frontend del conductor se suscribe a:
   ride-request:open                   → request.created (nuevas solicitudes)
   driver:{driverId}                   → ride.assigned (nuevas asignaciones)
   driver:{driverId}                   → wallet.empty (alerta de saldo)
2. GET /drivers/{driverId}/active-ride  → obtener el ride asignado
3. Frontend se suscribe a:
   ride:{rideId}                       → ride.status-updated, ride.completed, ride.cancelled
4. POST /rides/{rideId}/advance        → ride.status-updated en ride:{rideId}
   (repetir para cada transición: DRIVER_ON_THE_WAY → DRIVER_ARRIVED → STARTED → COMPLETED)
```

### Flujo 3: Seguimiento del pasajero durante el ride

```
1. Tras ride.assigned, frontend del pasajero se suscribe a:
   ride:{rideId}                       → ride.status-updated (seguir el avance)
   ride:{rideId}                       → ride.completed (fin del ride)
   ride:{rideId}                       → ride.cancelled (cancelación)
2. GET /rides/{rideId}                 → consultar estado actual en cualquier momento
```

---

## Manejo de errores de conexión Ably

- Si Ably no está disponible al iniciar, los eventos se pierden (no hay buffer en backend). Usar los endpoints GET como fallback: `GET /rides/{rideId}`, `GET /drivers/{driverId}/active-ride`, `GET /rides/requests/{requestId}/candidates`.
- El backend loguea errores de publicación pero **no revierte la transacción** (el evento es una consecuencia, no parte de la transacción).
