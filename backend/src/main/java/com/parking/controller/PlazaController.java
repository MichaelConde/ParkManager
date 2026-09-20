package com.parking.controller;

import com.parking.domain.EstadoPlaza;
import com.parking.domain.TipoVehiculo;
import com.parking.dto.PlazaRequest;
import com.parking.dto.PlazaResponse;
import com.parking.dto.PlazaUpdateRequest;
import com.parking.dto.ZonaAjusteRequest;
import com.parking.dto.ZonaRequest;
import com.parking.service.PlazaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/espacios")
@RequiredArgsConstructor
public class PlazaController {

    private final PlazaService plazaService;

    @GetMapping
    public List<PlazaResponse> listar(@RequestParam(required = false) TipoVehiculo tipo,
                                       @RequestParam(required = false) EstadoPlaza estado) {
        return plazaService.listar(tipo, estado);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlazaResponse> crear(@Valid @RequestBody PlazaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(plazaService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public PlazaResponse actualizar(@PathVariable Long id, @Valid @RequestBody PlazaUpdateRequest request) {
        return plazaService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        plazaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/zonas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PlazaResponse>> crearZona(@Valid @RequestBody ZonaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(plazaService.crearZona(request));
    }

    @PutMapping("/zonas/ajustar")
    @PreAuthorize("hasRole('ADMIN')")
    public List<PlazaResponse> ajustarZona(@Valid @RequestBody ZonaAjusteRequest request) {
        return plazaService.ajustarZona(request);
    }
}
