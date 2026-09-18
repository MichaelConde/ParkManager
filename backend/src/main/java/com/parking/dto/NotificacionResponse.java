package com.parking.dto;

import com.parking.domain.Notificacion;

import java.time.LocalDateTime;

public record NotificacionResponse(
        Long id,
        String tipo,
        String mensaje,
        LocalDateTime fechaCreacion,
        boolean leida
) {
    public static NotificacionResponse from(Notificacion n) {
        return new NotificacionResponse(n.getId(), n.getTipo().name(), n.getMensaje(), n.getFechaCreacion(), n.isLeida());
    }
}
