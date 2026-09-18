package com.parking.dto;

import com.parking.domain.Usuario;

public record UsuarioResponse(
        Long id,
        String username,
        String rol,
        boolean activo
) {
    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getUsername(), u.getRol().name(), u.isActivo());
    }
}
