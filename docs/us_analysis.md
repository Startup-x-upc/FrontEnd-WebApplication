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
| US-09 | Visualización de conductores cercanos | ⚠️ | Excluido del frontend web — requiere GPS nativo y rastreo real-time que no es práctico en navegador |
| US-10 | Notificación de aceptación de viaje | ✅ | Nombre real del conductor en tarjeta de seguimiento (enriquecido desde `getRideById`). El botón "Actualizar estado" sigue presente para refresco manual |
| US-11 | Notificación de rechazo de solicitud | ✅ | Chequeo de expiración en cada refresh manual: si pasaron >60s desde `createdAt`, se marca `isExpired=true` y se muestra la tarjeta "Solicitud vencida" |
| US-12 | Ubicación del pasajero para el conductor | ⚠️ | Excluido del frontend web — requiere GPS nativo y rastreo real-time que no es práctico en navegador |

> [!NOTE]
> Las US-10 y US-11 están implementadas con refresh manual. US-09 y US-12 se excluyen del alcance frontend web porque requieren geolocalización en tiempo real no viable sin GPS nativo. La integración con **Ably** para tiempo real está pendiente.

---

## EP-04 — Tarifas y Calificaciones

| US | Título | Estado | Observación |
|----|--------|--------|-------------|
| US-19 | Cálculo de tarifa por distancia | ✅ | `fare-summary-card` muestra precio estimado y distancia |
| US-20 | Configuración de tarifas (admin) | ✅ | `admin-fare-config-page` con formulario para editar tarifa base, precio/km y tarifa mínima. Ruta `/admin/fare-config` registrada. Write path completo (API PUT + store) |
| US-21 | Calificación post-viaje al conductor | ✅ | `app-rating-form` integrado en `passenger-request-page.html` (RIDE_COMPLETED). El pasajero califica al conductor tras finalizar el viaje |
| US-22 | Calificación post-viaje al pasajero | ✅ | `app-rating-form` integrado en `driver-dashboard-page.html` (RIDE_COMPLETED). El conductor califica al pasajero tras finalizar el viaje |
| US-23 | Visualización del puntaje de reputación | ✅ | `app-rating-summary` en perfil de ambos roles, `app-reputation-badge` en sidebars de pasajero y conductor. Driver dashboard usa reputación real del pasajero (ya no mock) |

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
| EP-03 Geolocalización | 6 | 4 | 2 | 0 | 0 |
| EP-04 Tarifas y Calificaciones | 5 | 5 | 0 | 0 | 0 |
| EP-05 Historial y Admin | 3 | 3 | 0 | 0 | 0 |
| EP-06 Landing Page | 8 | 0 | 0 | 0 | 8 |
| EP-07 Wallet y Pagos | 4 | 4 | 0 | 0 | 0 |
| **Total (sin Landing)** | **30** | **28** | **2** | **0** | **0** |

---

## US Pendientes Prioritarias

### ❌ Faltantes (requieren desarrollo UI)

*No hay US en estado ❌ actualmente.*

### ⚠️ Parciales (funcionalidad limitada)

1. **US-09 — Conductores cercanos en mapa**: Excluido del frontend web — requiere GPS nativo
2. **US-12 — Ubicación del pasajero para el conductor**: Excluido del frontend web — requiere GPS nativo
3. **Real-time con Ably**: US-10 y US-11 funcionan con refresh manual. La integración WebSocket/Ably para tiempo real está pendiente
