# Sprint 2 Readiness

Este documento evalúa el estado de preparación de las User Stories del Sprint 2 basándose en la estabilización técnica reciente de la capa de infraestructura y aplicación. Sirve como semáforo para decidir qué pantallas construir a continuación.

## IAM
### US-03 — Inicio de sesión
- **Estado Actual:** Partial (Dominio, Infraestructura y Store completados).
- **Dependencias para UI:** `iam.store.ts` y componente `login-form` (existente pero pendiente de pulir UI).
- **Readiness:** **Ready for UI**.

### US-04 — Gestión de perfil (Soporte)
- **Estado Actual:** Pending.
- **Dependencias para UI:** Faltan los métodos del API y Store para actualizar el perfil.
- **Readiness:** **Not ready for UI**.

---

## Ride Dispatch
### US-07 — Detección automática de ubicación del pasajero
- **Estado Actual:** Partial (Dominio creado, pendiente integración de la API del navegador).
- **Dependencias para UI:** Crear el componente visual y conectar con geolocalización.
- **Readiness:** **Ready for UI**.

### US-08 — Selección de destino en el mapa
- **Estado Actual:** Partial (Dominio creado).
- **Dependencias para UI:** Componente de mapa o input simulado.
- **Readiness:** **Ready for UI**.

### US-13 — Activar y desactivar disponibilidad del conductor
- **Estado Actual:** Partial (Infraestructura, DTOs y Store completados).
- **Dependencias para UI:** Componente switch/botón; validación con `monetization.store.ts` (saldo positivo).
- **Readiness:** **Ready for UI**.

### US-14 — Visualización de solicitudes de viaje disponibles
- **Estado Actual:** Partial (Infraestructura, DTOs y Store completados).
- **Dependencias para UI:** Componente de lista de solicitudes (`driver-request-list`).
- **Readiness:** **Ready for UI**.

### US-15 — Solicitud de viaje por parte del pasajero
- **Estado Actual:** Partial (Infraestructura, DTOs y Store completados).
- **Dependencias para UI:** Formulario de confirmación de viaje; integración con cálculo de tarifa (US-19).
- **Readiness:** **Ready for UI**.

### US-16 — Aceptación de solicitud de viaje por el conductor
- **Estado Actual:** Partial (Infraestructura, DTOs y Store completados).
- **Dependencias para UI:** Botón de "Aceptar" en la tarjeta de solicitud y cambio de vista a viaje en curso.
- **Readiness:** **Ready for UI**.

### US-09 — Visualización de conductores cercanos (Stretch Goal)
- **Estado Actual:** Pending.
- **Dependencias para UI:** Faltan endpoints de búsqueda por proximidad real.
- **Readiness:** **Not ready for UI**.

---

## Monetization
### US-19 — Cálculo de tarifa por distancia
- **Estado Actual:** Partial (Infraestructura, DTOs y Store completados).
- **Dependencias para UI:** Visualización del precio calculado en la vista de confirmación del pasajero.
- **Readiness:** **Ready for UI**.

### US-28 — Visualización del saldo del wallet
- **Estado Actual:** Partial (Infraestructura, DTOs y Store completados).
- **Dependencias para UI:** Componente visual del saldo (`wallet-balance`).
- **Readiness:** **Ready for UI**.

---

## Ready for UI
Las siguientes historias cuentan con todo el respaldo técnico (Fake API, Entidades, Assemblers y Store) para que se empiece a construir la interfaz sin miedo a romper flujos de datos:
1. **US-03**: Inicio de sesión (Angular Material).
2. **US-13**: Activar disponibilidad de conductor.
3. **US-14**: Listar solicitudes de viaje para el conductor.
4. **US-15**: Crear solicitud de viaje por el pasajero.
5. **US-16**: Aceptar viaje por el conductor.
6. **US-19**: Cálculo y visualización de tarifas.
7. **US-28**: Visualizar saldo de wallet.

## Not ready for UI
Las siguientes historias requieren lógica adicional en el *store* o *servicios* antes de saltar al maquetado, o han sido categorizadas como soporte prescindible si el tiempo apremia:
1. **US-04**: Edición de perfil (Soporte).
2. **US-09**: Mapa de conductores cercanos (Stretch Goal).
3. **US-06** & **US-23**: Gestión documental y reputación. Se implementaron como placeholers visuales (datos ya disponibles en el Fake API para mostrar, pero sin flujo interactivo).

## Blockers
- **No existen bloqueantes arquitectónicos** para las US de "Ready for UI". El scaffolding estructural (`presentation/components`) ya existe en cada bounded context. La transición hacia el maquetado visual con Angular Material puede comenzar inmediatamente.
