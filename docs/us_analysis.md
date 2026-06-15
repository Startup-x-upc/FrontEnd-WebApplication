# Análisis de User Stories — Estado Frontend

> Análisis de las US-01 a US-38 respecto a la implementación actual en el frontend Angular.

## Leyenda de estados

| Icono | Estado |
|-------|--------|
| ✅ | Implementado |
| ⚠️ | Parcialmente implementado |
| ❌ | No implementado en frontend |
| 🔲 | N/A Frontend (solo backend / landing page) |

---

## EP-01 — Gestión de Identidad y Acceso

| US | Título | Estado | Observación |
|----|--------|--------|-------------|
| US-01 | Registro de pasajero | ✅ | Formulario en `register-passenger-form`, ruta `/register/passenger` |
| US-02 | Registro de conductor | ✅ | Formulario en `register-driver-form` con campos brevete y SOAT |
| US-03 | Inicio de sesión | ✅ | `login-form` con redirección según rol |
| US-04 | Gestión de perfil | ✅ | `profile-page` con vista + edición. Conductor muestra brevete, SOAT, estado verificación, estado operativo, vehículo |
| US-05 | Cierre de sesión | ✅ | Presente en layouts de pasajero y conductor |
| US-06 | Verificación de documentos del conductor | ✅ | Panel admin con `driver-verification-card` y tabla de conductores |

---

## EP-02 — Gestión de Viajes

| US | Título | Estado | Observación |
|----|--------|--------|-------------|
| US-13 | Activar/desactivar disponibilidad | ✅ | Toggle en `driver-dashboard-page` con validación de saldo |
| US-14 | Visualización de solicitudes disponibles | ✅ | Lista de `pending-request-card` con vista detalle |
| US-15 | Solicitud de viaje (pasajero) | ✅ | `passenger-request-page` con mapa, formulario ubicación y confirmación |
| US-16 | Aceptación de solicitud (conductor) | ✅ | Flujo de postulación del conductor con candidatura y selección por pasajero |
| US-17 | Inicio y finalización del viaje | ✅ | Stepper vertical completo: en camino → llegué → iniciar → finalizar |
| US-18 | Cancelación de viaje | ❌ | **No existe botón de cancelar viaje ni en pasajero ni en conductor.** El backend tiene la entidad `CANCELLED`, pero no hay UI para invocarlo |

> [!WARNING]
> **US-18 (Cancelación de viaje)** es la única US de gestión de viajes completamente ausente en la UI. El modelo de dominio sí contempla `cancel()` y el estado `CANCELLED`, pero no hay botón ni flujo en ninguna de las dos vistas.

---

## EP-03 — Geolocalización y Notificaciones

| US | Título | Estado | Observación |
|----|--------|--------|-------------|
| US-07 | Detección automática de ubicación | ✅ | Geolocalización del navegador integrada en `trip-location-form` |
| US-08 | Selección de destino en el mapa | ✅ | Click en `trip-map` (Leaflet) establece origen/destino |
| US-09 | Visualización de conductores cercanos | ⚠️ | Componente `trip-availability-summary` existe pero no muestra marcadores de conductores en el mapa en tiempo real |
| US-10 | Notificación de aceptación de viaje | ⚠️ | El flujo funciona con polling manual ("Actualizar estado"). Sin integración real-time via Ably aún |
| US-11 | Notificación de rechazo de solicitud | ⚠️ | No hay notificación real-time. El estado `REQUEST_EXPIRED` cubre parcialmente el caso |
| US-12 | Ubicación del pasajero para el conductor | ⚠️ | El conductor ve el mapa con origen/destino, pero no la ubicación en tiempo real del pasajero |

> [!NOTE]
> Las US-10, US-11 y US-12 dependen de la integración con **Ably** para tiempo real. Actualmente funcionan con polling manual (botón "Actualizar estado"). La integración real-time está pendiente.

---

## EP-04 — Tarifas y Calificaciones

| US | Título | Estado | Observación |
|----|--------|--------|-------------|
| US-19 | Cálculo de tarifa por distancia | ✅ | `fare-summary-card` muestra precio estimado y distancia |
| US-20 | Configuración de tarifas (admin) | ⚠️ | El link `/admin/fare-config` existe en el sidebar del admin, pero **no hay ruta registrada** ni componente de configuración de tarifas en `app.routes.ts` |
| US-21 | Calificación post-viaje al conductor | ❌ | **Componentes existen** (`rating-form`, `rating-summary`, `reputation-badge`) y el store tiene toda la lógica, pero **NO están integrados en la pantalla de viaje completado** del pasajero |
| US-22 | Calificación post-viaje al pasajero | ❌ | Misma situación: la lógica está en `TrustReputationStore.submitPassengerRating()` pero no se invoca desde la UI del conductor al completar viaje |
| US-23 | Visualización del puntaje de reputación | ⚠️ | El perfil del **conductor** muestra rating promedio y cantidad. El perfil del **pasajero** no muestra reputación |

> [!IMPORTANT]
> **US-21 y US-22 (Calificaciones post-viaje)** son las US más importantes que faltan integrar. Todo el backend del bounded context `trust-reputation` está construido (store, API service, componentes de presentación), pero **ningún componente se usa** en las pantallas de viaje completado. Esto afecta directamente al flujo de Trust & Reputation.

---

## EP-05 — Historial y Administración

| US | Título | Estado | Observación |
|----|--------|--------|-------------|
| US-24 | Historial de viajes del pasajero | ✅ | `trip-history-page` accesible en `/passenger/trips` |
| US-25 | Historial de viajes del conductor | ✅ | `trip-history-page` reutilizado en `/driver/trips` |
| US-26 | Panel de administración de conductores | ✅ | `drivers-management-page` con tabla y acciones |

---

## EP-06 — Landing Page

| US | Título | Estado | Observación |
|----|--------|--------|-------------|
| US-31 | Sección Hero con CTA | 🔲 | Landing Page separado, no parte de esta app Angular |
| US-32 | Sección ¿Cómo funciona? | 🔲 | Landing Page separado |
| US-33 | Sección beneficios por segmento | 🔲 | Landing Page separado |
| US-34 | Sección de tarifas | 🔲 | Landing Page separado |
| US-35 | Sección de testimonios | 🔲 | Landing Page separado |
| US-36 | Sección About the Product | 🔲 | Landing Page separado |
| US-37 | Sección About the Team | 🔲 | Landing Page separado |
| US-38 | Sección CTA final | 🔲 | Landing Page separado |

> [!NOTE]
> Las US-31 a US-38 corresponden al Landing Page, que es un proyecto frontend separado. No aplican a esta aplicación Angular.

---

## EP-07 — Wallet y Pagos

| US | Título | Estado | Observación |
|----|--------|--------|-------------|
| US-27 | Recarga del wallet mediante Stripe | ✅ | `recharge-form` con integración Stripe en `monetization-page` |
| US-28 | Visualización del saldo del wallet | ✅ | `wallet-balance-card` visible en dashboard y wallet page |
| US-29 | Descuento automático de comisión | ✅ | Procesado en backend; reflejado en UI tras completar viaje |
| US-30 | Historial de transacciones del wallet | ✅ | `transaction-history` en `/driver/wallet` |

---

## Resumen General

| Categoría | Total | ✅ | ⚠️ | ❌ | 🔲 |
|-----------|-------|----|----|----|----|
| EP-01 Identidad y Acceso | 6 | 6 | 0 | 0 | 0 |
| EP-02 Gestión de Viajes | 6 | 5 | 0 | **1** | 0 |
| EP-03 Geolocalización | 6 | 2 | 4 | 0 | 0 |
| EP-04 Tarifas y Calificaciones | 5 | 1 | 2 | **2** | 0 |
| EP-05 Historial y Admin | 3 | 3 | 0 | 0 | 0 |
| EP-06 Landing Page | 8 | 0 | 0 | 0 | 8 |
| EP-07 Wallet y Pagos | 4 | 4 | 0 | 0 | 0 |
| **Total (sin Landing)** | **30** | **21** | **6** | **3** | **0** |

---

## US Pendientes Prioritarias

### ❌ Faltantes (requieren desarrollo UI)

1. **US-18 — Cancelación de viaje**: Agregar botón de cancelar en ambas vistas (pasajero y conductor) antes del inicio del viaje
2. **US-21 — Calificación post-viaje al conductor**: Integrar `app-rating-form` en la pantalla `RIDE_COMPLETED` del pasajero
3. **US-22 — Calificación post-viaje al pasajero**: Integrar `app-rating-form` en la pantalla `RIDE_COMPLETED` del conductor

### ⚠️ Parciales (funcionalidad limitada)

4. **US-20 — Config tarifas admin**: Falta registrar la ruta y crear el componente de configuración
5. **US-23 — Puntaje de reputación**: Solo visible en perfil de conductor, falta en perfil de pasajero
6. **US-09/10/11/12 — Real-time con Ably**: Funcional con polling manual, pendiente la integración de tiempo real
