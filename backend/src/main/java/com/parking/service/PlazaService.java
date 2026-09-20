package com.parking.service;

import com.parking.domain.EstadoPlaza;
import com.parking.domain.PlazaEstacionamiento;
import com.parking.domain.TipoVehiculo;
import com.parking.dto.PlazaRequest;
import com.parking.dto.PlazaResponse;
import com.parking.dto.PlazaUpdateRequest;
import com.parking.dto.ZonaAjusteRequest;
import com.parking.dto.ZonaRequest;
import com.parking.exception.BusinessException;
import com.parking.exception.ConflictException;
import com.parking.exception.ResourceNotFoundException;
import com.parking.repository.PlazaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlazaService {

    private static final int MAX_PLAZAS_POR_LOTE = 200;

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

    @Transactional
    public List<PlazaResponse> crearZona(ZonaRequest request) {
        if (request.cantidad() > MAX_PLAZAS_POR_LOTE) {
            throw new BusinessException("No se pueden crear mas de " + MAX_PLAZAS_POR_LOTE + " plazas a la vez");
        }
        List<PlazaEstacionamiento> creadas = generarPlazas(request.prefijo(), request.zona(), request.tipo(), request.cantidad());
        auditService.registrar("CREATE", "PLAZA", null,
                "Zona creada: " + request.zona() + " (" + request.cantidad() + " plazas " + request.tipo() + ")");
        return creadas.stream().map(PlazaResponse::from).toList();
    }

    @Transactional
    public List<PlazaResponse> ajustarZona(ZonaAjusteRequest request) {
        List<PlazaEstacionamiento> actuales = plazaRepository.findByZonaIgnoreCaseAndTipo(request.zona(), request.tipo());
        if (actuales.isEmpty()) {
            throw new ResourceNotFoundException("No existe la zona " + request.zona() + " para " + request.tipo());
        }
        int actual = actuales.size();
        int objetivo = request.cantidadTotal();

        if (objetivo > actual) {
            if (objetivo - actual > MAX_PLAZAS_POR_LOTE) {
                throw new BusinessException("No se pueden agregar mas de " + MAX_PLAZAS_POR_LOTE + " plazas a la vez");
            }
            String prefijo = extraerPrefijo(actuales.get(0).getCodigo());
            generarPlazas(prefijo, request.zona(), request.tipo(), objetivo - actual);
        } else if (objetivo < actual) {
            int aEliminar = actual - objetivo;
            List<PlazaEstacionamiento> libres = actuales.stream()
                    .filter(p -> p.getEstado() == EstadoPlaza.LIBRE)
                    .sorted(Comparator.comparing(PlazaEstacionamiento::getCodigo).reversed())
                    .toList();
            if (libres.size() < aEliminar) {
                throw new BusinessException("No se pueden quitar " + aEliminar + " plazas de esa zona: solo hay "
                        + libres.size() + " libres (las ocupadas no se pueden eliminar, deben liberarse primero)");
            }
            plazaRepository.deleteAll(libres.subList(0, aEliminar));
        }

        auditService.registrar("UPDATE", "PLAZA", null,
                "Zona ajustada: " + request.zona() + " (" + request.tipo() + ") de " + actual + " a " + objetivo + " plazas");

        return plazaRepository.findByZonaIgnoreCaseAndTipo(request.zona(), request.tipo()).stream()
                .map(PlazaResponse::from)
                .toList();
    }

    private List<PlazaEstacionamiento> generarPlazas(String prefijo, String zona, TipoVehiculo tipo, int cantidad) {
        int siguiente = siguienteNumero(prefijo);
        List<PlazaEstacionamiento> nuevas = new ArrayList<>();
        for (int i = 0; i < cantidad; i++) {
            String codigo = prefijo + "-" + String.format("%02d", siguiente + i);
            if (plazaRepository.existsByCodigoIgnoreCase(codigo)) {
                throw new ConflictException("Ya existe una plaza con el codigo " + codigo);
            }
            nuevas.add(PlazaEstacionamiento.builder()
                    .codigo(codigo)
                    .tipo(tipo)
                    .zona(zona)
                    .estado(EstadoPlaza.LIBRE)
                    .build());
        }
        return plazaRepository.saveAll(nuevas);
    }

    private int siguienteNumero(String prefijo) {
        return plazaRepository.findByCodigoStartingWithIgnoreCase(prefijo + "-").stream()
                .map(p -> p.getCodigo().substring(prefijo.length() + 1))
                .filter(s -> s.matches("\\d+"))
                .mapToInt(Integer::parseInt)
                .max()
                .orElse(0) + 1;
    }

    private String extraerPrefijo(String codigo) {
        int idx = codigo.lastIndexOf('-');
        return idx > 0 ? codigo.substring(0, idx) : codigo;
    }
}
