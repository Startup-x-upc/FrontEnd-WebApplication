# 01 — IAM Bounded Context (Identity & Access Management)

> **Dependencias:** Ninguna. Este es el contexto fundacional.
> **Agregado raíz:** User
> **Entidades satélite:** Profile

---

## 1. Entities & Value Objects

### 1.1 User (Aggregate Root)

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK |
| `email` | `string` | ✅ | Único. Login. Máx 255 chars, formato email válido |
| `passwordHash` | `string` | ✅ | bcrypt hash (12 rounds). NUNCA se devuelve en responses |
| `role` | `UserRole` | ✅ | `'PASSENGER' \| 'DRIVER' \| 'ADMIN'` |
| `createdAt` | `ISO 8601` | auto | |
| `updatedAt` | `ISO 8601` | auto | |

**UserRole**: `'PASSENGER' | 'DRIVER' | 'ADMIN'`

### 1.2 Profile

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK |
| `userId` | `UUID` | ✅ | FK → User.id, unique (1:1) |
| `fullName` | `string` | ✅ | Máx 100 chars |
| `photoUrl` | `string` | No | URL válida o empty |
| `createdAt` | `ISO 8601` | auto | |
| `updatedAt` | `ISO 8601` | auto | |

> **Nota de diseño:** `email` NO está en Profile. El email pertenece a User. Cuando el frontend necesita mostrar email en perfil, el backend lo incluye en el read model del endpoint de perfil.

---

## 2. Business Rules & Invariants

| # | Regla |
|---|---|
| BR1 | Email debe ser único en el sistema |
| BR2 | Password debe tener mínimo 6 caracteres |
| BR3 | No se puede cambiar el `role` de un User después de creado |
| BR4 | Un User no puede ser eliminado si tiene rides activos |
| BR5 | Al registrar un PASSENGER, se crea User + Profile en la misma transacción |
| BR6 | Al registrar un DRIVER, se crea User + Driver (ver 02-driver-management) + Wallet (ver 04-monetization) en la misma transacción |
| BR7 | El password nunca se devuelve en ninguna response de API |
| BR8 | La sesión expira según TTL del JWT (access token: 15 min, refresh token: 7 días) |

---

## 3. State Machine

```
User lifecycle:
  [Registro] → ACTIVE
  ACTIVE → (nunca se elimina, solo se podría soft-delete en el futuro)
```

---

## 4. Commands

### 4.1 Register Passenger

```
POST /auth/register/passenger
Auth: None (público)
```

**Request Body:**
```json
{
  "email": "pasajero@correo.com",
  "password": "pass123",
  "fullName": "María Quispe"
}
```

**Validaciones:**
- `email`: requerido, formato email, único
- `password`: requerido, mínimo 6 caracteres
- `fullName`: requerido, mínimo 2 caracteres, máximo 100

**Response 201:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "pasajero@correo.com",
    "role": "PASSENGER",
    "createdAt": "2026-06-15T21:00:00.000Z"
  },
  "profile": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "María Quispe",
    "photoUrl": "",
    "createdAt": "2026-06-15T21:00:00.000Z"
  },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "dGhpcyBpcyBh..."
}
```

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 409 | `EMAIL_EXISTS` | El correo ya está registrado |
| 422 | `VALIDATION_ERROR` | Datos inválidos (detalle en body.errors[]) |
| 500 | `INTERNAL_ERROR` | Error del servidor |

---

### 4.2 Register Driver

```
POST /auth/register/driver
Auth: None (público)
```

**Request Body:**
```json
{
  "email": "conductor@correo.com",
  "password": "pass123",
  "fullName": "Carlos Mendoza",
  "vehicleType": "Mototaxi",
  "licenseNumber": "Q12345678",
  "soatNumber": "S987654321"
}
```

**Validaciones:**
- `email`: requerido, formato email, único
- `password`: requerido, mínimo 6 caracteres
- `fullName`: requerido, mínimo 2 caracteres, máximo 100
- `vehicleType`: requerido, mínimo 2 caracteres
- `licenseNumber`: requerido
- `soatNumber`: requerido

**Response 201:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "conductor@correo.com",
    "role": "DRIVER",
    "createdAt": "2026-06-15T21:00:00.000Z"
  },
  "driver": {
    "id": "770e8400-e29b-41d4-a716-446655440003",
    "userId": "550e8400-e29b-41d4-a716-446655440002",
    "fullName": "Carlos Mendoza",
    "vehicleType": "Mototaxi",
    "accessStatus": "ACTIVE",
    "isAvailable": false,
    "ratingAverage": 0,
    "ratingCount": 0,
    "photoUrl": "",
    "licenseNumber": "Q12345678",
    "soatNumber": "S987654321",
    "createdAt": "2026-06-15T21:00:00.000Z"
  },
  "wallet": {
    "id": "880e8400-e29b-41d4-a716-446655440004",
    "driverId": "770e8400-e29b-41d4-a716-446655440003",
    "balance": 0,
    "status": "ACTIVE"
  },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "dGhpcyBpcyBh..."
}
```

**Errores:** Mismos que Register Passenger.

---

### 4.3 Login

```
POST /auth/login
Auth: None (público)
```

**Request Body:**
```json
{
  "email": "conductor@correo.com",
  "password": "pass123"
}
```

**Response 200:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "conductor@correo.com",
    "role": "DRIVER"
  },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "dGhpcyBpcyBh..."
}
```

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 401 | `INVALID_CREDENTIALS` | Email o contraseña incorrectos |
| 429 | `RATE_LIMITED` | Demasiados intentos. Espera X segundos |
| 500 | `INTERNAL_ERROR` | Error del servidor |

> **Nota para el frontend:** Actualmente el mock hace `GET /users?email=X` y compara password en cliente. Esto DEBE migrar a POST /auth/login con bcrypt server-side. El interceptor `auth.interceptor.ts` ya está preparado para adjuntar el token.

---

### 4.4 Refresh Token

```
POST /auth/refresh
Auth: None (público)
```

**Request Body:**
```json
{
  "refreshToken": "dGhpcyBpcyBh..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "nUEvbyB0b2tlbi4u..."
}
```

---

### 4.5 Update Profile

```
PUT /profiles/:id
Auth: Bearer token (cualquier rol)
```

**Request Body:**
```json
{
  "fullName": "María Quispe Actualizado",
  "photoUrl": "https://i.pravatar.cc/150?img=47"
}
```

**Validaciones:**
- Solo el dueño del perfil o ADMIN puede modificar
- `fullName`: mínimo 2 caracteres, máximo 100

**Response 200:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "fullName": "María Quispe Actualizado",
  "photoUrl": "https://i.pravatar.cc/150?img=47",
  "createdAt": "2026-06-15T21:00:00.000Z",
  "updatedAt": "2026-06-15T22:00:00.000Z"
}
```

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 401 | `UNAUTHORIZED` | Token inválido o expirado |
| 403 | `FORBIDDEN` | No eres el dueño del perfil |
| 404 | `NOT_FOUND` | Perfil no encontrado |
| 422 | `VALIDATION_ERROR` | Datos inválidos |

---

## 5. Queries

### 5.1 Get My Profile

```
GET /users/me/profile
Auth: Bearer token (cualquier rol)
```

**Response 200:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "pasajero@correo.com",
  "fullName": "María Quispe",
  "role": "PASSENGER",
  "photoUrl": "https://i.pravatar.cc/150?img=47",
  "createdAt": "2026-06-15T21:00:00.000Z"
}
```

> El `email` y `role` vienen del User y se incluyen en el read model del perfil para que el frontend no tenga que hacer 2 llamadas.

### 5.2 Get Current User (validar sesión)

```
GET /auth/me
Auth: Bearer token (cualquier rol)
```

**Response 200:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "pasajero@correo.com",
  "role": "PASSENGER",
  "createdAt": "2026-06-15T21:00:00.000Z"
}
```

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 401 | `UNAUTHORIZED` | Token inválido o expirado |

> **Nota para el frontend:** Este endpoint reemplaza la lógica actual de `rehydrateSession()` que lee de localStorage. Al iniciar la app, el frontend llama a `GET /auth/me` con el token guardado. Si devuelve 401, redirige a login.

### 5.3 Check Email Exists

```
GET /auth/check-email?email=pasajero@correo.com
Auth: None (público)
```

**Response 200:**
```json
{
  "exists": true
}
```

---

## 6. Authentication & Authorization

### 6.1 JWT Strategy

- **Access Token**: JWT firmado con HS256, 15 minutos TTL
- **Refresh Token**: opaque token almacenado en DB, 7 días TTL
- El frontend envía `Authorization: Bearer <accessToken>` en cada request autenticado
- Cuando el access token expira, el frontend llama a `POST /auth/refresh` con el refresh token
- El refresh token rota en cada uso (se emite uno nuevo y se invalida el anterior)

### 6.2 Role-Based Access

| Endpoint | PASSENGER | DRIVER | ADMIN |
|---|---|---|---|
| `PUT /profiles/:id` | ✅ (propio) | ✅ (propio) | ✅ |
| `GET /users/me/profile` | ✅ | ✅ | ✅ |
| `GET /auth/me` | ✅ | ✅ | ✅ |

### 6.3 HTTP Interceptors (ya preparados en frontend)

- `auth.interceptor.ts`: lee el token y lo adjunta como `Authorization: Bearer <token>`
- `error.interceptor.ts`: captura 401 → limpia sesión y redirige a /login

---

## 7. Integration Events

Este contexto emite estos eventos cuando ocurren acciones significativas:

| Evento | Trigger | Consumidores |
|---|---|---|
| `UserRegistered` | Register Passenger/Driver exitoso | Ninguno actualmente |
| `DriverRegistered` | Register Driver exitoso | Driver Management (crear Driver), Monetization (crear Wallet) |
| `ProfileUpdated` | Update Profile exitoso | Driver Management (si es driver, actualizar fullName/photoUrl en Driver) |

> Si la arquitectura es modular monolito (mismo runtime), estos eventos pueden ser llamadas directas entre servicios en lugar de mensajería. Si es microservicios, usar RabbitMQ/Kafka.
