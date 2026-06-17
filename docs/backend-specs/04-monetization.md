# 04 — Monetization Bounded Context

> **Dependencias:** Driver Management (Driver), Ride Dispatch (Ride)
> **Agregados:** FarePolicy, Wallet
> **Entidades satélite:** WalletTransaction

---

## 1. Entities & Value Objects

### 1.1 FarePolicy (Aggregate Root — Singleton Config)

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK. Solo existe UN registro |
| `baseFare` | `number` | ✅ | S/ por banderazo. Default: 2.5 |
| `pricePerKm` | `number` | ✅ | S/ por km. Default: 1.2 |
| `minimumFare` | `number` | ✅ | S/ mínimo. Default: 4.0 |
| `commissionRate` | `number` | ✅ | 0.05 (5%). Default: 0.05 |
| `updatedAt` | `ISO 8601` | auto | |

Métodos:
- `calculateFare(distanceKm)` → `max(minimumFare, baseFare + pricePerKm * distanceKm)`
- `calculateCommission(fare)` → `round(fare * commissionRate, 2)`

> **Nota para el frontend:** La comisión 5% está centralizada en `FarePolicy.PLATFORM_COMMISSION_RATE`. El backend debe exponerla en este endpoint y ser la única fuente de verdad.

### 1.2 Wallet (Aggregate Root)

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK |
| `driverId` | `UUID` | ✅ | FK → Driver.id, unique (1:1) |
| `balance` | `Decimal(10,2)` | ✅ | Default: 0.00. SIEMPRE redondeado a 2 decimales |
| `status` | `WalletStatus` | ✅ | `'ACTIVE'` por defecto |

**WalletStatus**: `'ACTIVE' | 'BLOCKED'`

Métodos:
- `hasPositiveBalance()` → `balance > 0`
- `canActivate()` → `status === 'ACTIVE' && hasPositiveBalance()`

> **Nota para el frontend:** El balance debe usar DECIMAL(10,2) en BD. Todas las operaciones aritméticas se redondean a 2 decimales con `Math.round(x * 100) / 100`.

### 1.3 WalletTransaction

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `id` | `UUID` | auto | PK |
| `walletId` | `UUID` | ✅ | FK → Wallet.id |
| `tripId` | `UUID \| null` | No | FK → Ride.id. null si es TOP_UP |
| `type` | `TransactionType` | ✅ | |
| `amount` | `Decimal(10,2)` | ✅ | Positivo para TOP_UP, negativo para COMMISSION |
| `resultingBalance` | `Decimal(10,2)` | ✅ | Balance después de la transacción |
| `timestamp` | `ISO 8601` | auto | |

**TransactionType**: `'TOP_UP' | 'TOP_UP_FAILED' | 'COMMISSION'`

---

## 2. Business Rules & Invariants

| # | Regla |
|---|---|
| BR1 | Solo existe UNA FarePolicy en el sistema (singleton) |
| BR2 | La comisión es del 5% del fare, redondeado a 2 decimales |
| BR3 | La comisión de un ride SOLO se descuenta una vez (idempotente por tripId) |
| BR4 | Un conductor necesita balance > 0 para activar disponibilidad |
| BR5 | Si el balance llega a 0 mientras está activo, se desactiva automáticamente |
| BR6 | El monto mínimo de recarga es S/ 5.00 |
| BR7 | Toda recarga crea un WalletTransaction tipo TOP_UP |
| BR8 | Toda comisión crea un WalletTransaction tipo COMMISSION |
| BR9 | Las operaciones sobre Wallet (recarga, comisión) deben ser atómicas: actualizar balance + crear transaction en la misma transacción de BD |
| BR10 | El balance nunca puede ser negativo (si una comisión lo llevaría a < 0, se deja en 0) |
| BR11 | Solo ADMIN puede modificar FarePolicy |

---

## 3. State Machine

```
Wallet:
  [Creación al registrar Driver] → ACTIVE (balance: 0)
  ACTIVE → BLOCKED (admin)
  BLOCKED → ACTIVE (admin)

FarePolicy:
  [Seed inicial] → (valores default)
  (ADMIN actualiza vía PUT)
```

---

## 4. Commands

### 4.1 Recharge Wallet

```
POST /wallets/:walletId/recharge
Auth: Bearer token (DRIVER dueño)
```

**Request Body:**
```json
{
  "amount": 50.00
}
```

**Validaciones:**
- `amount`: mínimo 5.00, máximo 500.00
- Wallet debe existir y estar ACTIVE

**Lógica (atómica):**
1. `newBalance = round(wallet.balance + amount, 2)`
2. `UPDATE wallet SET balance = newBalance`
3. `INSERT INTO wallet_transactions (walletId, type='TOP_UP', amount, resultingBalance)`

**Response 200:**
```json
{
  "wallet": {
    "id": "880e8400-e29b-41d4-a716-446655440004",
    "driverId": "770e8400-e29b-41d4-a716-446655440003",
    "balance": 50.00,
    "status": "ACTIVE"
  },
  "transaction": {
    "id": "tx-550e8400-0006",
    "walletId": "880e8400-e29b-41d4-a716-446655440004",
    "tripId": null,
    "type": "TOP_UP",
    "amount": 50.00,
    "resultingBalance": 50.00,
    "timestamp": "2026-06-15T21:30:00.000Z"
  }
}
```

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | No eres el dueño de esta wallet |
| 404 | `NOT_FOUND` | Wallet no encontrada |
| 409 | `WALLET_BLOCKED` | Wallet bloqueada |
| 422 | `INVALID_AMOUNT` | Monto fuera de rango (5-500) |

> **Nota sobre Stripe:** Esta implementación asume que el pago ya fue procesado por Stripe. El flujo real es: frontend crea PaymentIntent en Stripe → Stripe confirma pago → webhook de Stripe llama a este endpoint internamente. Para la versión inicial sin Stripe, este endpoint se expone directamente como "recarga simulada".

---

### 4.2 Apply Commission (interno — llamado desde Ride Dispatch)

```
POST /wallets/:walletId/apply-commission
Auth: Internal service (no expuesto al frontend directamente)
```

**Request Body:**
```json
{
  "tripId": "r-550e8400-0003",
  "rideFare": 4.00
}
```

**Lógica (atómica, idempotente):**
1. Verificar que no existe WalletTransaction con este tripId + type=COMMISSION
2. Si ya existe → devolver wallet actual (idempotente)
3. `commission = round(rideFare * farePolicy.commissionRate, 2)`
4. `newBalance = round(max(0, wallet.balance - commission), 2)`
5. `UPDATE wallet SET balance = newBalance`
6. `INSERT wallet_transactions (walletId, tripId, type='COMMISSION', amount=-commission, resultingBalance)`
7. Si newBalance === 0 → emitir `WalletEmpty` event (para que Driver Management desactive disponibilidad)

**Response 200:**
```json
{
  "wallet": { "...": "..." },
  "transaction": {
    "id": "tx-550e8400-0007",
    "walletId": "880e8400-e29b-41d4-a716-446655440004",
    "tripId": "r-550e8400-0003",
    "type": "COMMISSION",
    "amount": -0.20,
    "resultingBalance": 49.80,
    "timestamp": "2026-06-15T21:15:00.000Z"
  }
}
```

> **Nota para el frontend:** Este comando es llamado por el backend internamente cuando Ride Dispatch emite `RideCompleted`. No es un endpoint público. El frontend NUNCA lo llama directamente.

---

### 4.3 Update Fare Policy (Admin)

```
PUT /fare-config
Auth: Bearer token (ADMIN)
```

**Request Body:**
```json
{
  "baseFare": 3.0,
  "pricePerKm": 1.5,
  "minimumFare": 5.0,
  "commissionRate": 0.05
}
```

**Validaciones:**
- Todos los campos requeridos y > 0
- `commissionRate` entre 0 y 1 (0% a 100%)

**Response 200:**
```json
{
  "id": "fc-550e8400-0008",
  "baseFare": 3.0,
  "pricePerKm": 1.5,
  "minimumFare": 5.0,
  "commissionRate": 0.05,
  "updatedAt": "2026-06-15T22:00:00.000Z"
}
```

**Errores:**
| HTTP | Código | Mensaje |
|---|---|---|
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | Solo admin |
| 422 | `VALIDATION_ERROR` | Valores inválidos |

---

## 5. Queries

### 5.1 Get Wallet by Driver

```
GET /drivers/:driverId/wallet
Auth: Bearer token (DRIVER propio o ADMIN)
```

**Response 200:**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440004",
  "driverId": "770e8400-e29b-41d4-a716-446655440003",
  "balance": 49.80,
  "status": "ACTIVE"
}
```

### 5.2 Get Wallet Transactions

```
GET /wallets/:walletId/transactions
Auth: Bearer token (DRIVER dueño)
```

**Query Params:**
- `?type=COMMISSION` (opcional, filtra por tipo)
- `?sort=-timestamp` (default: más reciente primero)
- `?page=1&perPage=20`

**Response 200:**
```json
{
  "data": [
    {
      "id": "tx-550e8400-0007",
      "walletId": "880e8400-e29b-41d4-a716-446655440004",
      "tripId": "r-550e8400-0003",
      "type": "COMMISSION",
      "amount": -0.20,
      "resultingBalance": 49.80,
      "timestamp": "2026-06-15T21:15:00.000Z"
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 1, "pages": 1 }
}
```

> **Nota para el frontend:** Actualmente el sort y filtro se hacen client-side (`wallet-transaction-assembler.ts` ordena por timestamp). Con este endpoint el backend ya devuelve los datos ordenados y filtrados.

### 5.3 Get Fare Policy

```
GET /fare-config
Auth: Bearer token (cualquier rol)
```

**Response 200:**
```json
{
  "id": "fc-550e8400-0008",
  "baseFare": 2.5,
  "pricePerKm": 1.2,
  "minimumFare": 4.0,
  "commissionRate": 0.05,
  "updatedAt": "2026-06-15T21:00:00.000Z"
}
```

> **Nota:** El mock actual devuelve un array. El backend debe devolver un objeto singular (es singleton).

---

## 6. Commission Flow (End-to-End)

```
1. Driver completa ride → RideDispatch emite RideCompleted
2. Monetization recibe RideCompleted
3. applyCommission(tripId, rideFare):
   a. Verificar idempotencia (tripId + COMMISSION ya existe?)
   b. Calcular commission = round(fare * 0.05, 2)
   c. Deducir del wallet del driver
   d. Crear WalletTransaction COMMISSION
   e. Si balance queda en 0 → emitir WalletEmpty
4. DriverManagement recibe WalletEmpty → desactivar disponibilidad
```

---

## 7. Integration Events

### Events Consumed

| Evento | Origen | Acción |
|---|---|---|
| `DriverRegistered` | IAM | Crear Wallet (balance 0) |
| `RideCompleted` | Ride Dispatch | Aplicar comisión (applyCommission) |

### Events Emitted

| Evento | Trigger | Consumidores |
|---|---|---|
| `WalletRecharged` | Recarga exitosa | Ninguno actualmente |
| `CommissionApplied` | Comisión aplicada | Ninguno actualmente |
| `WalletEmpty` | Balance llega a 0 | Driver Management (desactivar disponibilidad) |

---

## 8. Auth Requirements Summary

| Endpoint | Roles |
|---|---|
| `POST /wallets/:id/recharge` | DRIVER (dueño) |
| `POST /wallets/:id/apply-commission` | Interno (no público) |
| `PUT /fare-config` | ADMIN |
| `GET /drivers/:id/wallet` | DRIVER (propio), ADMIN |
| `GET /wallets/:id/transactions` | DRIVER (dueño) |
| `GET /fare-config` | Autenticado |
