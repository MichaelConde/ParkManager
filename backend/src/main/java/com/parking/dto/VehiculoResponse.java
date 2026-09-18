package com.parking.dto;

import com.parking.domain.Vehiculo;

public record VehiculoResponse(
        Long id,
        String placa,
        String modelo,
        String tipo,
        Long clienteId,
        String clienteNombre
) {
    public static VehiculoResponse from(Vehiculo v) {
        return new VehiculoResponse(
                v.getId(),
                v.getPlaca(),
                v.getModelo(),
                v.getTipo().name(),
                v.getCliente() != null ? v.getCliente().getId() : null,
                v.getCliente() != null ? v.getCliente().getNombre() : null
        );
    }
}
