package com.parking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record IngresoDiaDto(
        LocalDate fecha,
        BigDecimal total,
        long sesiones
) {
}
