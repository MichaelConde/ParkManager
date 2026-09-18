package com.parking.controller;

import com.parking.dto.*;
import com.parking.service.MembresiaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/membresias")
@RequiredArgsConstructor
public class MembresiaController {

    private final MembresiaService membresiaService;

    @GetMapping("/planes")
    public List<PlanMembresiaResponse> listarPlanes() {
        return membresiaService.listarPlanes();
    }

    @PostMapping("/planes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlanMembresiaResponse> crearPlan(@Valid @RequestBody PlanMembresiaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(membresiaService.crearPlan(request));
    }

    @PutMapping("/planes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public PlanMembresiaResponse actualizarPlan(@PathVariable Long id, @Valid @RequestBody PlanMembresiaRequest request) {
        return membresiaService.actualizarPlan(id, request);
    }

    @DeleteMapping("/planes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> desactivarPlan(@PathVariable Long id) {
        membresiaService.desactivarPlan(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<MembresiaResponse> listar() {
        return membresiaService.listar();
    }

    @GetMapping("/cliente/{clienteId}")
    public List<MembresiaResponse> historialPorCliente(@PathVariable Long clienteId) {
        return membresiaService.historialPorCliente(clienteId);
    }

    @PostMapping("/asignar")
    public ResponseEntity<MembresiaResponse> asignar(@Valid @RequestBody AsignarMembresiaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(membresiaService.asignar(request));
    }
}
