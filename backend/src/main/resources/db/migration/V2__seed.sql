-- Datos semilla: tarifas base, plazas de ejemplo y planes de membresia.
-- El usuario administrador inicial se crea en el arranque de la aplicacion
-- (com.parking.config.DataInitializer) para poder usar el PasswordEncoder
-- de Spring Security en lugar de codificar un hash BCrypt en el script SQL.

INSERT INTO tarifas (tipo_vehiculo, precio_hora, activa) VALUES
    ('AUTO', 4.00, TRUE),
    ('MOTO', 2.00, TRUE);

INSERT INTO plazas (codigo, tipo, zona, estado) VALUES
    ('A-01', 'AUTO', 'Zona A', 'LIBRE'),
    ('A-02', 'AUTO', 'Zona A', 'LIBRE'),
    ('A-03', 'AUTO', 'Zona A', 'LIBRE'),
    ('A-04', 'AUTO', 'Zona A', 'LIBRE'),
    ('A-05', 'AUTO', 'Zona A', 'LIBRE'),
    ('B-01', 'AUTO', 'Zona B', 'LIBRE'),
    ('B-02', 'AUTO', 'Zona B', 'LIBRE'),
    ('B-03', 'AUTO', 'Zona B', 'LIBRE'),
    ('M-01', 'MOTO', 'Motoparqueo', 'LIBRE'),
    ('M-02', 'MOTO', 'Motoparqueo', 'LIBRE'),
    ('M-03', 'MOTO', 'Motoparqueo', 'LIBRE'),
    ('M-04', 'MOTO', 'Motoparqueo', 'LIBRE');

INSERT INTO planes_membresia (nombre, duracion_dias, precio, descripcion, activo) VALUES
    ('Mensual Auto', 30, 120.00, 'Ingreso ilimitado para un vehiculo tipo auto durante 30 dias', TRUE),
    ('Mensual Moto', 30, 60.00, 'Ingreso ilimitado para un vehiculo tipo moto durante 30 dias', TRUE);
