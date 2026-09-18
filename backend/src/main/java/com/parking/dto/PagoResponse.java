package com.parking.dto;

import com.parking.domain.Pago;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PagoResponse(
        Long id,
        Long sesionId,
        BigDecimal monto,
        String metodo,
        LocalDateTime fechaPago
) {
    public static PagoResponse from(Pago p) {
        return new PagoResponse(p.getId(), p.getSesion().getId(), p.getMonto(), p.getMetodo().name(), p.getFechaPago());
    }
}
