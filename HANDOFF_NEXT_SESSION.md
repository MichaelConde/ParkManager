# Prompt de continuación — pegar esto al iniciar la nueva sesión

Estoy retomando el proyecto **ParkManager** (sistema de gestión de
estacionamiento) en `C:\Users\micha\OneDrive\Escritorio\Carpetas\Portafolio\Parking`.
Es un repo git (rama `master`) con backend Spring Boot + frontend Angular
18, ya funcional de punta a punta y con un rediseño visual premium (dark
glassmorphism + vehículos 3D) recién terminado. Lee este contexto antes de
tocar nada.

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

Los puertos 80 y 5432 del host se evitaron a propósito porque en esta
máquina ya hay XAMPP/Apache y un PostgreSQL nativo corriendo ahí.

Para desarrollo del frontend con hot-reload (más rápido que rebuildear
Docker cada vez), con el backend Docker ya arriba:

```bash
cd frontend
npm start   # ng serve en :4200, con proxy a localhost:8080 (ver proxy.conf.json)
```

## Qué se hizo en la sesión anterior (ya commiteado)

Historial de commits relevante (`git log --oneline`):
1. `ebbba7b` — Sistema completo original (backend Spring Boot + frontend
   Angular básico, Docker Compose, 13 tests backend en verde).
2. `bc5666e`, `10bd4a5` — ajustes menores (analytics id de Angular CLI,
   remapeo de puertos por conflicto con XAMPP/Postgres locales).
3. **`8906ef3` — Rediseño premium del frontend** (el trabajo grande de
   la última sesión, ver detalle abajo).

### El rediseño (commit `8906ef3`)

El usuario pidió, a partir de 2 mockups de referencia (PDF con estilo
dark glassmorphism tipo dashboard SaaS/EV, acentos neón verde/cian,
autos isométricos) y 2 archivos `.obj` de vehículos:

- Eliminar todos los emojis y usar una librería de íconos real.
- Animaciones/microinteracciones de calidad (no infantiles).
- **Vehículos 3D reales** que aparecen al registrar un ingreso y
  desaparecen al registrar la salida, con color aleatorio por vehículo.

**Decisiones de arquitectura tomadas con el usuario (no las repreguntes):**
- Se mantuvo **Angular** (no se reescribió a React), usando **Three.js
  puro** (no React Three Fiber) y **GSAP** (no Framer Motion) — mismo
  resultado visual sin descartar el backend/auth ya construidos.
- De los 2 `.obj` proporcionados: `_HatchConcept2016_OBJ` es un
  hatchback → se usa para vehículos tipo `AUTO`. `Zero-Gravity_Glide_OBJ`
  resultó ser una **motocicleta** (no un segundo auto) → se mapeó al
  tipo `MOTO` que el sistema ya distingue.

**Pipeline de assets 3D:** los `.obj` originales (371k y 534k triángulos,
31.5MB/40MB, con texturas rotas apuntando a rutas absolutas inexistentes)
se limpiaron (se les quitaron las referencias `map_*` del `.mtl` para
dejar solo color plano `Kd`) y se decimaron/comprimieron con `gltfpack`
a **6.8k y 10.2k triángulos (~35-40KB cada uno)**. Ya están en
`frontend/public/models/vehicle-auto.glb` y `vehicle-moto.glb` — el
`.mtl` limpio se generó pero NO se guardó en el repo (solo el `.glb`
final, que ya no necesita el `.mtl`). Los `.obj` originales del usuario
siguen intactos en `C:\Users\micha\OneDrive\Escritorio\carro\` por si
hace falta reprocesarlos.

**Archivos nuevos clave:**
- `frontend/src/app/core/services/vehicle-model.service.ts` — carga los
  `.glb` una vez (con `GLTFLoader` + `MeshoptDecoder`, ver bug abajo) y
  clona instancias con color determinístico (hash del `codigoQr` sobre
  una paleta en `shared/three/car-palette.ts`). Solo tiñe los materiales
  de pintura de carrocería (`Paint_Metallic_Coupe`/`Paint_Metallic` en
  el auto, `Bike_White_Light` en la moto); el resto de materiales
  (vidrios, llantas) quedan con su color original.
- `frontend/src/app/features/dashboard/parking-3d/parking-scene.component.ts`
  — el mapa 3D isométrico del dashboard. Layout de plazas en
  `shared/three/parking-layout.ts` (grilla AUTO arriba, MOTO abajo,
  centrada en el origen). Cámara ortográfica con `OrbitControls`
  (auto-rotate lento, se pausa al interactuar). **La cámara se
  reencuadra dinámicamente** (`updateCameraFraming()`) según el
  bounding box real de las plazas — importante, ver bug abajo.
- `frontend/src/app/shared/three/vehicle-preview.component.ts` — mini
  preview 3D (un solo vehículo girando) usado en el ticket de ingreso
  de Sesiones.
- Kit de UI compartido en `shared/ui/` (`glass-card`, `stat-tile`,
  `status-badge` + `status.util.ts` con el mapeo de colores por estado)
  y `shared/animations/gsap-reveal.directive.ts` (directiva
  `[gsapReveal]` para entrada fade+stagger, usada en listas/tablas).
- Todas las páginas (`login`, `shell`, `dashboard`, `sessions`, `spaces`,
  `clients`, `memberships`, `reports`, `users`) se reescribieron con el
  nuevo sistema de diseño (`ink`/`accent`/`status` en
  `tailwind.config.js`, fuente Manrope, clases `.glass-panel`/
  `.btn-primary`/`.btn-ghost`/`.glass-input` en `styles.css`). La lógica
  de negocio (HTTP, validators, signals `guardando`) de esos componentes
  **no cambió**, solo el template.

## 3 bugs reales encontrados y corregidos (no los reintroduzcas)

1. **`@lucide/angular` >= 1.25.0 está roto con Angular 18.2.14**: cada
   ícono usa internamente `@for`+`@switch` en su plantilla para dibujar
   los nodos SVG, y eso revienta con `ReferenceError: tmp_4_0 is not
   defined` (confirmado en dev Y en build de producción/AOT, no es solo
   un problema de JIT). La librería quedó **fijada a `1.20.0` exacto**
   en `package.json` (`"@lucide/angular": "1.20.0"`, sin `^`). **No la
   actualices** sin volver a verificar este bug primero. Si necesitas un
   ícono que no exista en 1.20.0, hay que buscar alternativa (otro
   ícono similar) en vez de subir de versión.
2. **`THREE.GLTFLoader` necesita `setMeshoptDecoder`**: los `.glb` están
   comprimidos con la extensión `EXT_meshopt_compression` (por el
   `gltfpack -cc` del pipeline). Si se crea un nuevo `GLTFLoader` en
   algún otro lugar sin llamar `.setMeshoptDecoder(MeshoptDecoder)`
   (import desde `three/examples/jsm/libs/meshopt_decoder.module.js`),
   los modelos fallan en silencio (error en consola, nada se renderiza).
3. **Condición de carrera en `ParkingSceneComponent.ngOnChanges`**: el
   dashboard dispara dos HTTP calls independientes (`plazas` y
   `sesiones`); si `sesiones` resuelve antes que `plazas`, el spawn de
   vehículos se saltaba silenciosamente porque el mapa de slots aún
   estaba vacío. Se corrigió llamando **siempre** `rebuildPads()` +
   `syncVehicles()` juntos en cada `ngOnChanges`, sin importar cuál
   input cambió.

## Estado actual / pendiente de verificar

Todo lo anterior quedó **verificado visualmente en el navegador**
(login, dashboard con el mapa 3D, ciclo completo ingreso→spawn 3D→
salida→desaparición animada, spaces, clients, memberships, users) antes
de commitear. Lo único que no alcancé a confirmar con certeza:

- **Reportes**: el panel "Ingresos por día" (gráfica Chart.js) se veía
  vacío/en blanco en la última captura — probablemente solo necesitaba
  un instante más para pintar, pero no lo re-verifiqué. Revisa que las
  barras se pinten correctamente con el tema oscuro (colores ya
  configurados en `reports.component.ts`, método `pintarGrafica`).
- **Datos de prueba sueltos en la BD** (no rompen nada, solo son ruido
  visual): un cliente "TEST" y una sesión activa con placa `TST-3D2` en
  la plaza A-02 quedaron de las pruebas. Se pueden borrar desde la UI
  (Clientes / Ingreso-Salida) o dejar así — la base persiste en el
  volumen Docker `parking_pgdata`.
- **No se probó a fondo el responsive en móvil** ni el flujo de
  escaneo de QR por cámara con el nuevo estilo (la lógica no cambió,
  pero el estilo del panel sí).
- **Rendimiento con muchos vehículos simultáneos**: se probó con 2
  autos a la vez, no con una ocupación alta (ej. 10+). Los modelos son
  livianos (35-40KB, 6-10k triángulos) así que no debería ser problema,
  pero vale la pena una prueba de estrés si el usuario llena el
  estacionamiento en una demo.

## Nota sobre el entorno de pruebas del navegador

Al probar clicks en el navegador embebido de Claude, es común que el
**primer click en un botón justo después de escribir en un input no
registre** (hay que repetir el click una vez). No es un bug de la app
— pasó consistentemente con formularios que ya estaban probados y
funcionando antes del rediseño. Si vas a probar interacciones, después
de un click "que no hizo nada" visualmente, simplemente vuelve a leer
la página (`read_page`) y haz click de nuevo con la ref fresca antes de
asumir que hay un bug real.

## Otros archivos de referencia

- `C:\Users\micha\Downloads\Estilo.pdf` — las 2 imágenes de referencia
  de estilo originales del usuario (no está en el repo, se ignoró vía
  `.gitignore` una copia que apareció en la raíz del proyecto).
- `C:\Users\micha\OneDrive\Escritorio\carro\` — los 2 `.obj` originales
  sin procesar (pesados, no están ni deberían estar en el repo).
