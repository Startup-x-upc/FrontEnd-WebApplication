# ChapaTuRuta API — Documentación para Frontend

**Versión:** 1.0.0  
**Base URL:** `http://localhost:8080/api/v1`

---

## Quick Links

| Recurso | Ubicación |
|---------|-----------|
| Swagger UI (live, requiere backend corriendo) | `http://localhost:8080/swagger-ui.html` |
| OpenAPI JSON (snapshot offline) | [`openapi.json`](./openapi.json) |
| OpenAPI JSON (live) | `http://localhost:8080/v3/api-docs` |
| Eventos en tiempo real (Ably) | [`realtime.md`](./realtime.md) |

---

## Estructura de la documentación

| Contexto | Archivo | Endpoints |
|----------|---------|-----------|
| IAM (Auth + Profiles) | [`iam.md`](./iam.md) | 7 |
| Driver Management | [`drivermanagement.md`](./drivermanagement.md) | 6 |
| Ride Dispatch | [`ridedispatch.md`](./ridedispatch.md) | 14 |
| Monetization | [`monetization.md`](./monetization.md) | 9 |
| Trust & Reputation | [`trustreputation.md`](./trustreputation.md) | 7 |
| Realtime (Ably) | [`realtime.md`](./realtime.md) | 8 eventos |

**Total: 43 endpoints HTTP + 8 eventos Ably**

---

## Autenticación

### Tipo
**Bearer JWT** — header `Authorization: Bearer <access_token>`

### Endpoints públicos (no requieren token)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/register/passenger` | Registrar pasajero |
| `POST` | `/auth/register/driver` | Registrar conductor |
| `POST` | `/auth/login` | Iniciar sesión |
| `POST` | `/auth/refresh` | Refrescar token expirado |

**Todo lo demás requiere autenticación.**

### Flujo de tokens

1. `POST /auth/login` → `{ accessToken, refreshToken }`
2. Usar `accessToken` en llamadas subsecuentes.
3. Al recibir **401**, llamar `POST /auth/refresh` → `{ accessToken, refreshToken }` (nuevo par).
4. Si el refresh también falla con 401, redirigir al login.

### Roles

| Rol | Significado |
|-----|-------------|
| `ROLE_PASSENGER` | Usuario pasajero |
| `ROLE_DRIVER` | Usuario conductor |
| `ROLE_ADMIN` | Administrador del sistema |

---

## Formato de error

Todas las respuestas de error siguen esta estructura:

```json
{
  "code": "DRIVER_NOT_FOUND",
  "message": "Driver not found",
  "details": null
}
```

| Campo | Descripción |
|-------|-------------|
| `code` | Código de error legible por máquina (usar para lógica condicional) |
| `message` | Mensaje legible por humano (mostrar en UI) |
| `details` | Información adicional (nullable, omitido cuando es null) |

### Códigos HTTP y su significado

| HTTP | Cuándo ocurre |
|------|---------------|
| **400** | Request body inválido (validación), parámetros malformados |
| **401** | Token ausente, expirado o inválido → refrescar token o re-login |
| **403** | Rol insuficiente o no eres dueño/participante del recurso |
| **404** | Entidad no encontrada (recurso, driver, ride, request, perfil, wallet) |
| **409** | Conflicto de estado (conductor restringido, saldo insuficiente) |
| **422** | Violación de regla de negocio (transición de estado inválida, conductor ya ocupado) |
| **500** | Error interno inesperado |

### Mapeo detallado error code → HTTP

| Error Code | HTTP |
|-----------|------|
| `VALIDATION_ERROR` | 400 |
| `UNAUTHORIZED`, `INVALID_REFRESH_TOKEN` | 401 |
| `FORBIDDEN` | 403 |
| `*_NOT_FOUND` (ej. `DRIVER_NOT_FOUND`, `RIDE_NOT_FOUND`) | 404 |
| `*_CONFLICT`, `DRIVER_RESTRICTED`, `INSUFFICIENT_BALANCE` | 409 |
| `BUSINESS_RULE_VIOLATION`, `ALREADY_BUSY`, `ALREADY_APPLIED`, `ALREADY_HAS_OPEN_REQUEST`, `REQUEST_EXPIRED`, `REQUEST_NOT_OPEN`, `DRIVER_NOT_AVAILABLE`, `INVALID_TRANSITION`, `CANNOT_CANCEL` | 422 |
| `UNEXPECTED_ERROR` | 500 |

---

## ⚠️ Inconsistencia de paginación

Los endpoints paginados **no usan el mismo convenio**. Presta atención al consumirlos:

| Endpoint | Base | Parámetros |
|----------|------|-----------|
| `GET /drivers` | **1-based** | `page` (default=1), `perPage` (default=20) |
| `GET /passengers/{id}/trips` | **0-based** | `page` (default=0), `perPage` (default=20) |
| `GET /drivers/{id}/trips` | **0-based** | `page` (default=0), `perPage` (default=20) |
| `GET /monetization/wallets/{id}/transactions` | **0-based** | `page` (default=0), `size` (default=10) |

> **Regla práctica:** `GET /drivers` es el único 1-based. Todos los demás son 0-based.  
> **Nota:** `GET /drivers` usa `perPage`; los de wallet usan `size` en vez de `perPage`.

### Formato de respuesta paginada

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "size": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

Los nombres exactos de los campos `meta` y el wrapper varían por endpoint. Consultar el schema en Swagger para cada uno.

---

## ⚠️ CORS

La configuración actual permite **cualquier origen** (`Access-Control-Allow-Origin: *`).

> **Esto es para desarrollo.** Antes de producción, restringir `allowedOrigins` al dominio del frontend.

---

## Cómo generar el cliente TypeScript

### Opción A: openapi-generator-cli

```bash
npx @openapitools/openapi-generator-cli generate \
  -i docs/api/openapi.json \
  -g typescript-angular \
  -o src/app/api/generated \
  --additional-properties=ngVersion=18.0.0
```

Para usar la versión live (requiere backend corriendo):
```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:8080/v3/api-docs \
  -g typescript-angular \
  -o src/app/api/generated
```

### Opción B: orval

```bash
npx orval --input docs/api/openapi.json --output src/app/api
```

### Nota importante

El cliente generado cubre la **forma** de los contratos (rutas, DTOs, códigos HTTP). La **semántica** de negocio (flujos, precondiciones, efectos, reglas de dominio, eventos Ably) está en estos markdowns. Úsalos juntos:

- **Swagger / openapi.json** → tipado TypeScript, servicios Angular.
- **Estos markdowns** → entender cuándo y por qué llamar cada endpoint, qué esperar en Ably.

---

## Índice de contextos

| Archivo | ¿Qué contiene? |
|---------|---------------|
| [`iam.md`](./iam.md) | Registro, login, refresh token, perfil |
| [`drivermanagement.md`](./drivermanagement.md) | Gestión de conductores (admin + toggle disponibilidad) |
| [`ridedispatch.md`](./ridedispatch.md) | Ciclo completo del ride: request → candidatos → asignación → avance → cancelación |
| [`monetization.md`](./monetization.md) | Tarifas, wallets, recargas, comisiones |
| [`trustreputation.md`](./trustreputation.md) | Ratings post-ride, reputación |
| [`realtime.md`](./realtime.md) | Canales Ably, eventos, payloads, triggers, flujos de suscripción |
