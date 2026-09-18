package com.parking.dto;

import com.parking.domain.SesionEstacionamiento;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SesionResponse(
        Long id,
        String placa,
        String tipoVehiculo,
        String plazaCodigo,
        String usuarioCajero,
        LocalDateTime horaEntrada,
        LocalDateTime horaSalida,
        Integer duracionMinutos,
        BigDecimal tarifaHoraAplicada,
        BigDecimal montoCobrado,
        String estado,
        boolean membresiaAplicada,
        String codigoQr,
        String qrImageBase64
) {
    public static SesionResponse from(SesionEstacionamiento s) {
        return from(s, null);
    }

    public static SesionResponse from(SesionEstacionamiento s, String qrImageBase64) {
        return new SesionResponse(
                s.getId(),
                s.getVehiculo().getPlaca(),
                s.getVehiculo().getTipo().name(),
                s.getPlaza().getCodigo(),
                s.getUsuario().getUsername(),
                s.getHoraEntrada(),
                s.getHoraSalida(),
                s.getDuracionMinutos(),
                s.getTarifaHoraAplicada(),
                s.getMontoCobrado(),
                s.getEstado().name(),
                s.isMembresiaAplicada(),
                s.getCodigoQr(),
                qrImageBase64
        );
    }
}
