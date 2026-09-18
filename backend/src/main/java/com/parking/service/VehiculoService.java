package com.parking.service;

import com.parking.domain.Cliente;
import com.parking.domain.Vehiculo;
import com.parking.dto.VehiculoRequest;
import com.parking.dto.VehiculoResponse;
import com.parking.exception.ConflictException;
import com.parking.exception.ResourceNotFoundException;
import com.parking.repository.VehiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VehiculoService {

    private final VehiculoRepository vehiculoRepository;
    private final ClienteService clienteService;
    private final AuditService auditService;

    public List<VehiculoResponse> listarPorCliente(Long clienteId) {
        return vehiculoRepository.findByClienteId(clienteId).stream().map(VehiculoResponse::from).toList();
    }

    public VehiculoResponse buscarPorPlaca(String placa) {
        return VehiculoResponse.from(obtenerPorPlaca(placa));
    }

    Vehiculo obtenerPorPlaca(String placa) {
        return vehiculoRepository.findByPlacaIgnoreCase(placa)
                .orElseThrow(() -> new ResourceNotFoundException("Vehiculo no encontrado con placa: " + placa));
    }

    @Transactional
    public VehiculoResponse crear(VehiculoRequest request) {
        if (vehiculoRepository.existsByPlacaIgnoreCase(request.placa())) {
            throw new ConflictException("Ya existe un vehiculo con la placa " + request.placa());
        }
        Vehiculo vehiculo = construir(request);
        vehiculo = vehiculoRepository.save(vehiculo);
        auditService.registrar("CREATE", "VEHICULO", vehiculo.getId(), "Vehiculo creado: " + vehiculo.getPlaca());
        return VehiculoResponse.from(vehiculo);
    }

    @Transactional
    public VehiculoResponse actualizar(Long id, VehiculoRequest request) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehiculo no encontrado: " + id));
        vehiculo.setPlaca(request.placa().toUpperCase());
        vehiculo.setModelo(request.modelo());
        vehiculo.setTipo(request.tipo());
        vehiculo.setCliente(request.clienteId() != null ? clienteService.obtener(request.clienteId()) : null);
        vehiculo = vehiculoRepository.save(vehiculo);
        auditService.registrar("UPDATE", "VEHICULO", vehiculo.getId(), "Vehiculo actualizado: " + vehiculo.getPlaca());
        return VehiculoResponse.from(vehiculo);
    }

    @Transactional
    public Vehiculo obtenerOCrear(String placa, com.parking.domain.TipoVehiculo tipo, String modelo, Long clienteId) {
        return vehiculoRepository.findByPlacaIgnoreCase(placa)
                .orElseGet(() -> {
                    Vehiculo nuevo = construir(new VehiculoRequest(placa, modelo, tipo, clienteId));
                    Vehiculo guardado = vehiculoRepository.save(nuevo);
                    auditService.registrar("CREATE", "VEHICULO", guardado.getId(), "Vehiculo creado automaticamente en ingreso: " + guardado.getPlaca());
                    return guardado;
                });
    }

    private Vehiculo construir(VehiculoRequest request) {
        return Vehiculo.builder()
                .placa(request.placa().toUpperCase())
                .modelo(request.modelo())
                .tipo(request.tipo())
                .cliente(request.clienteId() != null ? clienteService.obtener(request.clienteId()) : null)
                .build();
    }
}
