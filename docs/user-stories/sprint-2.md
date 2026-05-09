# SPRINT GOAL

**Demostrar el flujo principal pasajero → solicitud → conductor disponible → aceptación, usando json-server.**

---

## 1) IAM

### US-03 — Inicio de sesión

**Historia:** Como usuario registrado, deseo iniciar sesión con correo y contraseña, para acceder a mi cuenta según mi rol.
**Puntos:** 2

**Acceptance criteria**

- [x] Si el usuario ingresa credenciales correctas, accede a la plataforma y es redirigido según su rol.
- [x] Si ingresa credenciales incorrectas, el sistema muestra un mensaje de error genérico.

**Tasks**

- [X ] `TASK-US03-01` Crear colección `users` y `profiles` en `db.json` con datos seed para pasajero y conductor.
- [ X] `TASK-US03-02` Crear `account.entity.ts` y `profile.entity.ts` en `iam/domain/model`.
- [ X] `TASK-US03-03` Crear DTOs `auth-response.ts` y `profile-response.ts` en `iam/infrastructure`.
- [ X] `TASK-US03-04` Crear `account-assembler.ts` y `profile-assembler.ts`.
- [ X] `TASK-US03-05` Implementar `iam-api.service.ts` con método `signIn(email, password)` usando json-server.
- [ X] `TASK-US03-06` Implementar `iam.store.ts` con señales `currentUser`, `isAuthenticated`, `role`.
- [X ] `TASK-US03-07` Crear componente `login-form` en `iam/presentation/components`.
- [ X] `TASK-US03-08` Implementar redirección por rol después del login.
- [ X] `TASK-US03-09` Implementar mensaje de error cuando no coincidan credenciales.
- [ X] `TASK-US03-10` Persistir sesión mock en `localStorage`.

### US-04 — Gestión de perfil

**Historia:** Como usuario, deseo visualizar y editar mi perfil, para mantener mis datos actualizados en la plataforma.
**Puntos:** 3

**Acceptance criteria**

- [x] El usuario visualiza nombre, correo, foto y, si es conductor, sus documentos registrados.
- [x] Si modifica nombre o foto, la información se actualiza y se refleja correctamente.

**Tasks**

- [ ] `TASK-US04-01` Ampliar `profiles` en `db.json` con `fullName`, `email`, `photoUrl`.
- [ ] `TASK-US04-02` Agregar lectura de perfil en `iam-api.service.ts`.
- [ ] `TASK-US04-03` Agregar `loadProfile(userId)` en `iam.store.ts`.
- [ ] `TASK-US04-04` Crear componente `profile-summary`.
- [ ] `TASK-US04-05` Crear formulario básico de edición de perfil.
- [ ] `TASK-US04-06` Implementar actualización mock de nombre y foto.
- [ ] `TASK-US04-07` Refrescar el store luego de editar.

> **Nota de sprint:** Si quieres mantener el sprint más acotado, esta US puede quedar como soporte, no como núcleo.

---

## 2) Ride Dispatch

### US-07 — Detección automática de ubicación del pasajero

**Historia:** Como pasajero, deseo que el sistema detecte mi ubicación al ingresar, para solicitar un viaje sin ingresarla manualmente.
**Puntos:** 3

**Acceptance criteria**

- [x] Si el pasajero acepta permisos, el sistema detecta su ubicación actual y la muestra como punto de origen.
- [x] Si deniega permisos, el sistema solicita ingresar manualmente el punto de origen.

**Tasks**

- [ ] `TASK-US07-01` Crear `ride-request.entity.ts` con campos base `origin`, `destination`, `status`.
- [ ] `TASK-US07-02` Crear estado inicial del origen en `ride-dispatch.store.ts`.
- [ ] `TASK-US07-03` Implementar `detectOrigin()` usando geolocalización del navegador.
- [ ] `TASK-US07-04` Implementar fallback manual si se deniegan permisos.
- [ ] `TASK-US07-05` Crear componente visual para mostrar origen actual.
- [ ] `TASK-US07-06` Guardar origen detectado en el store.

### US-08 — Selección de destino en el mapa

**Historia:** Como pasajero, deseo seleccionar mi destino en el mapa, para que el sistema calcule la ruta y el precio estimado.
**Puntos:** 3

**Acceptance criteria**

- [x] Si el pasajero selecciona un destino válido, el sistema traza ruta y muestra precio estimado.
- [x] Si el destino está fuera de cobertura, el sistema lo informa.

**Tasks**

- [ ] `TASK-US08-01` Añadir `destination` al modelo `ride-request.entity.ts`.
- [ ] `TASK-US08-02` Implementar `setDestination()` en `ride-dispatch.store.ts`.
- [ ] `TASK-US08-03` Crear componente o mock visual para seleccionar destino.
- [ ] `TASK-US08-04` Validar zona de cobertura mock.
- [ ] `TASK-US08-05` Disparar cálculo de tarifa estimada al definir destino.
- [ ] `TASK-US08-06` Mostrar resumen de origen, destino y distancia estimada.

### US-13 — Activar y desactivar disponibilidad del conductor

**Historia:** Como conductor, deseo activar o desactivar mi disponibilidad, para recibir o dejar de recibir solicitudes.
**Puntos:** 3

**Acceptance criteria**

- [x] Si el conductor tiene saldo y activa disponibilidad, aparece en el mapa para pasajeros cercanos.
- [x] Si intenta activarse con saldo cero, el sistema se lo impide y le pide recargar.

**Tasks**

- [ ] `TASK-US13-01` Crear colección `driverAvailability` en `db.json`.
- [ ] `TASK-US13-02` Crear `driver-availability.entity.ts`.
- [ ] `TASK-US13-03` Crear `driver-availability-response.ts` y assembler.
- [ ] `TASK-US13-04` Implementar `toggleAvailability(driverId)` en `ride-dispatch-api.service.ts`.
- [ ] `TASK-US13-05` Implementar `toggleAvailability()` en `ride-dispatch.store.ts`.
- [ ] `TASK-US13-06` Integrar validación contra wallet mock antes de activar.
- [ ] `TASK-US13-07` Crear UI con switch o botón para conductor.
- [ ] `TASK-US13-08` Reflejar estado disponible/no disponible en la vista.

### US-14 — Visualización de solicitudes de viaje disponibles

**Historia:** Como conductor, deseo ver en tiempo real las solicitudes cercanas, para decidir cuál aceptar.
**Puntos:** 3

**Acceptance criteria**

- [x] Si el conductor está disponible y existe una solicitud cercana, la ve con origen, destino y precio estimado.
- [x] Si no hay solicitudes, el sistema muestra que está en espera.

**Tasks**

- [ ] `TASK-US14-01` Crear colección `rideRequests` en `db.json`.
- [ ] `TASK-US14-02` Crear `ride-request-response.ts` y assembler.
- [ ] `TASK-US14-03` Implementar `getOpenRideRequestsForDriver(driverId)` en API service.
- [ ] `TASK-US14-04` Implementar `loadDriverRequests(driverId)` en store.
- [ ] `TASK-US14-05` Crear componente `driver-request-list`.
- [ ] `TASK-US14-06` Mostrar mensaje vacío cuando no existan solicitudes.
- [ ] `TASK-US14-07` Simular refresco manual o polling simple con fake API.

### US-15 — Solicitud de viaje por parte del pasajero

**Historia:** Como pasajero, deseo confirmar mi solicitud tras revisar origen, destino y precio, para que los conductores cercanos puedan atenderla.
**Puntos:** 5

**Acceptance criteria**

- [x] Si el pasajero confirma con origen, destino y precio, el sistema registra la solicitud y la distribuye a conductores cercanos.
- [x] Si no hay conductores disponibles, el sistema notifica que debe reintentar.

**Tasks**

- [ ] `TASK-US15-01` Extender `ride-request.entity.ts` con `passengerId`, `estimatedFare`, `status`.
- [ ] `TASK-US15-02` Implementar `createRideRequest()` en `ride-dispatch-api.service.ts`.
- [ ] `TASK-US15-03` Implementar `submitRideRequest()` en `ride-dispatch.store.ts`.
- [ ] `TASK-US15-04` Validar que existan `origin`, `destination` y `estimatedFare` antes de enviar.
- [ ] `TASK-US15-05` Verificar en fake API si existen conductores activos.
- [ ] `TASK-US15-06` Guardar request con estado `pending`.
- [ ] `TASK-US15-07` Crear pantalla o card de confirmación previa al envío.
- [ ] `TASK-US15-08` Mostrar feedback de request creada o de ausencia de conductores.

### US-16 — Aceptación de solicitud de viaje por el conductor

**Historia:** Como conductor, deseo aceptar una solicitud, para confirmar al pasajero que me dirijo al punto de recojo.
**Puntos:** 3

**Acceptance criteria**

- [x] Si el conductor acepta una solicitud disponible, el sistema asigna el viaje y notifica al pasajero con los datos del conductor.
- [x] Si otro conductor ya la tomó, el sistema informa que ya no está disponible.

**Tasks**

- [ ] `TASK-US16-01` Crear colección `rides` en `db.json`.
- [ ] `TASK-US16-02` Crear `ride.entity.ts` y `ride-response.ts`.
- [ ] `TASK-US16-03` Implementar `acceptRideRequest(requestId, driverId)` en API service.
- [ ] `TASK-US16-04` Implementar `acceptRequest()` en store.
- [ ] `TASK-US16-05` Al aceptar, actualizar `rideRequests.status = accepted`.
- [ ] `TASK-US16-06` Crear registro en `rides`.
- [ ] `TASK-US16-07` Mostrar al pasajero el estado “conductor asignado”.
- [ ] `TASK-US16-08` Validar conflicto si la solicitud ya fue aceptada por otro.

### US-09 — Visualización de conductores cercanos en el mapa

**Historia:** Como pasajero, deseo ver los conductores disponibles cerca de mí en el mapa, para identificar opciones de transporte.
**Puntos:** 3

**Acceptance criteria resumido**

- [x] Si hay conductores activos, se muestran en el mapa.
- [x] Si no hay conductores, se muestra mensaje correspondiente.

**Tasks**

- [ ] `TASK-US09-01` Implementar `getNearbyDrivers(origin)` en API service.
- [ ] `TASK-US09-02` Implementar `loadNearbyDrivers()` en store.
- [ ] `TASK-US09-03` Crear componente visual de mapa/lista mock.
- [ ] `TASK-US09-04` Pintar rating y estado del conductor usando data mock.
- [ ] `TASK-US09-05` Manejar estado vacío.

> **Nota de sprint:** Esta US puede ir como stretch goal del sprint si ves que el core ya está bien encaminado.

---

## 3) Monetization

### US-19 — Cálculo de tarifa por distancia

**Historia:** Como pasajero, deseo ver el precio estimado calculado por distancia, para conocer el costo antes de confirmar el viaje.
**Puntos:** 3

**Acceptance criteria**

- [x] Si el pasajero selecciona origen y destino, el sistema calcula la distancia y aplica tarifa base + precio por km, respetando el mínimo.
- [x] Si la distancia es muy corta, se aplica el precio mínimo.

**Tasks**

- [ ] `TASK-US19-01` Crear colección `fareConfig` en `db.json`.
- [ ] `TASK-US19-02` Crear `fare-policy.entity.ts`.
- [ ] `TASK-US19-03` Crear `fare-config-response.ts` y assembler.
- [ ] `TASK-US19-04` Implementar `getFareConfig()` en `monetization-api.service.ts`.
- [ ] `TASK-US19-05` Implementar `loadFareConfig()` en `monetization.store.ts`.
- [ ] `TASK-US19-06` Implementar `calculateEstimatedFare(distance)` en store.
- [ ] `TASK-US19-07` Integrar cálculo con US-08.
- [ ] `TASK-US19-08` Mostrar tarifa estimada en la pantalla previa a enviar la solicitud.

### US-28 — Visualización del saldo del wallet

**Historia:** Como conductor, deseo ver mi saldo del wallet en todo momento, para saber cuánto tengo disponible antes de activarme.
**Puntos:** 2

**Acceptance criteria resumido**

- [x] Si el conductor tiene saldo, el sistema lo muestra.
- [x] Si el saldo es cero, el sistema advierte que debe recargar para poder activarse.

**Tasks**

- [ ] `TASK-US28-01` Crear colección `wallets` en `db.json`.
- [ ] `TASK-US28-02` Crear `wallet.entity.ts`.
- [ ] `TASK-US28-03` Crear `wallet-response.ts` y assembler.
- [ ] `TASK-US28-04` Implementar `getWalletByDriverId(driverId)` en API service.
- [ ] `TASK-US28-05` Implementar `loadWallet(driverId)` en `monetization.store.ts`.
- [ ] `TASK-US28-06` Crear componente `wallet-balance`.
- [ ] `TASK-US28-07` Integrar validación de saldo con US-13.

---

## 4) Driver Management — soporte del sprint

### US-06 — Verificación de documentos del conductor

**Historia:** Como administrador, quiero revisar y aprobar o rechazar los documentos de los conductores registrados para garantizar que solo conductores formales operen en la plataforma.

**Acceptance criteria resumido**

- [x] Si el admin aprueba, el conductor queda habilitado para recibir solicitudes.
- [x] Si rechaza, el conductor recibe motivo y puede actualizar sus datos.

**Tasks para este sprint**

- [ ] `TASK-US06-01` Agregar `verificationStatus` y `operationalStatus` en drivers de `db.json`.
- [ ] `TASK-US06-02` Mostrar ese estado como dato mock, sin construir aún el panel admin completo.
- [ ] `TASK-US06-03` Condicionar la demo a que el conductor usado esté en estado `approved`.

> **Nota:** Aquí solo haría soporte de datos, no la funcionalidad completa.

---

## 5) Trust & Reputation — soporte del sprint

### US-23 — Visualización del puntaje de reputación

**Historia:** Como usuario, deseo ver mi puntaje de reputación en mi perfil, para conocer cómo me perciben otros usuarios.
**Puntos:** 2

**Acceptance criteria resumido**

- [x] Si el usuario tiene calificaciones, se muestra puntaje promedio y total.
- [x] Si no tiene, se indica que aún no cuenta con calificaciones.

**Tasks para este sprint**

- [ ] `TASK-US23-01` Agregar `ratingAverage` y `ratingCount` a drivers o profiles en `db.json`.
- [ ] `TASK-US23-02` Mostrar rating mock en la card del conductor o en perfil.
- [ ] `TASK-US23-03` Manejar caso “sin calificaciones”.

> **Nota:** Igual que Driver Management, aquí lo dejaría como placeholder visual.
