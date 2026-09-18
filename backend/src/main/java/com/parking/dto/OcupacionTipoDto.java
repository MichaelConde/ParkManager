package com.parking.dto;

public record OcupacionTipoDto(
        String tipo,
        long total,
        long ocupadas,
        long libres,
        double porcentajeOcupacion
) {
}
