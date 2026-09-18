package com.parking.service;

import com.parking.domain.TarifaConfig;
import com.parking.domain.TipoVehiculo;
import com.parking.dto.TarifaRequest;
import com.parking.dto.TarifaResponse;
import com.parking.exception.ResourceNotFoundException;
import com.parking.repository.TarifaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TarifaService {

    private final TarifaRepository tarifaRepository;
    private final AuditService auditService;

    public List<TarifaResponse> listarVigentes() {
        return List.of(TipoVehiculo.values()).stream()
                .map(this::tarifaVigenteEntidad)
                .filter(java.util.Optional::isPresent)
                .map(o -> TarifaResponse.from(o.get()))
                .toList();
    }

    public List<TarifaResponse> historial(TipoVehiculo tipo) {
        return tarifaRepository.findByTipoVehiculoOrderByVigenteDesdeDesc(tipo).stream()
                .map(TarifaResponse::from)
                .toList();
    }

    public TarifaConfig obtenerVigente(TipoVehiculo tipo) {
        return tarifaVigenteEntidad(tipo)
                .orElseThrow(() -> new ResourceNotFoundException("No hay tarifa configurada para " + tipo));
    }

    private java.util.Optional<TarifaConfig> tarifaVigenteEntidad(TipoVehiculo tipo) {
        return tarifaRepository.findFirstByTipoVehiculoAndActivaTrueOrderByVigenteDesdeDesc(tipo);
    }

    @Transactional
    public TarifaResponse actualizar(TarifaRequest request) {
        // Desactiva la tarifa vigente anterior (si existe) y crea una nueva.
        // Las sesiones ya iniciadas conservan su tarifaHoraAplicada congelada.
        tarifaVigenteEntidad(request.tipoVehiculo()).ifPresent(anterior -> {
            anterior.setActiva(false);
            tarifaRepository.save(anterior);
        });

        TarifaConfig nueva = TarifaConfig.builder()
                .tipoVehiculo(request.tipoVehiculo())
                .precioHora(request.precioHora())
                .vigenteDesde(LocalDateTime.now())
                .activa(true)
                .build();
        nueva = tarifaRepository.save(nueva);
        auditService.registrar("UPDATE", "TARIFA", nueva.getId(),
                "Nueva tarifa " + request.tipoVehiculo() + ": " + request.precioHora());
        return TarifaResponse.from(nueva);
    }

    public BigDecimal precioHoraVigente(TipoVehiculo tipo) {
        return obtenerVigente(tipo).getPrecioHora();
    }
}
