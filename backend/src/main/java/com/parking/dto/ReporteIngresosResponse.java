package com.parking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record ReporteIngresosResponse(
        LocalDate desde,
        LocalDate hasta,
        BigDecimal totalIngresos,
        long totalSesiones,
        Map<String, BigDecimal> porMetodoPago,
        List<IngresoDiaDto> porDia
) {
}
