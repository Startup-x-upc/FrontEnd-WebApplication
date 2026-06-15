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
| US-18 | Cancelación de viaje | ✅ | Botón "Cancelar viaje" en ambas vistas (pasajero y conductor). El store libera al conductor automáticamente vía `getDriverAvailability` + `markDriverFree`, limpia coordenadas del pasajero, y `loadDriverAvailability` auto-detecta rides CANCELLED para limpiarlos |

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
| US-21 | Calificación post-viaje al conductor | ✅ | `app-rating-form` integrado en `passenger-request-page.html` (RIDE_COMPLETED). El pasajero califica al conductor tras finalizar el viaje |
| US-22 | Calificación post-viaje al pasajero | ✅ | `app-rating-form` integrado en `driver-dashboard-page.html` (RIDE_COMPLETED). El conductor califica al pasajero tras finalizar el viaje |
| US-23 | Visualización del puntaje de reputación | ⚠️ | El perfil del **conductor** muestra rating promedio y cantidad. El perfil del **pasajero** no muestra reputación |

> [!NOTE]
> **US-21 y US-22** están integradas en las pantallas de viaje completado de pasajero y conductor respectivamente. El bounded context `trust-reputation` (store, API service, `rating-form`) está completamente cableado en ambas vistas.

---

## EP-05 — Historial y Administración

| US | Título | Estado | Observación |
|----|--------|--------|-------------|
| US-24 | Historial de viajes del pasajero | ✅ | `trip-history-page` en `/passenger/trips`. Muestra fecha, nombre del conductor, tarifa, botón "Revisar ruta" (Google Maps con origen→destino) |
| US-25 | Historial de viajes del conductor | ✅ | `trip-history-page` en `/driver/trips`. Muestra fecha, nombre del pasajero, tarifa, comisión (5%), ganancia neta, botón "Revisar ruta" |
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
| EP-02 Gestión de Viajes | 6 | 6 | 0 | 0 | 0 |
| EP-03 Geolocalización | 6 | 2 | 4 | 0 | 0 |
| EP-04 Tarifas y Calificaciones | 5 | 3 | 2 | 0 | 0 |
| EP-05 Historial y Admin | 3 | 3 | 0 | 0 | 0 |
| EP-06 Landing Page | 8 | 0 | 0 | 0 | 8 |
| EP-07 Wallet y Pagos | 4 | 4 | 0 | 0 | 0 |
| **Total (sin Landing)** | **30** | **24** | **6** | **0** | **0** |

---

## US Pendientes Prioritarias

### ❌ Faltantes (requieren desarrollo UI)

*No hay US en estado ❌ actualmente.*

### ⚠️ Parciales (funcionalidad limitada)

1. **US-20 — Config tarifas admin**: Falta registrar la ruta y crear el componente de configuración
2. **US-23 — Puntaje de reputación**: Solo visible en perfil de conductor, falta en perfil de pasajero
3. **US-09/10/11/12 — Real-time con Ably**: Funcional con polling manual, pendiente la integración de tiempo real
