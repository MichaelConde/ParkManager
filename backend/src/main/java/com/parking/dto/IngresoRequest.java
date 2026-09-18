package com.parking.dto;

import com.parking.domain.TipoVehiculo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record IngresoRequest(
        @NotBlank String placa,
        @NotNull TipoVehiculo tipo,
        String modelo,
        Long clienteId
) {
}
