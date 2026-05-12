# Fake API Contracts

Este documento define la estructura de datos que devuelve `json-server` (la Fake API) basada en `server/db.json`. Estos contratos son los que la UI debe esperar y consumir a través de la capa de infraestructura estabilizada en el Sprint 2.

> [!IMPORTANT]
> Para el Sprint 2, la sincronización del flujo se implementará mediante **refresh manual**.
> No se usará:
>
> - realtime real
> - WebSockets
> - Ably
> - polling automático
> - tracking dinámico del motorizado en el mapa
>
> La visualización de conductores en el mapa será **referencial**, no una representación en vivo de movimiento.

---

## Collections

### users

Almacena las credenciales de acceso y el rol base del usuario autenticado.

```json
{
  "id": "u-001",
  "email": "pasajero@correo.com",
  "password": "pass123",
  "role": "PASSENGER"
}
```

### profiles

Almacena la información básica de visualización enlazada a una cuenta.
En este sprint se usará solo como soporte para la sesión y presentación básica del usuario autenticado.

```json
{
  "id": "p-001",
  "accountId": "u-001",
  "fullName": "María Quispe",
  "email": "pasajero@correo.com",
  "photoUrl": "https://i.pravatar.cc/150?img=47"
}
```

### drivers

Extensión del perfil del conductor con información operativa simplificada y reputación mock.
Funciona como una proyección útil para la demo.

```json
{
  "id": "d-001",
  "accountId": "u-002",
  "fullName": "Carlos Mendoza",
  "vehicleType": "Mototaxi",
  "verificationStatus": "APPROVED",
  "operationalStatus": "ENABLED",
  "ratingAverage": 4.8,
  "ratingCount": 120
}
```

**Uso principal en Sprint 2:**
- Consultar estado ampliado del conductor.
- Mostrar información referencial del conductor asignado.
- Soporte visual de reputación mock si se requiere.

### driverAvailability

Almacena la disponibilidad y ubicación referencial del conductor.

> [!NOTE]
> `currentLocation` no representa tracking en tiempo real.
> Solo se usa para ubicar visualmente al conductor en el mapa de forma estática o semiestática durante la demo.

```json
{
  "id": "da-001",
  "driverId": "d-001",
  "currentLocation": "-12.083, -77.031",
  "isAvailable": true
}
```

**Uso principal en Sprint 2:**
- Activar o desactivar disponibilidad del conductor.
- Mostrar presencia referencial de conductores cercanos.
- No se usa para seguimiento dinámico del vehículo.

### rideRequests

Solicitudes de viaje emitidas por pasajeros antes de ser aceptadas.

```json
{
  "id": "rr-001",
  "passengerId": "u-001",
  "origin": "Av. La Marina 2000",
  "destination": "Plaza San Miguel",
  "distanceKm": 2.5,
  "status": "PENDING",
  "estimatedFare": 7.0,
  "isExpired": false
}
```

**Uso principal en Sprint 2:**
- Registrar una nueva solicitud de viaje.
- Consultar solicitudes pendientes para el conductor.
- Permitir que el pasajero haga refresh manual y verifique si su solicitud sigue pendiente.
- Servir como base del flujo principal del Sprint 2.

### rides

Viajes aceptados por un conductor.

```json
{
  "id": "r-001",
  "passengerId": "u-001",
  "driverId": "d-001",
  "origin": "Av. La Marina 2000",
  "destination": "Plaza San Miguel",
  "status": "ACCEPTED",
  "estimatedFare": 7.0
}
```

**Uso principal en Sprint 2:**
- Registrar que un conductor aceptó una solicitud.
- Permitir que el pasajero, mediante refresh manual, vea que ya tiene conductor asignado.
- Representar el cambio de estado posterior a la aceptación.

### wallets

Monederos de los conductores.

```json
{
  "id": "w-001",
  "driverId": "d-001",
  "balance": 25.50,
  "status": "ACTIVE"
}
```

**Uso principal en Sprint 2:**
- Consultar el saldo disponible del conductor.
- Validar si el conductor puede activarse o no.
- No se implementará aún el flujo completo de recarga o descuento automático de comisión.

### fareConfig

Configuración global de la tarifa del sistema.

```json
{
  "id": 1,
  "baseFare": 2.5,
  "pricePerKm": 1.2,
  "minimumFare": 4.0
}
```

**Uso principal en Sprint 2:**
- Calcular la tarifa estimada del viaje en el frontend.
- Mostrar el resumen tarifario antes de confirmar la solicitud.

### ratings

Calificaciones emitidas sobre viajes.

```json
{
  "id": "rt-001",
  "rideId": "r-001",
  "rating": 5,
  "comment": "Excelente servicio"
}
```

**Uso en Sprint 2:**
- Soporte secundario / placeholder.
- No forma parte del flujo principal de la demo.
- Solo puede usarse para mostrar reputación mock si se necesita contexto visual.

---

## Endpoint map

### IAM

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/users?email={email}&password={password}` | Autenticación del usuario. |
| `GET` | `/profiles?accountId={accountId}` | Obtención de datos básicos del usuario autenticado. |

> [!NOTE]
> En este sprint, `profiles` no se usa para una gestión completa de perfil, sino como soporte de identidad básica (nombre, email, foto).

### Ride Dispatch

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/rideRequests` | Crear una nueva solicitud de viaje del pasajero. |
| `GET` | `/rideRequests?status=PENDING` | Obtener solicitudes pendientes visibles para conductores. |
| `GET` | `/rideRequests?passengerId={passengerId}` | Consultar las solicitudes del pasajero para actualizar el estado mediante refresh manual. |
| `PATCH` | `/rideRequests/{id}` | Actualizar el estado de una solicitud si el flujo lo requiere. |
| `POST` | `/rides` | Registrar un viaje aceptado por un conductor. |
| `GET` | `/rides?passengerId={passengerId}` | Consultar si el pasajero ya tiene un viaje aceptado/asignado después del refresh manual. |
| `GET` | `/driverAvailability?isAvailable=true` | Consultar conductores disponibles para visualización referencial. |
| `GET` | `/driverAvailability?driverId={id}` | Consultar el estado de disponibilidad de un conductor específico. |
| `PATCH` | `/driverAvailability/{id}` | Alternar la disponibilidad del conductor. |

> [!IMPORTANT]
> La actualización del estado de la solicitud y de la asignación del conductor se hará mediante refresh manual desde la UI.

### Monetization

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/fareConfig` | Obtener configuración tarifaria actual para calcular la cotización en el frontend. |
| `GET` | `/wallets?driverId={driverId}` | Consultar el saldo del conductor. |
| `PATCH` | `/wallets/{id}` | Actualizar el wallet si en una fase posterior se requiere. No forma parte del flujo principal del Sprint 2. |

### Driver Management

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/drivers?accountId={accountId}` | Consultar el perfil ampliado del conductor y su estado operativo/documental. |

> [!NOTE]
> En este sprint no se implementará flujo interactivo de revisión documental; solo se consumen estos datos como soporte.

### Trust & Reputation

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/ratings?rideId={rideId}` | Consultar si un viaje tiene una calificación registrada. |
| `POST` | `/ratings` | Registrar una calificación. |

> [!NOTE]
> En el Sprint 2 este bounded context no es parte del flujo principal. Su uso es opcional y secundario.
