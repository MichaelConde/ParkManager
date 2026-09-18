package com.parking.dto;

import com.parking.domain.Cliente;

public record ClienteResponse(
        Long id,
        String nombre,
        String contacto,
        String documento
) {
    public static ClienteResponse from(Cliente c) {
        return new ClienteResponse(c.getId(), c.getNombre(), c.getContacto(), c.getDocumento());
    }
}
