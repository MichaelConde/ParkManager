package com.parking.dto;

import com.parking.domain.Rol;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(
        @NotBlank @Size(min = 3, max = 50) String username,
        @NotBlank @Size(min = 6, message = "la contrasena debe tener al menos 6 caracteres") String password,
        @NotNull Rol rol
) {
}
