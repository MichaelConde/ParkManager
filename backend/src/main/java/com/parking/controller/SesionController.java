package com.parking.controller;

import com.parking.dto.*;
import com.parking.service.SesionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sesiones")
@RequiredArgsConstructor
public class SesionController {

    private final SesionService sesionService;

    @PostMapping("/ingreso")
    public ResponseEntity<SesionResponse> ingreso(@Valid @RequestBody IngresoRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sesionService.registrarIngreso(request, auth.getName()));
    }

    @PostMapping("/salida")
    public ReciboResponse salida(@Valid @RequestBody SalidaRequest request, Authentication auth) {
        return sesionService.registrarSalida(request, auth.getName());
    }

    @GetMapping("/activo")
    public SesionResponse activaPorPlaca(@RequestParam String placa) {
        return sesionService.consultarActivaPorPlaca(placa);
    }

    @GetMapping("/activas")
    public List<SesionResponse> activas() {
        return sesionService.listarActivas();
    }

    @GetMapping("/buscar")
    public SesionResponse buscarPorCodigo(@RequestParam String codigo) {
        return sesionService.buscarPorCodigoQr(codigo);
    }

    @GetMapping("/historial")
    public Page<HistorialItemResponse> historial(@RequestParam String placa,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size) {
        return sesionService.historialPorPlaca(placa, PageRequest.of(page, size));
    }
}
