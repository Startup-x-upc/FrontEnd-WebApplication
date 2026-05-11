# Fake API Contracts

Este documento define la estructura de datos que devuelve `json-server` (la Fake API) basada en `server/db.json`. Estos contratos son los que la UI debe esperar y consumir a través de la capa de infraestructura estabilizada en el Sprint 2.

## Collections

### users
Almacena las credenciales de acceso y el rol base.
```json
{
  "id": "u-001",
  "email": "pasajero@correo.com",
  "password": "pass123",
  "role": "PASSENGER"
}
```

### profiles
Almacena la información de visualización pública enlazada a una cuenta.
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
Extensión de perfil específica para conductores, con datos operativos y de reputación incrustados (Read Model).
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

### driverAvailability
Almacena la posición y la disponibilidad ("Conectado/Desconectado") del conductor en tiempo real.
```json
{
  "id": "da-001",
  "driverId": "d-001",
  "currentLocation": "-12.083, -77.031",
  "isAvailable": true
}
```

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

### rides
Viajes aceptados y en curso o completados.
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

### wallets
Monederos de los conductores para pago de comisiones o depósitos.
```json
{
  "id": "w-001",
  "driverId": "d-001",
  "balance": 25.50,
  "status": "ACTIVE"
}
```

### fareConfig
Configuración global de las tarifas del sistema. Note que el `id` aquí es un número.
```json
{
  "id": 1,
  "baseFare": 2.5,
  "pricePerKm": 1.2,
  "minimumFare": 4.0
}
```

### ratings
Calificaciones emitidas sobre los viajes.
```json
{
  "id": "rt-001",
  "rideId": "r-001",
  "rating": 5,
  "comment": "Excelente servicio"
}
```

---

## Endpoint map

### IAM
- `GET /users?email={email}&password={password}` -> Autenticación.
- `GET /profiles?accountId={accountId}` -> Obtener datos del perfil.

### Ride Dispatch
- `GET /rideRequests?status=PENDING` -> Obtener lista de solicitudes para los conductores.
- `GET /rides/{id}` -> Ver estado de viaje actual.
- `POST /rideRequests` -> Crear nueva solicitud de viaje (Pasajero).
- `POST /rides` -> Aceptar un viaje (Conductor).
- `GET /driverAvailability?driverId={id}` -> Estado GPS de conexión.
- `PATCH /driverAvailability/{id}` -> Alternar conexión.

### Monetization
- `GET /fareConfig` -> Calcular cotización en el lado cliente.
- `GET /wallets?driverId={driverId}` -> Ver saldo.
- `PATCH /wallets/{id}` -> Descontar comisión por viaje.

### Driver Management
- `GET /drivers?accountId={accountId}` -> Perfil ampliado y estado de verificación del conductor.

### Trust & Reputation
- `GET /ratings?rideId={rideId}` -> Leer si el viaje ya fue calificado.
- `POST /ratings` -> Guardar nueva calificación.

---

## Known issues & Inconsistencies
1. **Naming Convencional**: La DB usa `rideId` en `ratings`, pero la UI y algunos modelos de dominio lo trataron inicialmente como `tripId`. El assembler de Rating maneja este desfase (`entity.tripId = response.rideId`).
2. **Geolocalización plana**: `driverAvailability` usa un solo string `currentLocation` (`"lat, lng"`) en vez de dos propiedades numéricas separadas en DB. El assembler se encarga de partirlo.
3. **Identificador de Configuración**: `fareConfig` tiene `id: 1` (número), a diferencia del resto de la DB que migró a strings (e.g. `w-001`). `json-server` lo acepta, pero se debe tener cuidado si se mapea estrictamente a `string` a nivel de DTO.
4. **Relación Drivers y Usuarios**: La entidad `Driver` asocia un `accountId` directamente a `users`, saltando `profiles`. Los nombres públicos como `fullName` están duplicados dentro del registro `drivers` en la DB a manera de caché.
