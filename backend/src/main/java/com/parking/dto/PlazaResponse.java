package com.parking.dto;

import com.parking.domain.PlazaEstacionamiento;

public record PlazaResponse(
        Long id,
        String codigo,
        String tipo,
        String zona,
        String estado
) {
    public static PlazaResponse from(PlazaEstacionamiento p) {
        return new PlazaResponse(p.getId(), p.getCodigo(), p.getTipo().name(), p.getZona(), p.getEstado().name());
    }
}
