package com.parking.dto;

import com.parking.domain.TipoVehiculo;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ZonaRequest(
        @NotBlank String zona,
        @NotNull TipoVehiculo tipo,
        @NotBlank String prefijo,
        @NotNull @Min(1) Integer cantidad
) {
}
