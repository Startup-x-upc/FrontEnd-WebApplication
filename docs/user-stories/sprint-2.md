# Sprint 2 Readiness + User Tasks

Este documento redefine el alcance funcional del Sprint 2 de forma realista, considerando que el proyecto será validado con **fake API** y una estrategia de **refresh manual** en lugar de sincronización en tiempo real. Además, incluye las **user tasks** asociadas a cada historia priorizada, agrupadas por bounded context.

## Criterio general del sprint

El Sprint 2 se enfocará en validar el flujo principal de solicitud y asignación de viaje entre pasajero y conductor. Para ello, se priorizarán las historias de usuario que permiten demostrar el caso de uso central del producto:

- el pasajero inicia sesión
- define origen y destino
- visualiza la tarifa estimada
- confirma la solicitud
- el conductor disponible visualiza solicitudes
- el conductor acepta o rechaza
- el pasajero actualiza el estado de su solicitud mediante **refresh manual**

## Enfoque de sincronización

Aunque algunas historias del backlog plantean comportamientos en tiempo real, para este sprint se implementará una versión simplificada orientada a demostración académica.

### Decisión adoptada

- **No se implementará realtime real**
- **No se implementará polling**
- **Se usará refresh manual** para actualizar el estado de la solicitud y de la disponibilidad en la demo

### Justificación

Esta decisión permite validar correctamente el flujo principal del producto sin introducir complejidad innecesaria como:

- WebSockets
- Ably
- mensajería realtime
- tracking continuo de motorizados
- cálculos dinámicos de proximidad en vivo

---

# 1. IAM

## US-03 — Inicio de sesión

- **Estado actual:** Partial
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- Si el usuario ingresa credenciales correctas, accede a la plataforma y es redirigido según su rol.
- Si el usuario ingresa credenciales incorrectas, el sistema muestra un mensaje de error genérico.

### User Tasks

- **TASK-US03-01** Crear/validar colección `users` en `db.json` con cuentas seed por rol.
- **TASK-US03-02** Crear/validar colección `profiles` en `db.json` solo para lectura básica del usuario autenticado si la UI lo necesita.
- **TASK-US03-03** Implementar o validar `IamApiService` para `GET /users?email={email}&password={password}`.
- **TASK-US03-04** Implementar o validar `IamApiService` para `GET /profiles?accountId={accountId}` solo para datos mínimos de sesión.
- **TASK-US03-05** Implementar o ajustar `iam.store.ts` para:
  - autenticar usuario
  - guardar sesión mock
  - exponer rol actual
  - exponer datos básicos del usuario autenticado
- **TASK-US03-06** Ajustar redirección del pasajero a la nueva home transaccional (`/passenger/request-ride`).
- **TASK-US03-07** Ajustar mensaje de error genérico para credenciales inválidas.
- **TASK-US03-08** Probar flujo completo de login con json-server.

> **Nota:** No se implementará la user story de gestión de perfil en este sprint.

---

# 2. Ride Dispatch

## US-07 — Detección automática de ubicación del pasajero

- **Estado actual:** Partial
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- Si el pasajero acepta permisos, el sistema detecta su ubicación actual y la usa como origen.
- Si el pasajero no concede permisos, se debe permitir selección manual del origen.

### User Tasks

- **TASK-US07-01** Implementar integración con geolocalización del navegador.
- **TASK-US07-02** Crear lógica de fallback manual en caso de denegación de permisos.
- **TASK-US07-03** Conectar el origen detectado al store de `ride-dispatch`.
- **TASK-US07-04** Mostrar el origen en la UI con texto legible y no solo coordenadas crudas.
- **TASK-US07-05** Reflejar el origen también en el mapa Leaflet.

---

## US-08 — Selección de destino

- **Estado actual:** Partial
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El pasajero puede definir un destino.
- El sistema muestra el destino seleccionado y lo usa para el cálculo de tarifa.

### User Tasks

- **TASK-US08-01** Implementar selector de destino en la UI.
- **TASK-US08-02** Conectar el destino al store de `ride-dispatch`.
- **TASK-US08-03** Reflejar el destino en el mapa.
- **TASK-US08-04** Validar el flujo origen + destino antes de habilitar el siguiente paso.
- **TASK-US08-05** Integrar la selección de destino con el cálculo tarifario.

---

## US-09 — Visualización de conductores cercanos

- **Estado actual:** Partial / Simplified
- **Readiness:** **Ready for Simplified UI**

### Redefinición funcional

La visualización será **referencial**, no en tiempo real. No se hará seguimiento dinámico de motorizados ni cálculo de distancia por conductor para este sprint.

### Acceptance Criteria

- El pasajero puede ver de manera referencial que existen conductores disponibles.
- La visualización no requiere tracking en vivo ni ETA por conductor.

### User Tasks

- **TASK-US09-01** Mostrar conductores disponibles de forma simple en el mapa.
- **TASK-US09-02** Evitar tabla comparativa estilo marketplace.
- **TASK-US09-03** Mostrar mensaje resumido tipo “Conductores disponibles en la zona”.
- **TASK-US09-04** Preparar estado vacío cuando no haya conductores disponibles.

---

## US-10 — Actualización manual del estado de aceptación

- **Estado actual:** Simplified
- **Readiness:** **Ready for Simplified UI**

### Redefinición funcional

En lugar de notificación realtime, el pasajero podrá actualizar manualmente el estado de su solicitud.

### Acceptance Criteria

- Luego de confirmar una solicitud, el pasajero puede refrescar manualmente el estado.
- Si un conductor aceptó, la UI refleja la asignación.

### User Tasks

- **TASK-US10-01** Implementar botón o acción de refresh manual en la pantalla del pasajero.
- **TASK-US10-02** Consultar el estado actualizado de `rideRequests` / `rides`.
- **TASK-US10-03** Mostrar transición visual hacia estado `DRIVER_ASSIGNED` cuando corresponda.

---

## US-11 — Actualización manual del estado de rechazo o espera

- **Estado actual:** Simplified
- **Readiness:** **Ready for Simplified UI**

### Redefinición funcional

En lugar de notificación realtime, el pasajero podrá actualizar manualmente el estado de su solicitud para saber si fue rechazada o continúa pendiente.

### Acceptance Criteria

- La UI permite reflejar si la solicitud sigue pendiente, fue rechazada o no encontró conductores.
- No se usa mensajería realtime.

### User Tasks

- **TASK-US11-01** Definir estados visuales: `SEARCHING_DRIVER`, `NO_DRIVERS`, `ERROR`.
- **TASK-US11-02** Refrescar manualmente el estado de la solicitud.
- **TASK-US11-03** Mostrar mensajes consistentes sin contradicciones.

---

## US-12 — Visualización de ubicación del pasajero para el conductor

- **Estado actual:** Pending
- **Readiness:** **Out of Sprint Core / Optional**

### User Tasks

> No se trabajará en este sprint.

---

## US-13 — Activar y desactivar disponibilidad del conductor

- **Estado actual:** Partial
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- Si el conductor tiene saldo suficiente, puede activarse.
- Si no tiene saldo, el sistema no le permite quedar disponible.

### User Tasks

- **TASK-US13-01** Crear o validar `driverAvailability` en `db.json`.
- **TASK-US13-02** Implementar toggle de disponibilidad en la UI del conductor.
- **TASK-US13-03** Conectar el toggle con `ride-dispatch.store.ts`.
- **TASK-US13-04** Validar el saldo desde `monetization.store.ts` antes de activar.
- **TASK-US13-05** Reflejar visualmente si el conductor está conectado o desconectado.

---

## US-14 — Visualización de solicitudes para conductor

- **Estado actual:** Partial
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El conductor puede ver solicitudes disponibles.
- Puede revisar origen, destino y tarifa estimada.

### User Tasks

- **TASK-US14-01** Consumir `GET /rideRequests?status=PENDING`.
- **TASK-US14-02** Crear lista/tarjetas de solicitudes para el conductor.
- **TASK-US14-03** Mostrar origen, destino y tarifa estimada.
- **TASK-US14-04** Preparar acciones de aceptar/rechazar.

---

## US-15 — Solicitud de viaje por parte del pasajero

- **Estado actual:** Partial
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El pasajero confirma la solicitud con origen, destino y tarifa.
- La solicitud queda registrada con estado pendiente.

### User Tasks

- **TASK-US15-01** Crear flujo principal de home transaccional del pasajero.
- **TASK-US15-02** Integrar origen, destino y tarifa estimada en un solo flujo.
- **TASK-US15-03** Implementar CTA principal: `Confirmar solicitud`.
- **TASK-US15-04** Crear request en fake API (`POST /rideRequests`).
- **TASK-US15-05** Mostrar transición visual a estado `SEARCHING_DRIVER`.

---

## US-16 — Postulación de conductor y selección por parte del pasajero (inDrive flow)

- **Estado actual:** Completed
- **Readiness:** **Fully Implemented**

### Acceptance Criteria

- Los conductores disponibles pueden ver las solicitudes y postularse (`PROPOSED`).
- El pasajero visualiza los candidatos postulados tras un refresh manual.
- El pasajero selecciona al conductor que prefiera, confirmando el viaje.
- Se crea formalmente el viaje (`rides`) y el conductor seleccionado queda ocupado (`isBusy`).

### User Tasks

- **TASK-US16-01** Implementar colección `rideCandidates` en `db.json`.
- **TASK-US16-02** Diseñar pantalla de selección de candidatos en la UI del pasajero (`app-ride-candidates-list`).
- **TASK-US16-03** Crear acción de postulación para el conductor en el dashboard.
- **TASK-US16-04** Implementar flujo transaccional de selección: confirmación de solicitud + aceptación de candidato + rechazo de competidores + creación de viaje.

---

## US-17 — Progresión y finalización del viaje

- **Estado actual:** Completed
- **Readiness:** **Fully Implemented**

### Acceptance Criteria

- El conductor puede marcar secuencialmente los estados del viaje: en camino, llegó, iniciado, completado.
- El pasajero puede actualizar su pantalla y ver el estado de avance correspondiente.
- Al completar el viaje, el conductor se libera para recibir nuevas postulaciones.
- Se proveen botones en la UI para redirigir al conductor a **Google Maps externo**.

### User Tasks

- **TASK-US17-01** Implementar botones de navegación a Google Maps para el conductor.
- **TASK-US17-02** Controlar los estados intermedios del viaje: `DRIVER_ON_THE_WAY`, `DRIVER_ARRIVED`, `STARTED`, `COMPLETED`.
- **TASK-US17-03** Asegurar la liberación del conductor (`isBusy = false`) tras la finalización.

---

## US-18 — Cancelación de viaje

- **Estado actual:** Pending
- **Readiness:** **Deferred / Optional**

### User Tasks

> No se trabajará en este sprint.

---

# 3. Monetization

## US-19 — Cálculo de tarifa por distancia

- **Estado actual:** Partial
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El sistema calcula la tarifa estimada a partir de la distancia.
- El pasajero ve esa tarifa antes de confirmar la solicitud.

### User Tasks

- **TASK-US19-01** Consumir `GET /fareConfig`.
- **TASK-US19-02** Implementar cálculo de tarifa en `monetization.store.ts`.
- **TASK-US19-03** Mostrar la tarifa estimada en el panel derecho o resumen del viaje.
- **TASK-US19-04** Integrar el cálculo con los cambios de origen/destino.
- **TASK-US19-05** Mostrar también distancia estimada en la UI.

---

## US-20 — Configuración de tarifas por administrador

- **Estado actual:** Pending
- **Readiness:** **Out of Sprint Core**

### User Tasks

> No se trabajará en este sprint.

---

## US-27 — Recarga del wallet mediante Stripe

- **Estado actual:** Pending
- **Readiness:** **Deferred**

### User Tasks

> No se trabajará en este sprint.

---

## US-28 — Visualización del saldo del wallet

- **Estado actual:** Partial
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El conductor visualiza su saldo.
- Si el saldo es insuficiente, se le impide activarse.

### User Tasks

- **TASK-US28-01** Consumir `GET /wallets?driverId={driverId}`.
- **TASK-US28-02** Mostrar saldo en la vista del conductor.
- **TASK-US28-03** Integrar la validación de saldo con US-13.
- **TASK-US28-04** Mostrar mensaje claro cuando no pueda activarse por saldo insuficiente.

---

## US-29 — Descuento automático de comisión por viaje

- **Estado actual:** Pending
- **Readiness:** **Deferred**

### User Tasks

> No se trabajará en este sprint.

---

## US-30 — Historial de transacciones del wallet

- **Estado actual:** Pending
- **Readiness:** **Deferred**

### User Tasks

> No se trabajará en este sprint.

---

# 4. Driver Management

## US-06 — Verificación de documentos del conductor

- **Estado actual:** Placeholder / soporte de datos
- **Readiness:** **Out of Sprint Core**

### Acceptance Criteria

- El sistema dispone de estados de verificación y habilitación para conductores, pero no se implementará el flujo interactivo completo en este sprint.

### User Tasks

- **TASK-US06-01** Mantener en `db.json` los campos `verificationStatus` y `operationalStatus`.
- **TASK-US06-02** Usar estos estados solo como soporte de datos para la demo.
- **TASK-US06-03** Asegurar que el conductor de prueba esté en estado válido para operar.

---

# 5. Trust & Reputation

## US-21 — Calificación al conductor

- **Estado actual:** Pending
- **Readiness:** **Deferred**

### User Tasks

> No se trabajará en este sprint.

---

## US-22 — Calificación al pasajero

- **Estado actual:** Pending
- **Readiness:** **Deferred**

### User Tasks

> No se trabajará en este sprint.

---

## US-23 — Visualización del puntaje de reputación

- **Estado actual:** Placeholder visual posible
- **Readiness:** **Out of Sprint Core / Placeholder only**

### Acceptance Criteria

- Si se muestra reputación, será solo como dato mock visual, sin flujo interactivo.

### User Tasks

- **TASK-US23-01** Mantener `ratingAverage` y `ratingCount` en `drivers`.
- **TASK-US23-02** Mostrar reputación solo si aporta contexto visual mínimo.
- **TASK-US23-03** No implementar flujo de calificación en este sprint.

---

# Ready & Fully Implemented (Sprint 2)

Las siguientes historias cuentan con base funcional e interfaces completas implementadas en este sprint:

1. **US-03** — Inicio de sesión
2. **US-07** — Detección de ubicación del pasajero
3. **US-08** — Selección de destino
4. **US-09** — Visualización referencial de disponibilidad
5. **US-10** — Actualización manual del estado de aceptación
6. **US-11** — Actualización manual del estado de rechazo o espera
7. **US-13** — Activar disponibilidad del conductor
8. **US-14** — Visualización de solicitudes para conductor
9. **US-15** — Solicitud de viaje del pasajero
10. **US-16** — Postulación y selección competitiva de conductores (inDrive model)
11. **US-17** — Progresión y finalización del viaje (en camino, llegó, iniciado, terminado)
12. **US-19** — Cálculo y visualización de tarifa
13. **US-28** — Visualización del saldo del wallet

---

# Out of Sprint Core

Las siguientes historias no formarán parte del alcance principal del Sprint 2:

1. **US-06** — Verificación documental interactiva
2. **US-12** — Ubicación del pasajero para el conductor
3. **US-20** — Configuración de tarifas por administrador
4. **US-23** — Visualización interactiva de reputación

---

# Deferred

Las siguientes historias quedan diferidas para una iteración posterior o para una versión más completa del producto:

- **US-18** — Cancelación de viaje
- **US-21** — Calificación al conductor
- **US-22** — Calificación al pasajero
- **US-27** — Recarga del wallet
- **US-29** — Descuento automático de comisión
- **US-30** — Historial de transacciones
- funcionalidades realtime reales
- seguimiento dinámico del mototaxi en mapa
- notificaciones push o mensajería en vivo
- selección manual comparativa de conductores

---

# Blockers

## Blockers arquitectónicos

- **No existen bloqueantes arquitectónicos graves** para las historias definidas como Ready for UI.

## Restricciones asumidas

- La actualización del estado de la solicitud se hará mediante **refresh manual**
- La visualización de conductores cercanos será **referencial**
- El mapa será una ayuda visual funcional, no un sistema de tracking en tiempo real

---

# Conclusión

El Sprint 2 queda redefinido como una iteración funcional y académicamente viable, enfocada en demostrar el flujo principal de solicitud y asignación de viaje, apoyándose en fake API y sincronización manual del estado. Esto permite avanzar con la UI sin introducir complejidad técnica desproporcionada para el alcance del proyecto.
