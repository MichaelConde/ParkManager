package com.parking.dto;

import com.parking.domain.PlanMembresia;

import java.math.BigDecimal;

public record PlanMembresiaResponse(
        Long id,
        String nombre,
        Integer duracionDias,
        BigDecimal precio,
        String descripcion,
        boolean activo
) {
    public static PlanMembresiaResponse from(PlanMembresia p) {
        return new PlanMembresiaResponse(p.getId(), p.getNombre(), p.getDuracionDias(), p.getPrecio(), p.getDescripcion(), p.isActivo());
    }
}
