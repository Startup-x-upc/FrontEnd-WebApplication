# Implementation Inventory

Este documento refleja el estado real de la arquitectura del proyecto `FrontEnd-WebApplication` a la fecha, tras la fase de estabilización técnica. Está organizado por Bounded Context e indica las piezas existentes y faltantes de cara al Sprint 2.

---

## IAM
### Existing classes
- **Domain**: `account.entity.ts`, `profile.entity.ts`
- **Infrastructure (DTOs/Assemblers)**: `auth-response.ts`, `profile-response.ts`, `account-assembler.ts`, `profile-assembler.ts`

### Existing services
- **Connected to Fake API**: `iam-api.service.ts`

### Existing store
- `iam.store.ts`

### Existing presentation
- `login-form` (HTML/CSS/TS)
- `admin-dashboard` (TS - Stub template inline)
- `driver-dashboard` (TS - Stub template inline)
- `passenger-dashboard` (TS - Stub template inline)
*Nota: Los dashboards son orquestadores que arquitectónicamente están mal ubicados en IAM, pero existen.*

### Missing pieces
- Implementaciones de UI para el registro o edición de perfil (fuera de alcance actual si no bloquea el flujo principal).

### Current status
**Estable y completo.** Soporta la autenticación y la persistencia de sesión mock.

---

## Ride Dispatch
### Existing classes
- **Domain**: `ride-request.entity.ts`, `ride.entity.ts`, `driver-availability.entity.ts`, `ride.status.ts`
- **Infrastructure (DTOs/Assemblers)**: `ride-request-response.ts`, `ride-response.ts`, `driver-availability-response.ts`, `ride-request-assembler.ts`, `ride-assembler.ts`, `driver-availability-assembler.ts`

### Existing services
- **Connected to Fake API**: `ride-dispatch-api.service.ts` (Totalmente integrado)

### Existing store
- `ride-dispatch.store.ts`

### Existing presentation
- Ninguna (Scaffolding preparado con `.gitkeep`)

### Missing pieces
- Componentes visuales (`presentation/components/*`): lista de solicitudes, mapa, estado de viaje.

### Current status
**Infraestructura y Dominio estables.** Listo para la fase de construcción de la UI del Sprint 2.

---

## Monetization
### Existing classes
- **Domain**: `wallet.entity.ts`, `wallet-transaction.entity.ts`, `fare-policy.entity.ts`
- **Infrastructure (DTOs/Assemblers)**: `wallet-response.ts`, `fare-config-response.ts`, `wallet-assembler.ts`, `fare-config-assembler.ts`

### Existing services
- **Connected to Fake API**: `monetization-api.service.ts` (Totalmente integrado)

### Existing store
- `monetization.store.ts`

### Existing presentation
- Ninguna (Scaffolding preparado con `.gitkeep`)

### Missing pieces
- Componentes visuales: vista del wallet (saldo), componente de confirmación de tarifas.
- Assemblers para transacciones (si fueran necesarias en el sprint).

### Current status
**Infraestructura y Dominio estables.** Listo para la construcción de UI.

---

## Driver Management
### Existing classes
- **Domain**: `driver.entity.ts`, `driver-document.entity.ts`, `verification-review.entity.ts`
- **Infrastructure (DTOs/Assemblers)**: `driver-response.ts`, `driver-assembler.ts`

### Existing services
- **Connected to Fake API**: `driver-management-api.service.ts` (Integración mínima para el perfil base del conductor)
- **Services still in stub**: Rutinas de documentos y verificaciones (`getDriverDocuments`, `approveDriver`, etc. devuelven mocks/arreglos vacíos de forma segura).

### Existing store
- `driver-management.store.ts`

### Existing presentation
- Ninguna (Scaffolding preparado con `.gitkeep`)

### Missing pieces
- DTOs y Assemblers para documentos y revisiones.
- Componentes de UI.

### Current status
**Mínimamente Viable.** Estabilizado para evitar errores en flujos paralelos del Sprint 2. Requerirá implementación completa en futuros sprints.

---

## Trust & Reputation
### Existing classes
- **Domain**: `trip-rating.entity.ts`, `driver-reputation.entity.ts`, `passenger-reputation.entity.ts`
- **Infrastructure (DTOs/Assemblers)**: `rating-response.ts`, `rating-assembler.ts`

### Existing services
- **Connected to Fake API**: `trust-reputation-api.service.ts` (Integración mínima para guardar y leer valoraciones de viajes).
- **Services still in stub**: Rutinas de reputación agregada (`getDriverReputation`, `getPassengerReputation` devuelven mocks seguros).

### Existing store
- `trust-reputation.store.ts`

### Existing presentation
- Ninguna (Scaffolding preparado con `.gitkeep`)

### Missing pieces
- DTOs y Assemblers para resúmenes de reputación.
- Componentes de UI (estrellas, formularios de reseña).

### Current status
**Mínimamente Viable.** Listo para que los pasajeros/conductores envíen valoraciones (ratings) al finalizar los viajes en el Sprint 2.

---

## Shared
### Existing classes
- **Domain**: `base-entity.ts`

### Existing presentation
- Scaffolding de `layout/`, `footer/` y `language-switcher/`

### Missing pieces
- Implementación de los componentes transversales.
- Infraestructura técnica (e.g., servicio base HTTP, configuración central de interceptores si aplica, `LogoDevApi`).

### Current status
**Básico.** Directorios listos, a la espera de la construcción de UI global.
