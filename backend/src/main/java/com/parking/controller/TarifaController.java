package com.parking.controller;

import com.parking.domain.TipoVehiculo;
import com.parking.dto.TarifaRequest;
import com.parking.dto.TarifaResponse;
import com.parking.service.TarifaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tarifas")
@RequiredArgsConstructor
public class TarifaController {

    private final TarifaService tarifaService;

    @GetMapping
    public List<TarifaResponse> listarVigentes() {
        return tarifaService.listarVigentes();
    }

    @GetMapping("/historial")
    public List<TarifaResponse> historial(@RequestParam TipoVehiculo tipo) {
        return tarifaService.historial(tipo);
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public TarifaResponse actualizar(@Valid @RequestBody TarifaRequest request) {
        return tarifaService.actualizar(request);
    }
}
