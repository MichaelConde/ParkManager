package com.parking.service;

import com.parking.domain.EstadoPlaza;
import com.parking.domain.PlazaEstacionamiento;
import com.parking.domain.TipoVehiculo;
import com.parking.dto.PlazaRequest;
import com.parking.dto.PlazaResponse;
import com.parking.dto.PlazaUpdateRequest;
import com.parking.exception.BusinessException;
import com.parking.exception.ConflictException;
import com.parking.exception.ResourceNotFoundException;
import com.parking.repository.PlazaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlazaService {

    private final PlazaRepository plazaRepository;
    private final AuditService auditService;

    public List<PlazaResponse> listar(TipoVehiculo tipo, EstadoPlaza estado) {
        return plazaRepository.findAll().stream()
                .filter(p -> tipo == null || p.getTipo() == tipo)
                .filter(p -> estado == null || p.getEstado() == estado)
                .map(PlazaResponse::from)
                .toList();
    }

    @Transactional
    public PlazaResponse crear(PlazaRequest request) {
        if (plazaRepository.existsByCodigoIgnoreCase(request.codigo())) {
            throw new ConflictException("Ya existe una plaza con el codigo " + request.codigo());
        }
        PlazaEstacionamiento plaza = PlazaEstacionamiento.builder()
                .codigo(request.codigo())
                .tipo(request.tipo())
                .zona(request.zona())
                .estado(EstadoPlaza.LIBRE)
                .build();
        plaza = plazaRepository.save(plaza);
        auditService.registrar("CREATE", "PLAZA", plaza.getId(), "Plaza creada: " + plaza.getCodigo());
        return PlazaResponse.from(plaza);
    }

    @Transactional
    public PlazaResponse actualizar(Long id, PlazaUpdateRequest request) {
        PlazaEstacionamiento plaza = obtener(id);
        if (plaza.getEstado() == EstadoPlaza.OCUPADA && request.estado() == EstadoPlaza.LIBRE
                && plaza.getEstado() != request.estado()) {
            throw new BusinessException("No se puede liberar manualmente una plaza ocupada; debe registrarse la salida del vehiculo");
        }
        plaza.setTipo(request.tipo());
        plaza.setZona(request.zona());
        plaza.setEstado(request.estado());
        plaza = plazaRepository.save(plaza);
        auditService.registrar("UPDATE", "PLAZA", plaza.getId(), "Plaza actualizada: " + plaza.getCodigo());
        return PlazaResponse.from(plaza);
    }

    @Transactional
    public void eliminar(Long id) {
        PlazaEstacionamiento plaza = obtener(id);
        if (plaza.getEstado() == EstadoPlaza.OCUPADA) {
            throw new BusinessException("No se puede eliminar una plaza ocupada");
        }
        plazaRepository.delete(plaza);
        auditService.registrar("DELETE", "PLAZA", id, "Plaza eliminada: " + plaza.getCodigo());
    }

    PlazaEstacionamiento obtener(Long id) {
        return plazaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plaza no encontrada: " + id));
    }
}
