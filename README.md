# ParkManager — Sistema de Gestion de Estacionamiento

Aplicacion web full-stack para la gestion integral de un estacionamiento
(autos/motos): configuracion dinamica de plazas, control de ingreso/salida
con calculo automatico de tarifas, historial de clientes y vehiculos,
membresias mensuales, reportes de ingresos/ocupacion y notificaciones
internas de alertas.

Este proyecto implementa el diseño descrito en el `Resumen Ejecutivo` del
sistema: arquitectura monolitica en capas, backend en **Java 21 + Spring
Boot**, frontend en **Angular 18**, persistencia en **PostgreSQL**, y
despliegue local con **Docker Compose**.

## Stack tecnico

| Capa | Tecnologia |
|---|---|
| Backend | Java 21, Spring Boot 3.3, Spring Data JPA, Spring Security (JWT), Flyway |
| Frontend | Angular 18 (standalone components), TypeScript, Tailwind CSS, Chart.js |
| Base de datos | PostgreSQL 16 (H2 en memoria para tests) |
| QR | ZXing (generacion) + html5-qrcode (lectura por camara en el navegador) |
| Reportes | Apache POI (export a Excel) |
| Infraestructura | Docker, Docker Compose, Nginx (frontend + proxy `/api`) |

## Como ejecutar (Docker — recomendado)

Requiere Docker y Docker Compose instalados.

```bash
docker compose up --build
```

- Frontend: http://localhost:8090
- Backend (API): http://localhost:8080/api
- Adminer (explorador de BD): http://localhost:8081 (sistema: PostgreSQL, servidor: `postgres`, usuario: `parking`, contraseña: `parking`, BD: `parking`)
- Postgres expuesto al host en el puerto `5433` (el `5432` estandar puede estar ocupado por otra instalacion local de PostgreSQL)

> Nota: los puertos 80 y 5432 del host se dejaron libres a proposito porque
> son comunes de otras herramientas (XAMPP/Apache, PostgreSQL nativo). Si
> en tu maquina esos puertos estan libres y prefieres usarlos, edita
> `docker-compose.yml` y cambia `8090:80` por `80:80` y `5433:5432` por
> `5432:5432`.

### Usuarios semilla

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `cajero1` | `cajero123` | CAJERO |

Estos usuarios se crean automaticamente al iniciar el backend por primera
vez (`com.parking.config.DataInitializer`), ya que las contraseñas se
cifran con el `PasswordEncoder` de Spring Security en tiempo de arranque
en lugar de guardarse pre-hasheadas en el script SQL.

## Como ejecutar en desarrollo (sin Docker)

**Backend** (requiere PostgreSQL en `localhost:5432`, o usar el perfil
`test` con base de datos en memoria H2 para pruebas rapidas):

```bash
cd backend
mvn spring-boot:run
# o, sin Postgres instalado:
mvn spring-boot:run -Dspring-boot.run.profiles=test
```

**Frontend** (proxy automatico de `/api` hacia `http://localhost:8080`,
ver `frontend/proxy.conf.json`):

```bash
cd frontend
npm install
npm start
```

## Arquitectura

Arquitectura monolitica en 4 capas (presentacion, aplicacion/servicios,
dominio, persistencia):

```
backend/src/main/java/com/parking/
├── controller/   # Controladores REST (capa de presentacion de la API)
├── service/      # Logica de negocio (calculo de tarifas, asignacion de plazas, membresias...)
├── domain/       # Entidades JPA (modelo de dominio)
├── repository/   # Spring Data JPA (capa de persistencia)
├── security/     # JWT, filtros, UserDetailsService
├── dto/          # Contratos de entrada/salida de la API
├── scheduler/     # Job de notificaciones (membresias por vencer, ocupacion alta)
└── exception/    # Manejo centralizado de errores
```

El frontend Angular sigue una estructura por *features* (`dashboard`,
`sessions`, `spaces`, `clients`, `memberships`, `reports`, `users`) con un
`core` compartido (autenticacion, guards, interceptores HTTP, servicios de
API) y un modulo `shared` (toasts, modelos TypeScript que reflejan los DTOs
del backend).

## Reglas de negocio clave

- **Tarifa congelada por sesion**: al registrar el ingreso, la tarifa por
  hora vigente se copia a la sesion (`tarifaHoraAplicada`). Si el
  administrador cambia la tarifa despues, las sesiones ya iniciadas no se
  ven afectadas — solo los nuevos ingresos.
- **Calculo de cobro**: `monto = tarifaHoraAplicada * horas`, donde
  `horas = ceil(minutos_estacionado / 60)` (minimo 1 hora).
- **Membresias**: si el vehiculo pertenece a un cliente con una membresia
  activa vigente hoy, el cobro se omite automaticamente al registrar la
  salida.
- **Asignacion de plazas**: se asigna automaticamente la primera plaza
  libre que coincida con el tipo de vehiculo; si no hay disponibilidad, se
  rechaza el ingreso con un mensaje de "estacionamiento lleno".
- **Notificaciones (simuladas)**: un job programado revisa diariamente las
  membresias que vencen en los proximos 7 dias y, cada 15 minutos, la
  ocupacion por tipo de plaza; genera notificaciones internas visibles en
  el icono de campana de la aplicacion (sin envio real de email/SMS).

## Pruebas

```bash
cd backend
mvn test
```

Incluye pruebas unitarias de las reglas de negocio criticas (calculo de
tarifas, asignacion de plazas, aplicacion de membresias) y una prueba de
integracion de extremo a extremo (login → crear plaza → ingreso → salida)
usando una base de datos H2 en memoria.

## Extensiones futuras (fuera del alcance de este MVP)

Documentadas en el Resumen Ejecutivo original pero no implementadas en
esta version, ya que requieren infraestructura o servicios externos:

- Reconocimiento automatico de matricula (ANPR) o lectores RFID fisicos.
- Envio real de notificaciones por email/SMS (hoy se muestran como
  notificaciones internas en la aplicacion).
- Integracion con una pasarela de pago real (hoy los pagos se registran
  como datos, sin procesar transacciones).
- Observabilidad avanzada: stack ELK para logs centralizados,
  Prometheus + Grafana para metricas y alertas.
- Despliegue en cluster (Kubernetes) con auto-escalado y balanceo de
  carga entre multiples replicas del backend.
- CI/CD (GitHub Actions/GitLab CI) con analisis estatico (SonarQube) y
  escaneo de dependencias (OWASP Dependency-Check).
- App movil nativa / PWA instalable.

## Estructura del repositorio

```
Parking/
├── backend/            # API REST Spring Boot
├── frontend/            # SPA Angular
├── docker-compose.yml   # Orquestacion local (postgres, backend, frontend, adminer)
└── README.md
```
