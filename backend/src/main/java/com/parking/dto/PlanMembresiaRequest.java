package com.parking.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PlanMembresiaRequest(
        @NotBlank String nombre,
        @NotNull @Min(value = 1, message = "la duracion debe ser de al menos 1 dia") Integer duracionDias,
        @NotNull @DecimalMin(value = "0.01") BigDecimal precio,
        String descripcion
) {
}
