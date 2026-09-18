package com.parking.dto;

import com.parking.domain.EstadoPlaza;
import com.parking.domain.TipoVehiculo;
import jakarta.validation.constraints.NotNull;

public record PlazaUpdateRequest(
        @NotNull TipoVehiculo tipo,
        String zona,
        @NotNull EstadoPlaza estado
) {
}
