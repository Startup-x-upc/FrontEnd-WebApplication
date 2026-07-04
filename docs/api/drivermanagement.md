# Driver Management

**6 endpoints**  
**Base URL:** `/api/v1`

---

## Flujo típico

### Flujo: Administrador gestiona conductores

```
1. GET /drivers                        → listar todos los conductores (paginado 1-based)
2. GET /drivers/{id}                   → ver detalle de un conductor
3. POST /drivers/{id}/restrict         → restringir a un conductor (requiere motivo)
4. POST /drivers/{id}/unrestrict       → levantar restricción
```

---

## Endpoints

### `POST /api/v1/drivers/{id}/toggle-availability`

**Summary:** Alternar disponibilidad del conductor (ON ↔ OFF).

**Roles:** Dueño del registro de conductor | `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
El conductor activa o desactiva su disponibilidad para recibir solicitudes de ride. Si está OFF, no aparece como candidato ni recibe eventos de `ride-request:open`.

**Precondiciones:**
- El conductor debe existir (`Driver` registrado).
- El usuario autenticado debe ser el dueño del registro de conductor o admin.

**Efectos:**
- Cambia el estado `isAvailable` del `DriverAvailability`.
- Si estaba ON → OFF: deja de recibir solicitudes.
- Si estaba OFF → ON: vuelve a estar disponible.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres el dueño del conductor ni admin |
| 404 | `DRIVER_NOT_FOUND` | El driver con ese ID no existe |

**Schema:** Swagger UI → Driver Management → `POST /drivers/{id}/toggle-availability`

---

### `POST /api/v1/drivers/{id}/restrict`

**Summary:** Restringir a un conductor (ADMIN only).

**Roles:** `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
Un administrador restringe a un conductor, impidiéndole aplicar a solicitudes de ride. Requiere un motivo documentado.

**Precondiciones:**
- Usuario autenticado como admin.
- El conductor debe existir.

**Efectos:**
- Cambia el `DriverAccessStatus` a `RESTRICTED`.
- El conductor no podrá aplicar a ride requests (`POST /rides/requests/{id}/candidates` devolverá 422 `DRIVER_NOT_AVAILABLE`).

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres admin |
| 404 | `DRIVER_NOT_FOUND` | El driver no existe |

**Schema:** Swagger UI → Driver Management → `POST /drivers/{id}/restrict`

---

### `POST /api/v1/drivers/{id}/unrestrict`

**Summary:** Levantar la restricción de un conductor (ADMIN only).

**Roles:** `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
El admin reactiva a un conductor previamente restringido.

**Precondiciones:**
- Usuario autenticado como admin.
- El conductor debe existir.

**Efectos:**
- Cambia el `DriverAccessStatus` a `ACTIVE`.
- El conductor vuelve a poder aplicar a ride requests.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres admin |
| 404 | `DRIVER_NOT_FOUND` | El driver no existe |

**Schema:** Swagger UI → Driver Management → `POST /drivers/{id}/unrestrict`

---

### `GET /api/v1/drivers`

**Summary:** Listar todos los conductores (ADMIN only).

**Roles:** `ROLE_ADMIN`

**Pagination:** **1-based** — `page` (default=1), `perPage` (default=20)

---

**Propósito de negocio:**
Panel de administración para ver y filtrar conductores por `accessStatus` (`ACTIVE`, `RESTRICTED`, etc.).

**Precondiciones:**
- Usuario autenticado como admin.

**Efectos:**
- Retorna lista paginada de `DriverResponse` con metadata de paginación.

**Query params:**

| Param | Default | Descripción |
|-------|---------|-------------|
| `accessStatus` | (todos) | Filtrar por `ACTIVE`, `RESTRICTED`, etc. |
| `page` | 1 | Página (1-based) |
| `perPage` | 20 | Resultados por página |

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres admin |
| 400 | `INVALID_ACCESS_STATUS` | Valor inválido para `accessStatus` |

**Schema:** Swagger UI → Driver Management → `GET /drivers`

---

### `GET /api/v1/drivers/{id}`

**Summary:** Obtener conductor por ID.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
Consultar el detalle de un conductor específico.

**Precondiciones:**
- El conductor debe existir.

**Efectos:**
- Retorna `DriverResponse` con todos los datos del conductor.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 404 | `DRIVER_NOT_FOUND` | El driver no existe |

**Schema:** Swagger UI → Driver Management → `GET /drivers/{id}`

---

### `GET /api/v1/users/{userId}/driver`

**Summary:** Obtener el registro de conductor asociado a un usuario.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
Obtener el `Driver` a partir del `userId` (no del `driverId`). Útil cuando el frontend solo tiene el userId del JWT y necesita el driverId para otros endpoints.

**Precondiciones:**
- El userId debe tener un registro de conductor asociado.

**Efectos:**
- Retorna `DriverResponse`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 404 | `DRIVER_NOT_FOUND` | No hay conductor para ese userId |

**Schema:** Swagger UI → Driver Management → `GET /users/{userId}/driver`
