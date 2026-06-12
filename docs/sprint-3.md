# Sprint 3 — Frontend Completion

Este documento define el alcance del Sprint 3, que completa la parte frontend del proyecto cubriendo todas las user stories que **no fueron abordadas en el Sprint 2**. Se mantiene la estrategia de **fake API (json-server)** y **refresh manual** donde aplique.

---

## Criterio general del sprint

El Sprint 3 se enfocará en **completar la experiencia de usuario integral** del frontend, cubriendo los siguientes frentes que quedaron pendientes:

- **Landing Page** completa (EP-06) — 8 secciones
- **Registro** de pasajero y conductor (US-01, US-02)
- **Gestión de perfil** (US-04)
- **Historial de viajes** para pasajero y conductor (US-24, US-25)
- **Cancelación de viaje** (US-18)
- **Sistema de calificaciones** post-viaje (US-21, US-22, US-23)
- **Panel de administración** (US-06, US-20, US-26)
- **Wallet** — historial de transacciones (US-30) y placeholder de recarga (US-27)
- **Mejora de sincronización** opcional (polling ligero para US-10/US-11)

---

## Enfoque de sincronización (se mantiene del Sprint 2)

### Decisión adoptada

- **No se implementará realtime real** (Ably/WebSockets)
- **Se usará refresh manual** como estrategia principal
- **Opcional:** Se puede introducir **polling ligero con intervalos** para mejorar la experiencia de aceptación/rechazo (US-10, US-11) si el tiempo lo permite

### Justificación

La decisión del Sprint 2 de no implementar realtime sigue siendo válida. Para el Sprint 3, se puede considerar polling como mejora progresiva, pero no es obligatorio para completar el frontend.

---

# 1. Landing Page (EP-06)

> **Estado actual:** Pending — 0% implementado
> **Readiness:** **Ready for UI** — todas son secciones estáticas/semi-estáticas

La Landing Page es el punto de entrada público de ChapaTuRuta. Es **puramente frontend** y no requiere backend más allá de servir assets estáticos. Las 8 secciones se implementarán como componentes standalone dentro de un layout scrollable.

---

## US-31 — Sección Hero con CTA diferenciado

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El visitante ve un título principal, subtítulo descriptivo y dos botones CTA: "Quiero viajar" y "Quiero manejar".
- Cada botón redirige al formulario de registro correspondiente.

### User Tasks

- **TASK-US31-01** Crear componente `landing-page` con layout scrollable de una sola página.
- **TASK-US31-02** Crear componente `hero-section` con título, subtítulo y dos CTA buttons estilizados.
- **TASK-US31-03** Conectar botones CTA a rutas `/register/passenger` y `/register/driver`.
- **TASK-US31-04** Agregar ruta `/landing` (o raíz `/`) apuntando al landing page.

---

## US-32 — Sección ¿Cómo funciona?

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El visitante ve 3 pasos ilustrados del flujo de pasajero.
- El visitante ve 3 pasos ilustrados del flujo de conductor.
- Cada paso incluye ícono, título corto y descripción.

### User Tasks

- **TASK-US32-01** Crear componente `how-it-works-section` con tabs o toggle pasajero/conductor.
- **TASK-US32-02** Definir contenido estático: 3 pasos para pasajero, 3 pasos para conductor.
- **TASK-US32-03** Usar Material Icons para cada paso.

---

## US-33 — Sección de beneficios por segmento

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El visitante ve beneficios específicos para pasajero y para conductor.
- Cada bloque lista al menos 4 beneficios con íconos.

### User Tasks

- **TASK-US33-01** Crear componente `benefits-section` con grid de 2 columnas (pasajero | conductor).
- **TASK-US33-02** Definir contenido estático de beneficios para cada segmento.

---

## US-34 — Sección de tarifas

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El visitante ve la explicación del modelo tarifario por distancia.
- Se muestran al menos 2 ejemplos con precio referencial en soles.

### User Tasks

- **TASK-US34-01** Crear componente `pricing-section` con fórmula simplificada.
- **TASK-US34-02** Crear tarjetas de ejemplo con distancias típicas y precios calculados estáticamente.
- **TASK-US34-03** Incluir CTA para redirigir a registro.

---

## US-35 — Sección de testimonios

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El visitante ve al menos 3 testimonios con nombre, zona, perfil y puntuación.

### User Tasks

- **TASK-US35-01** Crear componente `testimonials-section` con carrusel o grid de tarjetas.
- **TASK-US35-02** Definir datos mock de testimonios (3-5 entradas estáticas).

---

## US-36 — Sección About the Product

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El visitante ve un video publicitario del producto.
- El video tiene controles de reproducción, pausa y sonido.

### User Tasks

- **TASK-US36-01** Crear componente `about-product-section` con elemento `<video>` HTML5.
- **TASK-US36-02** Definir URL del video (puede ser un placeholder o embed de YouTube/Vimeo).
- **TASK-US36-03** Manejar estado de error si el video no carga.

---

## US-37 — Sección About the Team

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El visitante ve foto, nombre y rol de cada integrante de CTR Technologies.
- Si una imagen no carga, se muestra un placeholder genérico.

### User Tasks

- **TASK-US37-01** Crear componente `about-team-section` con grid de tarjetas de equipo.
- **TASK-US37-02** Definir datos mock del equipo (foto, nombre, rol) en archivo estático.
- **TASK-US37-03** Manejar fallback de imagen con avatar genérico.

---

## US-38 — Sección CTA final

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El visitante ve un CTA final al terminar el scroll con dos botones diferenciados.
- Los botones redirigen correctamente al registro de cada perfil.

### User Tasks

- **TASK-US38-01** Crear componente `final-cta-section` con mensaje motivador y dos botones.
- **TASK-US38-02** Conectar botones a las mismas rutas de registro que el Hero.

---

### Estructura de archivos — Landing Page

```
src/app/landing/
├── application/
│   └── landing.store.ts                    # Estado mínimo (scroll spy, si aplica)
├── presentation/
│   ├── pages/
│   │   └── landing-page/
│   │       └── landing-page.ts             # Layout scrollable con todas las secciones
│   └── components/
│       ├── hero-section/
│       │   └── hero-section.ts
│       ├── how-it-works-section/
│       │   └── how-it-works-section.ts
│       ├── benefits-section/
│       │   └── benefits-section.ts
│       ├── pricing-section/
│       │   └── pricing-section.ts
│       ├── testimonials-section/
│       │   └── testimonials-section.ts
│       ├── about-product-section/
│       │   └── about-product-section.ts
│       ├── about-team-section/
│       │   └── about-team-section.ts
│       └── final-cta-section/
│           └── final-cta-section.ts
```

### Rutas nuevas

```typescript
{ path: '', loadComponent: () => import('./landing/.../landing-page').then(m => m.LandingPage) },
// El landing es la raíz, login se mueve a /login
```

---

# 2. IAM — Completar funcionalidad faltante

## US-01 — Registro de pasajero

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El visitante ingresa correo y contraseña, la cuenta se crea y es redirigido al mapa.
- Si el correo ya existe, se muestra mensaje de error.

### User Tasks

- **TASK-US01-01** Crear colección `users` en `db.json` si no existe (ya existe para login).
- **TASK-US01-02** Crear componente `register-passenger-form` con campos: email, password, confirmar password.
- **TASK-US01-03** Implementar `POST /users` en `IamApiService` para crear cuenta.
- **TASK-US01-04** Validar email duplicado consultando `GET /users?email={email}` antes del POST.
- **TASK-US01-05** Validar que password y confirmación coincidan.
- **TASK-US01-06** Redirigir al login tras registro exitoso con mensaje de confirmación.

---

## US-02 — Registro de conductor

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El visitante ingresa correo, contraseña, número de brevete y SOAT.
- La cuenta queda en estado pendiente de verificación.
- Si faltan campos, se muestran errores de validación.

### User Tasks

- **TASK-US02-01** Crear componente `register-driver-form` con campos: email, password, confirmar, brevete, SOAT.
- **TASK-US02-02** Extender `IamApiService` con `POST /users` para rol DRIVER con estado `PENDING_VERIFICATION`.
- **TASK-US02-03** Asegurar que `db.json` tenga campo `verificationStatus` y `operationalStatus` en el perfil del conductor (ya existen según TASK-US06-01 del Sprint 2).
- **TASK-US02-04** Validar campos obligatorios con mensajes de error específicos.
- **TASK-US02-05** Redirigir al login con mensaje "Registro pendiente de verificación".

---

## US-04 — Gestión de perfil

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El usuario puede visualizar su nombre, correo, foto y (si es conductor) documentos.
- Puede editar nombre y foto, y los cambios se reflejan.

### User Tasks

- **TASK-US04-01** Crear componente `profile-page` accesible desde `/passenger/profile` y `/driver/profile`.
- **TASK-US04-02** Crear `profile-edit-form` con campos editables (fullName, photoUrl).
- **TASK-US04-03** Implementar `PUT /profiles/{id}` en `IamApiService`.
- **TASK-US04-04** Agregar ruta `/passenger/profile` y `/driver/profile` como children de sus layouts.
- **TASK-US04-05** Actualizar `IamStore` con acción `updateProfile()`.
- **TASK-US04-06** Reflejar cambios en el sidebar (nombre, foto) reactivamente.

---

## US-05 — Cierre de sesión

- **Estado actual:** ✅ Partial (implementado en IamStore.signOut())
- **Readiness:** **Ready for Verification**

### User Tasks

- **TASK-US05-01** Verificar que el botón de logout en ambos layouts (passenger, driver) funcione correctamente.
- **TASK-US05-02** Asegurar que `localStorage` se limpia al cerrar sesión.
- **TASK-US05-03** Redirigir a `/login` tras logout.

> **Nota:** Esta funcionalidad ya está implementada en `IamStore.signOut()`. Solo requiere verificación.

---

# 3. Ride Dispatch — Historias diferidas del Sprint 2

## US-18 — Cancelación de viaje

- **Estado actual:** Pending (Deferred en Sprint 2)
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El pasajero puede cancelar un viaje confirmado que aún no ha iniciado.
- El conductor puede cancelar un viaje aceptado que aún no ha iniciado.
- La cancelación se notifica a la otra parte (mediante refresh manual).

### User Tasks

- **TASK-US18-01** Agregar acción `cancelRide(rideId, cancelledBy)` en `RideDispatchStore`.
- **TASK-US18-02** Implementar `PATCH /rides/{id}` para cambiar estado a `CANCELLED_BY_PASSENGER` o `CANCELLED_BY_DRIVER`.
- **TASK-US18-03** Agregar botón "Cancelar viaje" en la vista de `DRIVER_SELECTED` del pasajero.
- **TASK-US18-04** Agregar botón "Cancelar viaje" en la vista de `RIDE_ASSIGNED` del conductor.
- **TASK-US18-05** Mostrar confirmación antes de cancelar (diálogo o paso intermedio).
- **TASK-US18-06** Actualizar UI tras cancelación para reflejar el estado cancelado.

---

# 4. Trust & Reputation — Sistema de calificaciones

## US-21 — Calificación post-viaje al conductor

- **Estado actual:** Pending (Deferred en Sprint 2)
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- Al finalizar el viaje, el pasajero puede asignar una puntuación de 1 a 5 estrellas.
- La calificación se registra y actualiza el promedio del conductor.

### User Tasks

- **TASK-US21-01** Crear colección `ratings` en `db.json` (ya existe array vacío).
- **TASK-US21-02** Crear componente `rating-form` con selector de 5 estrellas y botón confirmar.
- **TASK-US21-03** Implementar `POST /ratings` en un nuevo `TrustReputationApiService` (o extender el existente).
- **TASK-US21-04** Integrar `rating-form` en la vista `RIDE_COMPLETED` del pasajero.
- **TASK-US21-05** Actualizar promedio del conductor en `drivers` tras recibir calificación.

---

## US-22 — Calificación post-viaje al pasajero

- **Estado actual:** Pending (Deferred en Sprint 2)
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- Al finalizar el viaje, el conductor puede calificar al pasajero de 1 a 5 estrellas.
- Si la calificación es 1 o 2, se habilita un campo opcional de comentario.

### User Tasks

- **TASK-US22-01** Integrar `rating-form` en la vista `RIDE_COMPLETED` del conductor.
- **TASK-US22-02** Habilitar campo de comentario condicional (para puntuación ≤ 2).
- **TASK-US22-03** Registrar calificación del pasajero con `POST /ratings`.
- **TASK-US22-04** Actualizar promedio del pasajero en `users` o `profiles`.

---

## US-23 — Visualización del puntaje de reputación

- **Estado actual:** Placeholder (Out of Sprint Core en Sprint 2)
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El usuario ve su puntaje promedio en estrellas y número de calificaciones en su perfil.
- Si no tiene calificaciones, se muestra mensaje indicativo.

### User Tasks

- **TASK-US23-01** Extender `profile-page` para mostrar sección de reputación.
- **TASK-US23-02** Consumir `GET /ratings?ratedUserId={id}` para calcular promedio.
- **TASK-US23-03** Mostrar estrellas visuales (☆/★) y conteo.
- **TASK-US23-04** Mostrar placeholder "Aún no tienes calificaciones" cuando corresponda.

---

# 5. Historial de viajes

## US-24 — Historial de viajes del pasajero

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El pasajero ve lista de viajes ordenados por fecha con origen, destino y precio.
- Si no hay viajes, muestra mensaje de historial vacío.

### User Tasks

- **TASK-US24-01** Crear componente `trip-history-page` (pasajero).
- **TASK-US24-02** Implementar `GET /rides?passengerId={id}&_sort=fecha&_order=desc` en `RideDispatchApiService`.
- **TASK-US24-03** Agregar ruta `/passenger/trips` (ya existe en el nav del sidebar, pero no tiene ruta).
- **TASK-US24-04** Crear tarjetas de viaje mostrando: fecha, origen, destino, tarifa, estado.
- **TASK-US24-05** Manejar estado vacío con mensaje + CTA de "Solicitar viaje".

---

## US-25 — Historial de viajes del conductor

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El conductor ve lista de carreras con fecha, origen, destino, tarifa y comisión.
- Si no hay carreras, muestra mensaje de historial vacío.

### User Tasks

- **TASK-US25-01** Crear componente `trip-history-page` (conductor).
- **TASK-US25-02** Implementar `GET /rides?driverId={id}&_sort=fecha&_order=desc`.
- **TASK-US25-03** Agregar ruta `/driver/trips` en el driver layout.
- **TASK-US25-04** Agregar nav item "Historial" en el sidebar del conductor.
- **TASK-US25-05** Crear tarjetas mostrando: fecha, origen, destino, tarifa cobrada, comisión (5%).

---

# 6. Admin Panel

## US-06 — Verificación de documentos del conductor

- **Estado actual:** Partial (datos en db.json según Sprint 2)
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El admin ve lista de conductores pendientes de verificación.
- Puede aprobar o rechazar documentos con un motivo (en caso de rechazo).

### User Tasks

- **TASK-US06-01** Crear componente `admin-drivers-page` con tabla/lista de conductores.
- **TASK-US06-02** Filtrar por `verificationStatus: PENDING_VERIFICATION`.
- **TASK-US06-03** Implementar acciones `approveDriver(id)` y `rejectDriver(id, reason)`.
- **TASK-US06-04** Actualizar `PATCH /drivers/{id}` para cambiar `verificationStatus`.
- **TASK-US06-05** Agregar ruta `/admin/drivers` en el admin dashboard.

---

## US-20 — Configuración de tarifas por el administrador

- **Estado actual:** Pending (Out of Sprint Core en Sprint 2)
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El admin ve formulario con tarifa base, precio por km y precio mínimo.
- Puede guardar cambios que se aplican a nuevos cálculos.
- Valores inválidos muestran error.

### User Tasks

- **TASK-US20-01** Crear componente `admin-fare-config-page` con formulario reactivo.
- **TASK-US20-02** Implementar `PUT /fareConfig/{id}` en `MonetizationApiService`.
- **TASK-US20-03** Validar que valores sean > 0 antes de enviar.
- **TASK-US20-04** Agregar ruta `/admin/fare-config`.
- **TASK-US20-05** Mostrar confirmación tras guardado exitoso.

---

## US-26 — Panel de administración de conductores

- **Estado actual:** Pending
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El admin ve todos los conductores con nombre, estado, calificación y saldo.
- Puede habilitar o deshabilitar conductores.

### User Tasks

- **TASK-US26-01** Extender `admin-drivers-page` para listar TODOS los conductores.
- **TASK-US26-02** Agregar toggle de habilitar/deshabilitar (`isEnabled`).
- **TASK-US26-03** Implementar `PATCH /drivers/{id}` para cambiar `isEnabled`.
- **TASK-US26-04** Mostrar indicadores visuales de estado (activo, bloqueado, pendiente).

---

### Estructura de archivos — Admin

```
src/app/admin/
├── application/
│   └── admin.store.ts
├── presentation/
│   ├── pages/
│   │   ├── admin-dashboard/            # Ya existe como placeholder
│   │   ├── admin-drivers-page/
│   │   └── admin-fare-config-page/
│   └── components/
│       ├── drivers-table/
│       ├── driver-verification-card/
│       └── fare-config-form/
└── infrastructure/
    └── admin-api.service.ts
```

### Rutas nuevas (bajo layout admin)

```typescript
{
  path: 'admin',
  loadComponent: () => import('./admin/.../admin-dashboard').then(...)
  children: [
    { path: 'drivers', loadComponent: ... },
    { path: 'fare-config', loadComponent: ... },
  ]
}
```

---

# 7. Monetization — Historias diferidas del Sprint 2

## US-30 — Historial de transacciones del wallet

- **Estado actual:** Pending (Deferred en Sprint 2)
- **Readiness:** **Ready for UI**

### Acceptance Criteria

- El conductor ve lista de transacciones con fecha, tipo, monto y saldo resultante.
- Puede filtrar por tipo (recarga / comisión).
- Si no hay movimientos, muestra mensaje indicativo.

### User Tasks

- **TASK-US30-01** Crear colección `walletTransactions` en `db.json`.
- **TASK-US30-02** Implementar `GET /walletTransactions?walletId={id}` en `MonetizationApiService` (actualmente es stub).
- **TASK-US30-03** Crear componente `transaction-history` con lista de movimientos.
- **TASK-US30-04** Integrar en `monetization-page` (reemplazando el placeholder actual).
- **TASK-US30-05** Agregar filtro por tipo (`TOP_UP`, `COMMISSION`) usando query params de json-server.
- **TASK-US30-06** Manejar estado vacío con mensaje "Aún no tienes movimientos".

---

## US-27 — Recarga del wallet (Placeholder / Mock)

- **Estado actual:** Deferred (requiere Stripe backend)
- **Readiness:** **Ready for Mock UI**

### Redefinición funcional para Sprint 3

La recarga real mediante Stripe requiere backend. Para el frontend, se implementará un **mock de recarga** que:
- Muestra un formulario de monto
- Simula la recarga mediante `POST /walletTransactions` y `PATCH /wallets/{id}`
- Actualiza el saldo en el store reactivamente

### Acceptance Criteria (Mock)

- El conductor ve un formulario para ingresar monto a recargar.
- Al confirmar, el saldo se actualiza simulando una recarga exitosa.
- La transacción se registra en el historial.

### User Tasks

- **TASK-US27-01** Crear componente `recharge-form` con input de monto y botón confirmar.
- **TASK-US27-02** Implementar lógica mock: `POST /walletTransactions` tipo `TOP_UP` + `PATCH /wallets/{id}` para actualizar saldo.
- **TASK-US27-03** Integrar `recharge-form` en `monetization-page`.
- **TASK-US27-04** Mostrar feedback visual tras recarga exitosa (saldo actualizado).
- **TASK-US27-05** Validar monto mínimo (ej. S/ 5.00).

---

## US-29 — Descuento automático de comisión por viaje

- **Estado actual:** Pending (Deferred en Sprint 2)
- **Readiness:** **Mostly Backend — Frontend solo requiere reflejar el descuento**

### Redefinición funcional

El descuento real del 5% es lógica de backend. Para frontend, al marcar un viaje como `COMPLETED`, se debe:
- Simular el descuento restando el 5% del wallet en `db.json`
- Registrar la transacción en `walletTransactions`
- Reflejar el nuevo saldo en la UI

### User Tasks

- **TASK-US29-01** En `RideDispatchStore.onCompleteRide()`, tras cambiar estado a `COMPLETED`, ejecutar lógica mock de descuento.
- **TASK-US29-02** `PATCH /wallets/{driverId}` restando el 5% de la tarifa.
- **TASK-US29-03** `POST /walletTransactions` con tipo `COMMISSION`.
- **TASK-US29-04** Actualizar `MonetizationStore.wallet` reactivamente tras el descuento.
- **TASK-US29-05** Mostrar notificación visual: "Comisión de S/ X.XX descontada".

---

# 8. Mejora de sincronización (Opcional)

## US-10 / US-11 — Polling ligero para aceptación/rechazo

- **Estado actual:** Simplified (refresh manual en Sprint 2)
- **Readiness:** **Ready for Polling Enhancement**

### Redefinición funcional

En lugar de solo refresh manual, se puede implementar **polling ligero** con `setInterval` cada 5-8 segundos mientras la solicitud está en estado `SEARCHING_DRIVER` o `CANDIDATES_AVAILABLE`.

### User Tasks

- **TASK-POLL-01** En `passenger-request-page`, iniciar polling cuando `uiState` sea `WAITING_CANDIDATES`.
- **TASK-POLL-02** Detener polling cuando el estado cambie a `CANDIDATES_AVAILABLE`, `DRIVER_SELECTED`, o `ERROR`.
- **TASK-POLL-03** Usar `interval(5000)` de RxJS en lugar de `setInterval` para mejor integración con Angular.
- **TASK-POLL-04** Mostrar indicador visual de "Actualizando automáticamente...".

> **Nota:** Esta mejora es opcional. Si el tiempo del sprint no lo permite, se mantiene el refresh manual del Sprint 2.

---

# Ready & Fully Implemented (Sprint 3)

Al finalizar el Sprint 3, las siguientes historias deberían estar completas:

1. **US-31 a US-38** — Landing Page completa (8 secciones)
2. **US-01** — Registro de pasajero
3. **US-02** — Registro de conductor
4. **US-04** — Gestión de perfil
5. **US-05** — Cierre de sesión (verificación)
6. **US-18** — Cancelación de viaje
7. **US-21** — Calificación post-viaje al conductor
8. **US-22** — Calificación post-viaje al pasajero
9. **US-23** — Visualización del puntaje de reputación
10. **US-24** — Historial de viajes del pasajero
11. **US-25** — Historial de viajes del conductor
12. **US-06** — Verificación de documentos (admin)
13. **US-20** — Configuración de tarifas (admin)
14. **US-26** — Panel de administración de conductores
15. **US-30** — Historial de transacciones del wallet
16. **US-27** — Recarga del wallet (mock)
17. **US-29** — Descuento automático de comisión (frontend mock)

---

# Resumen de archivos a crear/modificar

| Bounded Context | Archivos nuevos | Archivos a modificar |
|---|---|---|
| **Landing** | `landing-page.ts`, 8 section components, `landing.store.ts` | `app.routes.ts` |
| **IAM** | `register-passenger-form`, `register-driver-form`, `profile-page`, `profile-edit-form` | `iam-api.service.ts`, `iam.store.ts`, `app.routes.ts`, layouts |
| **Ride Dispatch** | — | `ride-dispatch.store.ts`, `passenger-request-page`, `driver-dashboard-page` |
| **Trust & Reputation** | `rating-form` component | `trust-reputation-api.service.ts`, passenger/driver pages |
| **Historial** | `trip-history-page` (x2) | `ride-dispatch-api.service.ts`, `app.routes.ts`, driver layout |
| **Admin** | `admin-drivers-page`, `admin-fare-config-page`, `drivers-table`, `driver-verification-card`, `fare-config-form`, `admin.store.ts`, `admin-api.service.ts` | `app.routes.ts` |
| **Monetization** | `transaction-history`, `recharge-form` | `monetization-api.service.ts`, `monetization.store.ts`, `monetization-page`, `ride-dispatch.store.ts` |

---

# Conclusión

El Sprint 3 completa la experiencia frontend del proyecto ChapaTuRuta, cubriendo las 17 user stories y mejoras que quedaron fuera del Sprint 2. El esfuerzo se distribuye en:

- **Landing Page** — ~35% del esfuerzo (8 secciones estáticas/interactivas)
- **IAM + Admin** — ~25% del esfuerzo (registro, perfil, admin panel)
- **Historial + Ratings** — ~20% del esfuerzo (vistas de datos + formularios)
- **Monetization** — ~15% del esfuerzo (transacciones, recarga mock, comisión)
- **Polling (opcional)** — ~5% del esfuerzo

La estrategia de fake API se mantiene, y el refresh manual sigue siendo el mecanismo principal de sincronización, con polling ligero como mejora opcional.
