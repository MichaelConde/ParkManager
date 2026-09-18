package com.parking.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AsignarMembresiaRequest(
        @NotNull Long clienteId,
        @NotNull Long planId,
        LocalDate fechaInicio
) {
}
