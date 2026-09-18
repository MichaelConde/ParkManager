package com.parking.dto;

public record ReciboResponse(
        SesionResponse sesion,
        PagoResponse pago
) {
}
