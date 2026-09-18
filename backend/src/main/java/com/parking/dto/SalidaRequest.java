package com.parking.dto;

import com.parking.domain.MetodoPago;
import jakarta.validation.constraints.NotNull;

public record SalidaRequest(
        Long sesionId,
        String placa,
        String codigoQr,
        @NotNull MetodoPago metodoPago
) {
}
