# IAM — Identity & Access Management

**7 endpoints:** Auth (5) + Profiles (2)  
**Base URL:** `/api/v1`

---

## Flujos típicos

### Flujo 1: Registro y login

```
1. POST /auth/register/passenger   → registrar pasajero (o /register/driver)
   Response: { user, profile, accessToken, refreshToken }
2. Guardar accessToken → usar en todas las llamadas subsecuentes
3. Guardar refreshToken → usar cuando el accessToken expire
```

### Flujo 2: Refresh de token

```
1. Al recibir 401 en cualquier endpoint:
2. POST /auth/refresh  { refreshToken }
   Response: { accessToken, refreshToken }  (nuevo par, el viejo se invalida)
3. Reintentar la llamada original con el nuevo accessToken
4. Si /auth/refresh también devuelve 401 → redirigir al login
```

---

## Endpoints

### `POST /api/v1/auth/register/passenger`

**Summary:** Registrar un nuevo pasajero.

**Roles:** Público (sin autenticación)

**Pagination:** N/A

---

**Propósito de negocio:**
Crear una cuenta de tipo `PASSENGER`. Devuelve el usuario, su perfil, y un par de tokens JWT para autenticación inmediata (no requiere login posterior).

**Precondiciones:**
- Email no registrado previamente en el sistema.

**Efectos:**
- Crea un `User` con rol `ROLE_PASSENGER`.
- Crea un `Profile` asociado con `fullName`.
- Genera y devuelve `accessToken` + `refreshToken`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | Request body inválido (email mal formado, campos requeridos faltantes) |

**Schema:** Swagger UI → Auth → `POST /auth/register/passenger`

---

### `POST /api/v1/auth/register/driver`

**Summary:** Registrar un nuevo conductor.

**Roles:** Público (sin autenticación)

**Pagination:** N/A

---

**Propósito de negocio:**
Crear una cuenta de tipo `DRIVER` con datos adicionales del vehículo. A diferencia del pasajero, emite un `DriverRegisteredEvent` que inicializa el registro en el bounded context de Driver Management.

**Precondiciones:**
- Email no registrado previamente.

**Efectos:**
- Crea un `User` con rol `ROLE_DRIVER`.
- Crea un `Profile` asociado.
- Emite `DriverRegisteredEvent` → se crea el registro `Driver` en Driver Management.
- Genera y devuelve `accessToken` + `refreshToken`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | Request body inválido o campos del vehículo faltantes |

**Schema:** Swagger UI → Auth → `POST /auth/register/driver`

---

### `POST /api/v1/auth/login`

**Summary:** Iniciar sesión con email y contraseña.

**Roles:** Público (sin autenticación)

**Pagination:** N/A

---

**Propósito de negocio:**
Validar credenciales y emitir un par de tokens JWT.

**Precondiciones:**
- Usuario registrado previamente (passenger o driver).

**Efectos:**
- Genera y devuelve `accessToken` + `refreshToken`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | Credenciales inválidas o cuenta no encontrada |

**Schema:** Swagger UI → Auth → `POST /auth/login`

---

### `POST /api/v1/auth/refresh`

**Summary:** Refrescar un access token expirado.

**Roles:** Público (sin autenticación — se autentica con el refresh token)

**Pagination:** N/A

---

**Propósito de negocio:**
Rotar el refresh token y emitir un nuevo par access/refresh. El refresh token anterior se invalida.

**Precondiciones:**
- Refresh token válido y no expirado.

**Efectos:**
- Invalida el refresh token anterior.
- Emite nuevo `accessToken` + `refreshToken`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `INVALID_REFRESH_TOKEN` | Token expirado, mal formado, o ya fue rotado |

**Schema:** Swagger UI → Auth → `POST /auth/refresh`

---

### `GET /api/v1/auth/me`

**Summary:** Obtener el usuario autenticado actual.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
Obtener los datos del usuario a partir del JWT. Útil al iniciar la app para validar que el token sigue vigente y obtener el perfil.

**Precondiciones:**
- Token JWT válido en el header `Authorization`.

**Efectos:**
- Retorna el `UserResource` (id, email, role) del usuario autenticado.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente, expirado, o inválido |

**Schema:** Swagger UI → Auth → `GET /auth/me`

---

### `GET /api/v1/users/me/profile`

**Summary:** Obtener el perfil del usuario autenticado.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
Obtener un read model compuesto (Profile + email + role del User). Es el endpoint canónico para cargar la pantalla de perfil del usuario actual.

**Precondiciones:**
- Token JWT válido.
- El usuario debe tener un Profile creado (se crea al registrarse).

**Efectos:**
- Retorna `MyProfileResource` con fullName, photoUrl, email, role.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 404 | `PROFILE_NOT_FOUND` | El perfil no existe (no debería ocurrir si el usuario se registró correctamente) |

**Schema:** Swagger UI → Profiles → `GET /users/me/profile`

---

### `PUT /api/v1/profiles/{profileId}`

**Summary:** Actualizar un perfil.

**Roles:** Dueño del perfil | `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
Modificar `fullName` y `photoUrl` del perfil. Solo el dueño o un admin pueden hacerlo.

**Precondiciones:**
- Token JWT válido.
- El `profileId` debe existir.
- El usuario autenticado debe ser el dueño del perfil O tener rol `ROLE_ADMIN`.

**Efectos:**
- Actualiza `fullName` y/o `photoUrl` en el `Profile`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres el dueño del perfil ni admin |

**Schema:** Swagger UI → Profiles → `PUT /profiles/{profileId}`
