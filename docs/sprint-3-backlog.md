# Sprint 3 Backlog — ChapaTuRuta

Este documento sintetiza el **Sprint Backlog para el Sprint 3** del proyecto **ChapaTuRuta**, enfocado en la completitud de la aplicación frontend. La estrategia de desarrollo se apoya en un backend simulado mediante **Fake API (json-server)** y **refresh manual / polling ligero** para la sincronización de estados.

---

## 1. Resumen del Sprint Backlog

A continuación se presenta el cuadro resumen de las Historias de Usuario (US) incluidas en este sprint, organizadas por Bounded Context:

| ID | Historia de Usuario (US) | Bounded Context | Prioridad | Estimación (SP) | Estado Inicial |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **US-31** | Sección Hero con CTA diferenciado | Landing Page | Alta | 2 | Pendiente |
| **US-32** | Sección ¿Cómo funciona? | Landing Page | Media | 1 | Pendiente |
| **US-33** | Sección de beneficios por segmento | Landing Page | Media | 1 | Pendiente |
| **US-34** | Sección de tarifas | Landing Page | Alta | 2 | Pendiente |
| **US-35** | Sección de testimonios | Landing Page | Baja | 1 | Pendiente |
| **US-36** | Sección About the Product (Video) | Landing Page | Baja | 2 | Pendiente |
| **US-37** | Sección About the Team | Landing Page | Baja | 1 | Pendiente |
| **US-38** | Sección CTA final | Landing Page | Media | 1 | Pendiente |
| **US-01** | Registro de pasajero | IAM | Alta | 3 | Pendiente |
| **US-02** | Registro de conductor (con brevete y SOAT) | IAM | Alta | 3 | Pendiente |
| **US-04** | Gestión de perfil (editar nombre y foto) | IAM | Media | 2 | Pendiente |
| **US-05** | Cierre de sesión (Sign-Out) | IAM | Alta | 1 | Parcial (Verificación) |
| **US-18** | Cancelación de viaje (pasajero/conductor) | Ride Dispatch | Alta | 3 | Pendiente |
| **US-21** | Calificación post-viaje al conductor | Trust & Reputation | Media | 2 | Pendiente |
| **US-22** | Calificación post-viaje al pasajero (comentario ≤ 2★) | Trust & Reputation | Media | 2 | Pendiente |
| **US-23** | Visualización del puntaje de reputación en perfil | Trust & Reputation | Media | 2 | Pendiente |
| **US-24** | Historial de viajes del pasajero | Historial | Alta | 2 | Pendiente |
| **US-25** | Historial de viajes del conductor (con comisión) | Historial | Alta | 2 | Pendiente |
| **US-06** | Verificación de documentos del conductor | Admin Panel | Alta | 3 | Parcial (Soporte) |
| **US-20** | Configuración de tarifas por el administrador | Admin Panel | Media | 2 | Pendiente |
| **US-26** | Panel de administración de conductores (habilitar/deshabilitar) | Admin Panel | Alta | 3 | Pendiente |
| **US-30** | Historial de transacciones del wallet | Monetization | Media | 2 | Pendiente |
| **US-27** | Recarga del wallet (Mock con simulación de saldo) | Monetization | Alta | 3 | Pendiente |
| **US-29** | Descuento automático de comisión (simulación 5%) | Monetization | Alta | 2 | Pendiente |
| **US-10/11**| Polling ligero para aceptación/rechazo (Opcional) | Ride Dispatch | Baja | 2 | Opcional |

---

## 2. Detalle del Backlog y Tareas de Usuario (User Tasks)

### 2.1. Landing Page (EP-06)
*Punto de entrada público del producto. Implementación en formato scrollable de una sola página.*

* **US-31 — Sección Hero con CTA diferenciado**
  - **Criterios de Aceptación:** Título, subtítulo y botones de llamada a la acción ("Quiero viajar" y "Quiero manejar") dirigiendo a los registros correspondientes.
  - [ ] **TASK-US31-01** Crear componente `landing-page` con layout scrollable.
  - [ ] **TASK-US31-02** Crear componente `hero-section` con diseño premium de título, subtítulo y CTAs.
  - [ ] **TASK-US31-03** Conectar botones CTA a rutas `/register/passenger` y `/register/driver`.
  - [ ] **TASK-US31-04** Configurar ruta raíz (`/` o `/landing`) hacia la Landing Page.

* **US-32 — Sección ¿Cómo funciona?**
  - **Criterios de Aceptación:** Muestra 3 pasos ilustrados para pasajero y 3 para conductor usando íconos y textos.
  - [ ] **TASK-US32-01** Crear componente `how-it-works-section` con tabs/toggle (Pasajero / Conductor).
  - [ ] **TASK-US32-02** Diseñar y rellenar contenido para los 3 pasos de cada rol.
  - [ ] **TASK-US32-03** Integrar Material Icons para la iconografía de los pasos.

* **US-33 — Sección de beneficios por segmento**
  - **Criterios de Aceptación:** Muestra al menos 4 beneficios claros para cada rol en una grilla comparativa.
  - [ ] **TASK-US33-01** Crear componente `benefits-section` con estructura de grid de 2 columnas.
  - [ ] **TASK-US33-02** Definir beneficios específicos estilizados con íconos premium.

* **US-34 — Sección de tarifas**
  - **Criterios de Aceptación:** Detalla el modelo por distancia e incluye al menos 2 ejemplos con precios referenciales en soles.
  - [ ] **TASK-US34-01** Crear componente `pricing-section` explicando la fórmula simplificada.
  - [ ] **TASK-US34-02** Diseñar tarjetas de ejemplo de rutas comunes y precios calculados.
  - [ ] **TASK-US34-03** Incluir botón CTA de registro dentro de la sección.

* **US-35 — Sección de testimonios**
  - **Criterios de Aceptación:** Muestra un mínimo de 3 testimonios reales/mock que incluyan nombre, zona, foto y puntuación.
  - [ ] **TASK-US35-01** Crear componente `testimonials-section` con carrusel o cuadrícula.
  - [ ] **TASK-US35-02** Configurar mock de testimonios (3-5 registros).

* **US-36 — Sección About the Product**
  - **Criterios de Aceptación:** Integra un reproductor de video HTML5 con controles funcionales y manejo de errores.
  - [ ] **TASK-US36-01** Crear componente `about-product-section` usando la etiqueta `<video>` nativa.
  - [ ] **TASK-US36-02** Definir URL del video de demostración o embed externo.
  - [ ] **TASK-US36-03** Manejar fallas de carga con un mensaje de fallback amigable.

* **US-37 — Sección About the Team**
  - **Criterios de Aceptación:** Grid que expone foto, nombre y rol de los integrantes de CTR Technologies, con fallback de imagen en caso de error.
  - [ ] **TASK-US37-01** Crear componente `about-team-section`.
  - [ ] **TASK-US37-02** Definir la data estática del equipo en un archivo JSON o constante.
  - [ ] **TASK-US37-03** Manejar fallback automático a un avatar genérico.

* **US-38 — Sección CTA final**
  - **Criterios de Aceptación:** Un bloque final motivador al final del scroll con accesos directos al registro de ambos perfiles.
  - [ ] **TASK-US38-01** Crear componente `final-cta-section`.
  - [ ] **TASK-US38-02** Vincular los botones de registro a las rutas de IAM.

---

### 2.2. IAM (Identity & Access Management)
*Completar el registro diferenciado y la administración del perfil del usuario.*

* **US-01 — Registro de pasajero**
  - **Criterios de Aceptación:** Correo, contraseña y confirmación. Si el correo ya existe, muestra error. Redirección automática al login tras éxito.
  - [ ] **TASK-US01-01** Validar existencia de colección `users` en `db.json`.
  - [ ] **TASK-US01-02** Diseñar componente `register-passenger-form` con validaciones de formulario.
  - [ ] **TASK-US01-03** Implementar endpoint `POST /users` en el servicio `IamApiService`.
  - [ ] **TASK-US01-04** Crear validación de email duplicado vía `GET /users?email={email}` previa al registro.
  - [ ] **TASK-US01-05** Validar coincidencia de contraseña y confirmación.
  - [ ] **TASK-US01-06** Redirigir al login mostrando mensaje de éxito.

* **US-02 — Registro de conductor**
  - **Criterios de Aceptación:** Requiere brevete y SOAT. La cuenta se crea con estado `PENDING_VERIFICATION`.
  - [ ] **TASK-US02-01** Diseñar formulario `register-driver-form` agregando inputs para brevete y SOAT.
  - [ ] **TASK-US02-02** Ajustar `IamApiService` para enviar payload de conductor con estado inicial pendiente.
  - [ ] **TASK-US02-03** Configurar campos `verificationStatus` y `operationalStatus` en el esquema de conductores de `db.json`.
  - [ ] **TASK-US02-04** Validar campos obligatorios antes del envío.
  - [ ] **TASK-US02-05** Redirigir al login con mensaje explicativo sobre el estado de verificación.

* **US-04 — Gestión de perfil**
  - **Criterios de Aceptación:** Permite visualizar los datos y actualizar reactivamente el nombre de perfil y URL de la foto.
  - [ ] **TASK-US04-01** Crear componente `profile-page` accesible para pasajero y conductor.
  - [ ] **TASK-US04-02** Diseñar formulario `profile-edit-form` (nombre completo y foto).
  - [ ] **TASK-US04-03** Implementar `PUT /profiles/{id}` en `IamApiService`.
  - [ ] **TASK-US04-04** Configurar rutas hijas en los layouts de pasajero y conductor.
  - [ ] **TASK-US04-05** Integrar acción `updateProfile()` en `IamStore`.
  - [ ] **TASK-US04-06** Reflejar cambios en tiempo real en los sidebars o cabeceras de navegación.

* **US-05 — Cierre de sesión**
  - **Criterios de Aceptación:** Limpieza de datos en local storage y redirección a login. (Ya implementado, requiere validación).
  - [ ] **TASK-US05-01** Verificar botón de cerrar sesión en los headers/sidebars de ambos roles.
  - [ ] **TASK-US05-02** Confirmar que el store e historial de local storage quedan purgados tras el logout.
  - [ ] **TASK-US05-03** Validar redirección a `/login`.

---

### 2.3. Ride Dispatch
*Manejo del ciclo de vida del viaje.*

* **US-18 — Cancelación de viaje**
  - **Criterios de Aceptación:** Opción disponible para pasajero (antes de iniciar viaje) y conductor (tras haber aceptado). El estado pasa a `CANCELLED_BY_...`.
  - [ ] **TASK-US18-01** Crear acción `cancelRide(rideId, cancelledBy)` en `RideDispatchStore`.
  - [ ] **TASK-US18-02** Configurar petición `PATCH /rides/{id}` para actualizar el estado del viaje.
  - [ ] **TASK-US18-03** Agregar botón "Cancelar viaje" en la UI del pasajero al tener conductor asignado.
  - [ ] **TASK-US18-04** Agregar botón "Cancelar viaje" en el dashboard del conductor durante la etapa de asignación.
  - [ ] **TASK-US18-05** Implementar diálogo de confirmación emergente.
  - [ ] **TASK-US18-06** Actualizar las vistas correspondientes reactivamente al cancelar.

---

### 2.4. Trust & Reputation
*Sistema de calificaciones y reputación post-viaje.*

* **US-21 — Calificación post-viaje al conductor**
  - **Criterios de Aceptación:** Calificación de 1 a 5 estrellas al concluir el viaje, actualizando el promedio del conductor.
  - [ ] **TASK-US21-01** Configurar la colección `ratings` en `db.json`.
  - [ ] **TASK-US21-02** Diseñar componente interactivo `rating-form` (estrellas seleccionables).
  - [ ] **TASK-US21-03** Crear `TrustReputationApiService` con endpoint `POST /ratings`.
  - [ ] **TASK-US21-04** Integrar el modal de calificación al entrar en estado `RIDE_COMPLETED` del pasajero.
  - [ ] **TASK-US21-05** Implementar recálculo del promedio (`ratingAverage`) en el perfil del conductor.

* **US-22 — Calificación post-viaje al pasajero**
  - **Criterios de Aceptación:** El conductor califica al pasajero (1 a 5). Si es ≤ 2, habilita caja de texto obligatoria/opcional para justificar.
  - [ ] **TASK-US22-01** Integrar `rating-form` en la vista final del conductor.
  - [ ] **TASK-US22-02** Agregar campo de comentarios condicionado a bajas calificaciones.
  - [ ] **TASK-US22-03** Registrar calificación en `db.json` vía endpoint común de ratings.
  - [ ] **TASK-US22-04** Recalcular reputación del pasajero en su respectivo perfil.

* **US-23 — Visualización de reputación**
  - **Criterios de Aceptación:** Muestra el promedio de estrellas y la cantidad de calificaciones del usuario en su página de perfil.
  - [ ] **TASK-US23-01** Agregar sección de reputación visual en `profile-page`.
  - [ ] **TASK-US23-02** Consumir endpoint `GET /ratings?ratedUserId={id}` para computar los valores.
  - [ ] **TASK-US23-03** Mostrar estrellas de forma gráfica (ej. `★ ★ ★ ☆ ☆`).
  - [ ] **TASK-US23-04** Configurar mensaje de estado para usuarios nuevos sin calificaciones.

---

### 2.5. Historial de viajes
*Visualización histórica de los servicios realizados.*

* **US-24 — Historial de viajes del pasajero**
  - **Criterios de Aceptación:** Lista de viajes realizados ordenada por fecha descendente, detallando origen, destino, costo y estado.
  - [ ] **TASK-US24-01** Crear componente `trip-history-page` para pasajero.
  - [ ] **TASK-US24-02** Consumir `GET /rides?passengerId={id}&_sort=fecha&_order=desc` en `RideDispatchApiService`.
  - [ ] **TASK-US24-03** Configurar la ruta `/passenger/trips` en la navegación del sidebar.
  - [ ] **TASK-US24-04** Crear tarjetas de viaje responsivas para listar el historial.
  - [ ] **TASK-US24-05** Implementar vista de historial vacío con botón para iniciar nueva solicitud.

* **US-25 — Historial de viajes del conductor**
  - **Criterios de Aceptación:** Lista de viajes con origen, destino, tarifa y visualización de la comisión del 5% descontada.
  - [ ] **TASK-US25-01** Crear componente `trip-history-page` para conductor.
  - [ ] **TASK-US25-02** Consumir `GET /rides?driverId={id}&_sort=fecha&_order=desc`.
  - [ ] **TASK-US25-03** Configurar ruta `/driver/trips`.
  - [ ] **TASK-US25-04** Agregar enlace "Historial" en el panel lateral del conductor.
  - [ ] **TASK-US25-05** Diseñar tarjetas mostrando el desglose: Tarifa Cobrada, Comisión (5%) y Ganancia Neta.

---

### 2.6. Admin Panel
*Herramientas internas para la gestión operativa y de negocio.*

* **US-06 — Verificación de documentos del conductor**
  - **Criterios de Aceptación:** Panel para visualizar conductores en estado pendiente de validación y botones para aprobar o rechazar con motivo.
  - [ ] **TASK-US06-01** Crear vista `admin-drivers-page` con tabla de conductores pendientes.
  - [ ] **TASK-US06-02** Aplicar filtro de búsqueda de conductores con `verificationStatus: PENDING_VERIFICATION`.
  - [ ] **TASK-US06-03** Agregar acciones visuales `approveDriver(id)` y `rejectDriver(id, reason)`.
  - [ ] **TASK-US06-04** Implementar petición `PATCH /drivers/{id}` para actualizar estado de verificación.
  - [ ] **TASK-US06-05** Añadir ruta `/admin/drivers` al dashboard de administrador.

* **US-20 — Configuración de tarifas por el administrador**
  - **Criterios de Aceptación:** Formulario para modificar valores globales (tarifa base, precio por km, precio mínimo) con validaciones correspondientes.
  - [ ] **TASK-US20-01** Diseñar componente `admin-fare-config-page` con formularios reactivos de Angular.
  - [ ] **TASK-US20-02** Consumir y actualizar configuraciones vía `PUT /fareConfig/{id}` en `MonetizationApiService`.
  - [ ] **TASK-US20-03** Agregar validadores para impedir números negativos o nulos.
  - [ ] **TASK-US20-04** Configurar la ruta `/admin/fare-config`.
  - [ ] **TASK-US20-05** Mostrar confirmación emergente de guardado exitoso.

* **US-26 — Panel de administración de conductores**
  - **Criterios de Aceptación:** Lista totalitaria de conductores registrados, mostrando nombre, reputación, estado y un botón toggle para suspender/habilitar.
  - [ ] **TASK-US26-01** Extender `admin-drivers-page` para permitir visualizar a todos los conductores.
  - [ ] **TASK-US26-02** Implementar el control toggle `isEnabled` en la grilla de datos.
  - [ ] **TASK-US26-03** Configurar petición `PATCH /drivers/{id}` al cambiar el estado de habilitación.
  - [ ] **TASK-US26-04** Diseñar tags visuales de color (Verde: Activo, Amarillo: Pendiente, Rojo: Suspendido).

---

### 2.7. Monetization
*Monedero virtual y cobro de comisiones simulado.*

* **US-30 — Historial de transacciones del wallet**
  - **Criterios de Aceptación:** Lista de movimientos del conductor (ingresos por recargas, egresos por comisiones de viaje) con filtros por tipo.
  - [ ] **TASK-US30-01** Declarar esquema `walletTransactions` en `db.json`.
  - [ ] **TASK-US30-02** Consumir endpoint `GET /walletTransactions?walletId={id}` en `MonetizationApiService`.
  - [ ] **TASK-US30-03** Crear componente de lista `transaction-history`.
  - [ ] **TASK-US30-04** Reemplazar mock visual por datos reales del store en la página de Wallet.
  - [ ] **TASK-US30-05** Añadir filtros interactivos por tipo de transacción (`TOP_UP`, `COMMISSION`).
  - [ ] **TASK-US30-06** Diseñar el estado de historial vacío.

* **US-27 — Recarga del wallet (Mock UI)**
  - **Criterios de Aceptación:** Formulario de monto que, al confirmar, incrementa el saldo local y crea una transacción `TOP_UP` simulada.
  - [ ] **TASK-US27-01** Crear componente `recharge-form` con validación de montos (mínimo S/ 5.00).
  - [ ] **TASK-US27-02** Lógica mock: ejecutar `POST /walletTransactions` y `PATCH /wallets/{id}` para actualizar el saldo del conductor.
  - [ ] **TASK-US27-03** Renderizar el formulario en un modal dentro de la sección de billetera.
  - [ ] **TASK-US27-04** Notificar la recarga correcta actualizando el saldo visible inmediatamente.

* **US-29 — Descuento automático de comisión**
  - **Criterios de Aceptación:** Al completarse un viaje en el frontend, se calcula el 5% del valor total, se debita del wallet y se registra la transacción.
  - [ ] **TASK-US29-01** Interceptar la confirmación del viaje completado en `RideDispatchStore.onCompleteRide()`.
  - [ ] **TASK-US29-02** Disparar petición `PATCH /wallets/{driverId}` aplicando el descuento matemático.
  - [ ] **TASK-US29-03** Registrar el movimiento en el historial vía `POST /walletTransactions` con categoría `COMMISSION`.
  - [ ] **TASK-US29-04** Forzar sincronización de datos de `MonetizationStore` tras el cobro.
  - [ ] **TASK-US29-05** Mostrar mensaje emergente informando el descuento de comisión cobrado.

---

### 2.8. Mejora de sincronización (Opcional)
*Optimización de experiencia de usuario al prescindir de WebSockets/realtime real.*

* **US-10 / US-11 — Polling ligero para aceptación/rechazo**
  - **Criterios de Aceptación:** Implementar un mecanismo de actualización automática periódico durante la espera de asignación.
  - [ ] **TASK-POLL-01** Configurar bucle de consulta automática en `passenger-request-page` cuando el estado sea `WAITING_CANDIDATES`.
  - [ ] **TASK-POLL-02** Detener el bucle en cuanto cambie el estado de viaje a una etapa definitiva o error.
  - [ ] **TASK-POLL-03** Usar operador `interval(5000)` de RxJS para evitar fugas de memoria y garantizar la reactividad Angular.
  - [ ] **TASK-POLL-04** Diseñar y mostrar un loader discreto tipo "Actualizando estado..." en la pantalla de espera.

---

## 3. Resumen de Impacto Técnico (Archivos a Modificar / Crear)

El alcance del Sprint 3 involucra los siguientes módulos del frontend Angular:

| Contexto / Módulo | Archivos Nuevos | Archivos a Modificar |
| :--- | :--- | :--- |
| **Landing** | `landing-page.ts`, 8 componentes de secciones (hero, how-it-works, benefits, pricing, testimonials, about-product, about-team, final-cta), `landing.store.ts` | `app.routes.ts` |
| **IAM** | `register-passenger-form.ts`, `register-driver-form.ts`, `profile-page.ts`, `profile-edit-form.ts` | `iam-api.service.ts`, `iam.store.ts`, `app.routes.ts`, Sidebars/Layouts |
| **Ride Dispatch** | *(Ninguno)* | `ride-dispatch.store.ts`, `passenger-request-page.ts`, `driver-dashboard-page.ts` |
| **Trust & Reputation** | `rating-form.ts` (Componente genérico) | `trust-reputation-api.service.ts`, layouts del pasajero y del conductor |
| **Historial** | `trip-history-page.ts` (Dos implementaciones o componentes diferenciados) | `ride-dispatch-api.service.ts`, `app.routes.ts`, sidebar de conductor |
| **Admin** | `admin-drivers-page.ts`, `admin-fare-config-page.ts`, `drivers-table.ts`, `driver-verification-card.ts`, `fare-config-form.ts`, `admin.store.ts`, `admin-api.service.ts` | `app.routes.ts` |
| **Monetization** | `transaction-history.ts`, `recharge-form.ts` | `monetization-api.service.ts`, `monetization.store.ts`, `monetization-page.ts`, `ride-dispatch.store.ts` |
