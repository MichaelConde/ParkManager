-- Esquema inicial del sistema de gestion de estacionamiento

CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN', 'CAJERO')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clientes (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(150),
    documento VARCHAR(30),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehiculos (
    id BIGSERIAL PRIMARY KEY,
    placa VARCHAR(15) NOT NULL UNIQUE,
    modelo VARCHAR(80),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('AUTO', 'MOTO')),
    cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_vehiculos_placa ON vehiculos(placa);

CREATE TABLE plazas (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('AUTO', 'MOTO')),
    zona VARCHAR(50),
    estado VARCHAR(10) NOT NULL DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE', 'OCUPADA')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_plazas_estado ON plazas(estado);
CREATE INDEX idx_plazas_tipo ON plazas(tipo);

CREATE TABLE tarifas (
    id BIGSERIAL PRIMARY KEY,
    tipo_vehiculo VARCHAR(10) NOT NULL CHECK (tipo_vehiculo IN ('AUTO', 'MOTO')),
    precio_hora NUMERIC(10,2) NOT NULL,
    vigente_desde TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_tarifas_tipo_activa ON tarifas(tipo_vehiculo, activa);

CREATE TABLE sesiones (
    id BIGSERIAL PRIMARY KEY,
    vehiculo_id BIGINT NOT NULL REFERENCES vehiculos(id),
    plaza_id BIGINT NOT NULL REFERENCES plazas(id),
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    hora_entrada TIMESTAMP NOT NULL,
    hora_salida TIMESTAMP,
    tarifa_hora_aplicada NUMERIC(10,2) NOT NULL,
    duracion_minutos INT,
    monto_cobrado NUMERIC(10,2),
    estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'CERRADA')),
    membresia_aplicada BOOLEAN NOT NULL DEFAULT FALSE,
    codigo_qr VARCHAR(64) NOT NULL UNIQUE
);
CREATE INDEX idx_sesiones_estado ON sesiones(estado);
CREATE INDEX idx_sesiones_hora_salida ON sesiones(hora_salida);
CREATE INDEX idx_sesiones_codigo_qr ON sesiones(codigo_qr);

CREATE TABLE pagos (
    id BIGSERIAL PRIMARY KEY,
    sesion_id BIGINT NOT NULL UNIQUE REFERENCES sesiones(id) ON DELETE CASCADE,
    monto NUMERIC(10,2) NOT NULL,
    metodo VARCHAR(20) NOT NULL CHECK (metodo IN ('EFECTIVO', 'TARJETA', 'OTRO')),
    fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_pagos_fecha_pago ON pagos(fecha_pago);

CREATE TABLE planes_membresia (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    duracion_dias INT NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    descripcion VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE membresias (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id),
    plan_id BIGINT NOT NULL REFERENCES planes_membresia(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    aviso_vencimiento_enviado BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_membresias_cliente ON membresias(cliente_id);
CREATE INDEX idx_membresias_fecha_fin ON membresias(fecha_fin);

CREATE TABLE notificaciones (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('OCUPACION', 'MEMBRESIA_VENCE', 'SISTEMA')),
    mensaje VARCHAR(500) NOT NULL,
    referencia_id BIGINT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT REFERENCES usuarios(id),
    accion VARCHAR(20) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id BIGINT,
    detalle VARCHAR(500),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_log_entidad ON audit_log(entidad, entidad_id);
