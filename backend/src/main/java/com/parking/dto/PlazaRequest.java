package com.parking.dto;

import com.parking.domain.TipoVehiculo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlazaRequest(
        @NotBlank String codigo,
        @NotNull TipoVehiculo tipo,
        String zona
) {
}
