package com.parking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record HistorialItemResponse(
        Long sesionId,
        String placa,
        String plazaCodigo,
        LocalDateTime horaEntrada,
        LocalDateTime horaSalida,
        Integer duracionMinutos,
        BigDecimal montoCobrado,
        boolean membresiaAplicada,
        String metodoPago
) {
}
