# Prompt de continuación — pegar esto al iniciar la nueva sesión

Estoy retomando el proyecto **ParkManager** (sistema de gestión de
estacionamiento) en `C:\Users\micha\OneDrive\Escritorio\Carpetas\Portafolio\Parking`.
Es un repo git (rama `master`) con backend Spring Boot + frontend Angular 18,
funcional de punta a punta, con rediseño visual premium (dark glassmorphism +
vehículos 3D) y varias rondas de corrección de bugs ya aplicadas. Lee este
contexto antes de tocar nada. Responde siempre en español.

## Cómo correrlo

```bash
cd "C:\Users\micha\OneDrive\Escritorio\Carpetas\Portafolio\Parking"
docker compose up -d
```

- Frontend: **http://localhost:8090**
- Backend API: http://localhost:8080/api
- Adminer (ver la BD Postgres): http://localhost:8081 (sistema PostgreSQL,
  servidor `postgres`, usuario/clave `parking`/`parking`, BD `parking`)
- Login: `admin` / `admin123` (ADMIN) o `cajero1` / `cajero123` (CAJERO)

Puertos 80 y 5432 del host evitados a propósito (XAMPP/Postgres nativos ya
los usan en esta máquina).

Para desarrollo del frontend con hot-reload, con el backend Docker ya arriba:

```bash
cd frontend
npm start   # ng serve en :4200, con proxy a localhost:8080 (ver proxy.conf.json)
```

**Si `docker ps` no responde o da error de pipe/daemon**: Docker Desktop no
está corriendo (ya pasó una vez en esta máquina, probablemente por suspensión
del sistema). Lánzalo con
`start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"`, espera ~30-60s
a que el daemon responda, y luego `docker compose up -d` — los contenedores
quedan en estado `Exited` pero el volumen `parking_pgdata` persiste, no se
pierde nada.

## Historial de commits relevante

```
ebbba7b Sistema completo original (backend + frontend básico, 13 tests backend)
bc5666e, 10bd4a5  Ajustes menores (analytics id, remapeo de puertos)
8906ef3 Rediseño premium del frontend (dark glassmorphism + vehículos 3D)
629a375 Corrige gráfica de ingresos en blanco en Reportes
fcfea10 Agrega navegación móvil (drawer) y corrige overflow del filtro de fechas
d69755a Corrige tipo de vehículo obsoleto (backend) y acerca la cámara del mapa 3D
b4ac7c5 Corrige hueco topológico del modelo de auto (hatchback) y preview de ticket sin actualizar
0a52a86 Reemplaza el modelo 3D del auto por un Audi R8 sin defectos topológicos
```

Los commits `8906ef3` y anteriores están documentados en detalle en el
historial de git; aquí me enfoco en **lo hecho en la sesión más reciente**
(`629a375` → `0a52a86`), que fue casi toda de corrección de bugs reales
encontrados verificando la app en el navegador, no trabajo especulativo.

### 629a375 — Gráfica de Reportes en blanco (bug real, confirmado)

`ReportsComponent.cargar()` disparaba `pintarGrafica()` con
`setTimeout(fn, 0)` inmediatamente después de `this.ingresos.set(r)`. En el
primer montaje del componente esto corría **antes** de que Angular terminara
de crear el `<canvas>` del bloque `@if`, dejando el `ViewChild` sin resolver
y el chart nunca se dibujaba (sin error visible, solo quedaba vacío). Se
reemplazó por `ChangeDetectorRef.detectChanges()` síncrono tras el
`signal.set()`, que garantiza que el canvas ya existe antes de pintar.

### fcfea10 — Sidebar no responsive + overflow en Reportes

El shell (`core/layout/shell.component.ts`) no tenía ningún breakpoint: el
sidebar de 256px quedaba fijo en móvil, dejando el contenido real reducido a
una franja inutilizable. Se agregó un drawer deslizable con botón hamburguesa
(`sidebarAbierto` signal), backdrop y cierre automático al navegar, sin tocar
el sidebar estático en desktop (`md:`). De paso, la fila de filtros de
Reportes (fecha desde/hasta + botones) no tenía `flex-wrap` y se salía de la
pantalla en móvil.

### d69755a — Tipo de vehículo obsoleto + cámara del mapa 3D

**Bug real de datos**: `VehiculoService.obtenerOCrear()` reutilizaba el
vehículo existente por placa **sin actualizar su `tipo`** cuando la placa se
reingresaba con un tipo distinto (p. ej. una placa de prueba usada primero
como AUTO y luego como MOTO). La plaza SÍ se asignaba con el tipo correcto de
la nueva solicitud, pero `SesionResponse.tipoVehiculo` viene del vehículo
persistido (obsoleto) → el frontend cargaba el modelo 3D equivocado
(auto en vez de moto) y, al tener el tamaño de un auto dentro de una plaza
angosta de moto, se superponía visualmente con la plaza vecina. Se corrigió
sincronizando el tipo del vehículo en cada ingreso
(`VehiculoService.actualizarTipoSiCambio`).

De paso, se acercó la cámara ortográfica del mapa 3D del dashboard
(`ParkingSceneComponent`: `viewSize` y márgenes de encuadre reducidos, rango
de zoom ampliado) porque el usuario la veía muy alejada.

### b4ac7c5 — Hueco topológico del auto + preview de ticket sin actualizar

Dos bugs distintos reportados como "se ven dos coches":

1. **`VehiclePreviewComponent` no reaccionaba a cambios de `@Input()`**: solo
   cargaba el modelo 3D una vez en `ngAfterViewInit`. Al registrar un segundo
   vehículo sin salir de la pantalla de Ingreso/Salida, `tipo`/`seed`
   cambiaban pero el modelo previo se quedaba montado (bug real y
   reproducible). Se agregó `ngOnChanges` con limpieza de la instancia
   anterior y protección ante recargas superpuestas (`loadToken`).

2. **"Dos autos" en el modelo hatchback**: tras descartar duplicación de
   malla en Three.js (nunca la hubo), decodificador meshopt, y frustum
   culling, se confirmó con clustering de proximidad de vértices que el
   **`.obj` original tiene un hueco topológico real** entre la mitad
   delantera y trasera, a la altura de las ventanas (que además no tenían
   vidrio modelado). Se probó reprocesando el `.obj` fuente sin decimar y
   con distintas configuraciones de `gltfpack` (incluyendo `-slb` para
   bloquear vértices de borde): el hueco persistía siempre → es un defecto
   del asset original, no del pipeline. Se cerró desplazando
   programáticamente la mitad trasera con `gltf-transform`. **Este fix quedó
   superado por el siguiente commit** (se reemplazó el modelo entero), pero
   el método de diagnóstico (clustering de vértices + render con fondo
   sólido desde varios ángulos) es reusable si aparece un problema similar.

De paso se agregó un indicador visual en "Sesiones activas" del dashboard:
un punto de color (mismo `colorForSeed()` que pinta los modelos 3D, así que
coincide exactamente con el color del vehículo en el mapa) + ícono de tipo
(auto/moto), para poder ubicar cada placa en el mapa de un vistazo.

### 0a52a86 — Reemplazo completo del modelo del auto (Audi R8)

El usuario proporcionó un nuevo `.obj` (Audi R8, exportado desde KeyShot,
**sin `.mtl`** — quedó en `C:\Users\micha\Downloads\r8.obj`). Se generó un
`.mtl` sintético con colores razonables por nombre de material (no está en
el repo, solo el `.glb` final). Se verificó que el modelo fuente **sí es
topológicamente continuo** (a diferencia del hatchback, este incluye vidrio
real) con el mismo método de clustering + render con fondo sólido, en
múltiples ángulos, con el ticket individual y con 5 autos simultáneos en el
dashboard. Se decimó con `gltfpack -si 0.15 -sa -slb -cc` (72k → ~7k
vértices, 65KB) y quedó en `frontend/public/models/vehicle-auto.glb`.

Detalles de `VehicleModelService` para este modelo:
- `scale: 4.3 / 4408.74` (el eje largo del modelo ya viene alineado con Z,
  `rotationY: 0`, sin necesidad de rotar como el hatchback).
- `paintMaterials: ['Paint Metallic Cool Grey #1']` — gltfpack fusionó este
  material con `Paint Metallic Orange peel Cool Grey #1` (la pintura de
  carrocería dominante en el `.obj`, ~31% de las caras) porque en el `.mtl`
  sintético comparten los mismos valores Kd/Ks/Ns.
- `Glass Basic White #2` sobrevivió con `alphaMode: BLEND` (transparencia
  correcta automática vía la lógica existente `mat.name.includes('glass')`).

**Pendiente opcional**: si el usuario consigue el `.mtl` original de KeyShot,
se puede reprocesar con colores fieles al diseño real en vez de los valores
sintéticos aproximados que se usaron hasta ahora.

## Bugs reales ya corregidos (no los reintroduzcas)

1. `@lucide/angular` >= 1.25.0 roto con Angular 18.2.14 → fijado a `1.20.0`
   exacto en `package.json`, sin `^`. No actualizar sin re-verificar.
2. `THREE.GLTFLoader` necesita `.setMeshoptDecoder(MeshoptDecoder)` — si se
   crea un loader nuevo en otro lugar sin esto, los `.glb` (comprimidos con
   `EXT_meshopt_compression`) fallan en silencio.
3. `ParkingSceneComponent.ngOnChanges` debe llamar siempre `rebuildPads()` +
   `syncVehicles()` juntos, sin importar qué `@Input` cambió (condición de
   carrera entre las peticiones de `plazas` y `sesiones`).
4. `VehiclePreviewComponent` necesita `ngOnChanges` para recargar el modelo
   cuando cambian `tipo`/`seed` en una instancia ya montada (ver `b4ac7c5`).
5. `VehiculoService.obtenerOCrear` debe sincronizar el `tipo` del vehículo
   existente si difiere del de la nueva solicitud de ingreso (ver `d69755a`).
6. Las gráficas de Chart.js que dependen de un `@ViewChild` dentro de un
   `@if` necesitan `detectChanges()` síncrono antes de dibujar en el primer
   montaje, no `setTimeout(fn, 0)` (ver `629a375`).

## Nuevas funcionalidades pedidas para esta sesión

El usuario pidió explícitamente estas dos features, aún **sin empezar**:

### 1. Mapa 3D interactivo en el dashboard

Poder hacer **click sobre un vehículo 3D** en el mapa del dashboard
(`ParkingSceneComponent`) y **registrar su salida directamente desde ahí**
(sin tener que ir a la pantalla de Ingreso/Salida y buscar la placa
manualmente). Implica:
- Raycasting de Three.js sobre `vehiclesGroup` en el click del canvas para
  identificar qué `codigoQr`/sesión se clickeó.
- Algún tipo de UI (modal, panel lateral, tooltip con confirmación) para
  mostrar los datos de la sesión (placa, tiempo transcurrido, monto
  estimado) y confirmar el cobro/salida — puede reusar
  `SesionService.salida()` y la lógica ya existente en
  `SessionsComponent.confirmarSalida()`, pero expuesta desde el dashboard.
- Cuidado con el `OrbitControls`: hay que distinguir un click de rotación
  (drag) de un click real sobre un vehículo (umbral de movimiento del mouse,
  patrón común: solo tratar como "click" si el puntero no se movió más de
  unos pocos píxeles entre `pointerdown` y `pointerup`).

### 2. CRUD de plazas con soporte de "pisos"

Ya existe un CRUD básico de plazas en `Plazas y tarifas`
(`frontend/src/app/features/spaces/spaces.component.ts`): crear/editar/
eliminar plaza con `codigo`, `tipo`, `zona`, `estado`. El usuario quiere
ampliar esto para poder **agregar algo como "otro piso"**, con sus propias
plazas asignadas por el usuario. Esto es trabajo nuevo, no un ajuste menor:

- **Backend**: `PlazaEstacionamiento`
  (`backend/src/main/java/com/parking/domain/PlazaEstacionamiento.java`) no
  tiene ningún campo de piso/nivel actualmente (solo `codigo`, `tipo`,
  `zona`, `estado`, `createdAt`). Habría que agregar un campo (p. ej.
  `piso: Integer` o `nivel: String`), con su migración Flyway
  correspondiente (ver `backend/src/main/resources/db/migration/`), y
  exponerlo en `PlazaRequest`/`PlazaUpdateRequest`/`PlazaResponse`.
- **Frontend CRUD**: extender el formulario de `spaces.component.ts` para
  capturar el piso al crear/editar una plaza, y probablemente un selector/
  filtro por piso en la tabla.
- **Mapa 3D**: `shared/three/parking-layout.ts` (`computeParkingLayout`)
  actualmente distribuye TODAS las plazas en una sola grilla plana (AUTO
  arriba, MOTO abajo). Con pisos, hay que decidir el enfoque visual —
  probablemente más simple y legible que "apilar" pisos en 3D: un selector
  de piso (tabs o dropdown) que filtra qué subconjunto de plazas le pasa el
  dashboard a `<app-parking-scene>`, en vez de intentar representar
  múltiples niveles simultáneamente en la misma escena isométrica.

No se ha escrito código para ninguna de las dos features todavía — conviene
alinear el enfoque con el usuario (especialmente el de pisos: ¿selector de
piso separado, o todo visible a la vez de alguna forma?) antes de
implementar.

## Notas del entorno de pruebas

- **Primer click tras escribir en un input no registra**: patrón conocido
  en el navegador embebido de Claude, no es bug de la app. Repetir el click
  con una ref fresca (`read_page`) antes de asumir que algo falló.
- **Datos compartidos en la BD**: al cierre de esta sesión había sesiones
  activas reales creadas por el usuario (placas `8765`, `FGHHG`, `TDTD`) —
  no son datos de prueba míos, no las borres sin preguntar. La base persiste
  en el volumen Docker `parking_pgdata`.
- Para depurar el mapa 3D o el preview de vehículos en profundidad, `ng
  serve` (puerto 4200) expone `window.ng` (Angular DevTools), lo que permite
  `ng.getComponent(el)` para inspeccionar `scene`/`camera`/`rig`/`renderer`
  directamente desde consola — mucho más rápido que solo mirar screenshots.
  La build de producción (`8090`) no expone esto.
