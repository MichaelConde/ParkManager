package com.parking.service;

import com.parking.domain.Cliente;
import com.parking.dto.ClienteRequest;
import com.parking.dto.ClienteResponse;
import com.parking.exception.ResourceNotFoundException;
import com.parking.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final AuditService auditService;

    public List<ClienteResponse> listar(String busqueda) {
        List<Cliente> clientes = (busqueda == null || busqueda.isBlank())
                ? clienteRepository.findAll()
                : clienteRepository.buscar(busqueda);
        return clientes.stream().map(ClienteResponse::from).toList();
    }

    public ClienteResponse obtenerDto(Long id) {
        return ClienteResponse.from(obtener(id));
    }

    Cliente obtener(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest request) {
        Cliente cliente = Cliente.builder()
                .nombre(request.nombre())
                .contacto(request.contacto())
                .documento(request.documento())
                .build();
        cliente = clienteRepository.save(cliente);
        auditService.registrar("CREATE", "CLIENTE", cliente.getId(), "Cliente creado: " + cliente.getNombre());
        return ClienteResponse.from(cliente);
    }

    @Transactional
    public ClienteResponse actualizar(Long id, ClienteRequest request) {
        Cliente cliente = obtener(id);
        cliente.setNombre(request.nombre());
        cliente.setContacto(request.contacto());
        cliente.setDocumento(request.documento());
        cliente = clienteRepository.save(cliente);
        auditService.registrar("UPDATE", "CLIENTE", cliente.getId(), "Cliente actualizado: " + cliente.getNombre());
        return ClienteResponse.from(cliente);
    }

    @Transactional
    public void eliminar(Long id) {
        Cliente cliente = obtener(id);
        clienteRepository.delete(cliente);
        auditService.registrar("DELETE", "CLIENTE", id, "Cliente eliminado: " + cliente.getNombre());
    }
}
