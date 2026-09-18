package com.parking.dto;

import java.util.List;

public record ReporteOcupacionResponse(
        List<OcupacionTipoDto> porTipo,
        List<PlazaUsoDto> plazasMasUsadas,
        long sesionesActivas
) {
}
