-- Actualiza el esquema de cobro: tarifas fijas por hora (o fraccion de
-- hora, ver SesionService.registrarSalida) en pesos colombianos.
-- Se desactivan las tarifas vigentes anteriores y se inserta una nueva
-- fila activa por tipo de vehiculo, siguiendo el mismo patron que
-- TarifaService.actualizar() para conservar el historial.
UPDATE tarifas SET activa = FALSE WHERE activa = TRUE;

INSERT INTO tarifas (tipo_vehiculo, precio_hora, activa) VALUES
    ('AUTO', 2000.00, TRUE),
    ('MOTO', 1200.00, TRUE);
