package com.parking.dto;

import com.parking.domain.TipoVehiculo;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TarifaRequest(
        @NotNull TipoVehiculo tipoVehiculo,
        @NotNull @DecimalMin(value = "0.01", message = "el precio por hora debe ser mayor a 0") BigDecimal precioHora
) {
}
