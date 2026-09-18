package com.parking.dto;

import com.parking.domain.TipoVehiculo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VehiculoRequest(
        @NotBlank String placa,
        String modelo,
        @NotNull TipoVehiculo tipo,
        Long clienteId
) {
}
