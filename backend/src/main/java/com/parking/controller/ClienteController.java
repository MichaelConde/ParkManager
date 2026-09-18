package com.parking.controller;

import com.parking.dto.ClienteRequest;
import com.parking.dto.ClienteResponse;
import com.parking.dto.HistorialItemResponse;
import com.parking.dto.VehiculoResponse;
import com.parking.service.ClienteService;
import com.parking.service.SesionService;
import com.parking.service.VehiculoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;
    private final VehiculoService vehiculoService;
    private final SesionService sesionService;

    @GetMapping
    public List<ClienteResponse> listar(@RequestParam(required = false) String q) {
        return clienteService.listar(q);
    }

    @GetMapping("/{id}")
    public ClienteResponse obtener(@PathVariable Long id) {
        return clienteService.obtenerDto(id);
    }

    @PostMapping
    public ResponseEntity<ClienteResponse> crear(@Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.crear(request));
    }

    @PutMapping("/{id}")
    public ClienteResponse actualizar(@PathVariable Long id, @Valid @RequestBody ClienteRequest request) {
        return clienteService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        clienteService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/vehiculos")
    public List<VehiculoResponse> vehiculos(@PathVariable Long id) {
        return vehiculoService.listarPorCliente(id);
    }

    @GetMapping("/{id}/historial")
    public Page<HistorialItemResponse> historial(@PathVariable Long id,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size) {
        return sesionService.historialPorCliente(id, PageRequest.of(page, size));
    }
}
