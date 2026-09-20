package com.parking.dto;

import com.parking.domain.TipoVehiculo;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ZonaAjusteRequest(
        @NotBlank String zona,
        @NotNull TipoVehiculo tipo,
        @NotNull @Min(0) Integer cantidadTotal
) {
}
