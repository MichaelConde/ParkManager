package com.parking.dto;

import com.parking.domain.TarifaConfig;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TarifaResponse(
        Long id,
        String tipoVehiculo,
        BigDecimal precioHora,
        LocalDateTime vigenteDesde,
        boolean activa
) {
    public static TarifaResponse from(TarifaConfig t) {
        return new TarifaResponse(t.getId(), t.getTipoVehiculo().name(), t.getPrecioHora(), t.getVigenteDesde(), t.isActiva());
    }
}
