package com.parking.dto;

import com.parking.domain.Membresia;

import java.time.LocalDate;

public record MembresiaResponse(
        Long id,
        Long clienteId,
        String clienteNombre,
        Long planId,
        String planNombre,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        boolean activa
) {
    public static MembresiaResponse from(Membresia m) {
        return new MembresiaResponse(
                m.getId(),
                m.getCliente().getId(),
                m.getCliente().getNombre(),
                m.getPlan().getId(),
                m.getPlan().getNombre(),
                m.getFechaInicio(),
                m.getFechaFin(),
                m.isActiva()
        );
    }
}
