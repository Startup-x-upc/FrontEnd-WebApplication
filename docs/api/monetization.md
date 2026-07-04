# Monetization

**9 endpoints**  
**Base URL:** `/api/v1/monetization`

---

## Flujos típicos

### Flujo 1: Recarga de wallet

```
1. GET /monetization/drivers/{driverId}/wallet    → consultar saldo
2. POST /monetization/wallets/{walletId}/recharge  → recargar saldo
   Request: { amount: 50.00 }
   Response: { wallet, transaction }
3. GET /monetization/wallets/{walletId}/transactions → ver historial de transacciones
```

### Flujo 2: Verificación operativa del conductor

```
1. GET /monetization/wallets/{driverId}/can-operate?estimatedFare=25.0
   Response: { canOperate: true }
   → true si el saldo cubre la comisión estimada; false si no.
   Si es false, el conductor debe recargar antes de aplicar a rides.
```

---

## Endpoints

### `GET /api/v1/monetization/fare-config`

**Summary:** Obtener la política de tarifas vigente.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
Consultar los parámetros de tarifa actuales: tarifa base, precio por km, tarifa mínima, y tasa de comisión. El frontend puede usar esto para mostrar estimados antes de llamar `POST /monetization/fare-config/estimate`.

**Precondiciones:**
- Debe existir una `FarePolicy` configurada.

**Efectos:**
- Retorna `FarePolicyResponse` con `baseFare`, `pricePerKm`, `minimumFare`, `commissionRate`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |

**Schema:** Swagger UI → Monetization → `GET /monetization/fare-config`

---

### `PUT /api/v1/monetization/fare-config`

**Summary:** Configurar la política de tarifas.

**Roles:** `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
El administrador actualiza los parámetros de tarifa del sistema. Afecta a todos los cálculos de fare futuros.

**Precondiciones:**
- Usuario autenticado como admin.

**Efectos:**
- Actualiza la `FarePolicy` con los nuevos valores.
- Los nuevos rides usarán la política actualizada.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |

**Schema:** Swagger UI → Monetization → `PUT /monetization/fare-config`

---

### `POST /api/v1/monetization/fare-config/estimate`

**Summary:** Estimar la tarifa de un viaje.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
Calcular el costo estimado de un viaje basado en la distancia, usando la política de tarifas vigente. El frontend debe llamar esto antes de `POST /rides/requests` para mostrar el estimado al pasajero y validar contra la tarifa mínima.

**Precondiciones:**
- `distanceKm` > 0.

**Efectos:**
- Retorna `FareQuoteResponse` con el fare estimado.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |

**Schema:** Swagger UI → Monetization → `POST /monetization/fare-config/estimate`

---

### `GET /api/v1/monetization/drivers/{driverId}/wallet`

**Summary:** Obtener la wallet de un conductor.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
Consultar el saldo actual y el ID de wallet de un conductor. El `walletId` es necesario para los endpoints de recarga y consulta de transacciones.

**Precondiciones:**
- El `driverId` debe tener una wallet asociada.

**Efectos:**
- Retorna `WalletResponse` con `walletId`, `driverId`, `balance`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 404 | [VERIFICAR] | Wallet no encontrada para el driver |

**Schema:** Swagger UI → Monetization → `GET /monetization/drivers/{driverId}/wallet`

---

### `POST /api/v1/monetization/wallets/{walletId}/recharge`

**Summary:** Recargar saldo de una wallet.

**Roles:** Dueño del wallet | `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
El conductor (o el sistema) añade saldo a su wallet. Típicamente viene de una pasarela de pago externa. Este endpoint registra la recarga exitosa.

**Precondiciones:**
- Usuario autenticado como dueño de la wallet o admin.
- `walletId` debe existir.
- `amount` > 0.

**Efectos:**
- Incrementa el `balance` de la wallet en `amount`.
- Crea una `WalletTransaction` de tipo crédito.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres el dueño de la wallet ni admin |
| 404 | [VERIFICAR] | Wallet no encontrada |

**Schema:** Swagger UI → Monetization → `POST /monetization/wallets/{walletId}/recharge`

---

### `POST /api/v1/monetization/wallets/{walletId}/apply-commission`

**Summary:** Aplicar comisión por ride completado.

**Roles:** `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
Al completarse un ride, se descuenta la comisión de la wallet del conductor. Si el saldo resultante es 0, dispara `wallet.empty` en Ably.

**Precondiciones:**
- Usuario autenticado como admin.
- `walletId` debe existir.
- `rideFare` debe ser > 0.
- `balance` >= comisión a descontar.

**Efectos:**
- Reduce el `balance` según la tasa de comisión configurada.
- Crea una `WalletTransaction` de tipo débito.
- Si el saldo resultante es **0.00**, 🔴 publica `wallet.empty` en `driver:{driverId}`.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres admin |
| 409 | `INSUFFICIENT_BALANCE` | Saldo insuficiente para cubrir la comisión |

**Schema:** Swagger UI → Monetization → `POST /monetization/wallets/{walletId}/apply-commission`

---

### `POST /api/v1/monetization/wallets/{walletId}/top-up-failure`

**Summary:** Registrar un intento de recarga fallido.

**Roles:** `ROLE_ADMIN`

**Pagination:** N/A

---

**Propósito de negocio:**
Registrar en el historial que un intento de recarga falló (ej. pago rechazado por la pasarela). No modifica el saldo.

**Precondiciones:**
- Usuario autenticado como admin.
- `walletId` debe existir.

**Efectos:**
- Crea una `WalletTransaction` con estado `FAILED`, registrando `amount`, `reason` y timestamp.

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | No eres admin |

**Schema:** Swagger UI → Monetization → `POST /monetization/wallets/{walletId}/top-up-failure`

---

### `GET /api/v1/monetization/wallets/{walletId}/transactions`

**Summary:** Historial de transacciones de una wallet.

**Roles:** Dueño del driver | `ROLE_ADMIN` [VERIFICAR — el controller no tiene guard explícito]

**Pagination:** **0-based** — `page` (default=0), `size` (default=10)

---

**Propósito de negocio:**
Consultar el historial de recargas, comisiones y fallos de una wallet.

**Precondiciones:**
- `walletId` debe existir.

**Efectos:**
- Retorna lista paginada de `WalletTransactionResponse`.

**Query params:**

| Param | Default | Descripción |
|-------|---------|-------------|
| `page` | 0 | Página (0-based) |
| `size` | 10 | Resultados por página |

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |
| 404 | [VERIFICAR] | Wallet no encontrada |

**Schema:** Swagger UI → Monetization → `GET /monetization/wallets/{walletId}/transactions`

---

### `GET /api/v1/monetization/wallets/{driverId}/can-operate`

**Summary:** Verificar si un conductor puede operar.

**Roles:** Cualquier rol autenticado

**Pagination:** N/A

---

**Propósito de negocio:**
El frontend del conductor verifica si tiene saldo suficiente para cubrir la comisión de un ride estimado. Debe llamarse antes de aplicar a un ride request. Si retorna `false`, el conductor debe recargar su wallet.

**Precondiciones:**
- El `driverId` debe tener una wallet.

**Efectos:**
- Retorna `CanOperateResponse` con `{ driverId, canOperate: true/false }`.

**Query params:**

| Param | Default | Descripción |
|-------|---------|-------------|
| `estimatedFare` | (opcional) | Fare estimado del ride para verificar si el saldo cubre la comisión |

**Errores esperados de dominio:**

| HTTP | Code | Causa |
|------|------|-------|
| 401 | `UNAUTHORIZED` | Token ausente o inválido |

**Schema:** Swagger UI → Monetization → `GET /monetization/wallets/{driverId}/can-operate`
