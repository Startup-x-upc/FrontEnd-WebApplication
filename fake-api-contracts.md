# Fake API Contracts (Reorientado a Candidatos - inDrive Style)

Este documento define la estructura de datos que devuelve `json-server` (la Fake API) basada en `server/db.json`. Define el modelo competitivo de candidatos implementado en el Sprint 2.

> [!IMPORTANT]
> El flujo se sincroniza mediante **refresh manual** en ambos extremos (pasajero y conductor).
> No se usa real-time real, WebSockets, polling automático ni tracking dinámico.
> La navegación para el conductor se realiza mediante redirecciones a **Google Maps externo**.

---

## Collections

### users
Almacena las credenciales de acceso y el rol del usuario.

```json
{
  "id": "u-001",
  "email": "pasajero@correo.com",
  "password": "pass123",
  "role": "PASSENGER"
}
```

### profiles
Soporte de identidad básica enlazada a una cuenta de usuario.

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
Perfil ampliado del conductor con información operativa y de reputación.

```json
{
  "id": "d-001",
  "accountId": "u-002",
  "fullName": "Carlos Mendoza",
  "vehicleType": "Mototaxi",
  "verificationStatus": "APPROVED",
  "operationalStatus": "ENABLED",
  "ratingAverage": 4.8,
  "ratingCount": 120,
  "photoUrl": "https://i.pravatar.cc/150?img=33"
}
```

### driverAvailability
Almacena la disponibilidad, ubicación y estado de ocupación del conductor.

```json
{
  "id": "da-001",
  "driverId": "d-001",
  "currentLocation": "-9.47100,-78.29900",
  "isAvailable": true,
  "isBusy": false,
  "activeRideId": null
}
```

- `isBusy`: Evita que un conductor con un viaje activo vea nuevas solicitudes abiertas.
- `activeRideId`: Enlace al viaje activo actual para restaurar el estado de la UI del conductor tras recargar.

### rideRequests
Solicitudes de viaje emitidas por pasajeros. Cambia su modelo de asignación directa por uno de selección de candidatos.

```json
{
  "id": "rr-001",
  "passengerId": "u-001",
  "origin": "-9.46538,-78.32101",
  "destination": "-9.47305,-78.30578",
  "distanceKm": 2,
  "status": "OPEN",
  "estimatedFare": 4.9,
  "selectedDriverId": null,
  "isExpired": false
}
```

**Estados soportados (`status`):**
- `OPEN`: Visible para que los conductores disponibles se postulen.
- `CONFIRMED`: El pasajero eligió un candidato de la lista y se ha generado el viaje.

### rideCandidates (NUEVA)
Colección que registra la postulación de los conductores a solicitudes de viaje abiertas.

```json
{
  "id": "rc-001",
  "requestId": "rr-001",
  "driverId": "d-001",
  "driverName": "Carlos Mendoza",
  "vehicleType": "Mototaxi",
  "ratingAverage": 4.8,
  "photoUrl": "https://i.pravatar.cc/150?img=33",
  "status": "PROPOSED",
  "appliedAt": "2026-05-12T23:30:00Z"
}
```

**Estados soportados (`status`):**
- `PROPOSED`: Candidatura enviada por el conductor, a la espera de que el pasajero decida.
- `ACCEPTED`: Candidato seleccionado por el pasajero para realizar el viaje.
- `REJECTED`: Candidatura descartada (el pasajero eligió a otro conductor).

### rides
Viajes formalizados tras la confirmación de un candidato por parte del pasajero.

```json
{
  "id": "r-001",
  "requestId": "rr-001",
  "passengerId": "u-001",
  "driverId": "d-001",
  "origin": "-9.46538,-78.32101",
  "destination": "-9.47305,-78.30578",
  "estimatedFare": 4.9,
  "status": "ACCEPTED"
}
```

**Estados de progreso del viaje (`status`):**
- `ACCEPTED`: Ride creado tras la selección del candidato.
- `DRIVER_ON_THE_WAY`: Conductor se dirige al origen.
- `DRIVER_ARRIVED`: Conductor se encuentra en el origen esperando al pasajero.
- `STARTED`: Viaje iniciado en curso.
- `COMPLETED`: Viaje finalizado exitosamente.

### wallets
Monederos de los conductores. Se consulta el saldo para autorizar la activación operativa.

```json
{
  "id": "w-001",
  "driverId": "d-001",
  "balance": 25.50,
  "status": "ACTIVE"
}
```

---

## Endpoint Map

### Ride Dispatch (Flujo Competitivo)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/rideRequests` | Crea una nueva solicitud con estado `OPEN`. |
| `GET` | `/rideRequests?status=OPEN` | Recupera las solicitudes visibles para los conductores no ocupados. |
| `PATCH` | `/rideRequests/{id}` | Actualiza el estado de la solicitud (p. ej. a `CONFIRMED`). |
| `GET` | `/rideCandidates?requestId={id}` | Recupera las postulaciones de conductores para una solicitud específica. |
| `POST` | `/rideCandidates` | Registra la postulación de un conductor a una solicitud (`PROPOSED`). |
| `PATCH` | `/rideCandidates/{id}` | Cambia el estado de la candidatura a `ACCEPTED` o `REJECTED`. |
| `POST` | `/rides` | Crea formalmente el viaje asignado. |
| `PATCH` | `/rides/{id}` | Actualiza el estado progresivo del viaje en curso. |
| `GET` | `/driverAvailability?driverId={id}` | Consulta y recupera la disponibilidad y estado `isBusy` del conductor. |
| `PATCH` | `/driverAvailability/{id}` | Gestiona el cambio de disponibilidad (`isAvailable`) o de ocupación (`isBusy`, `activeRideId`). |
