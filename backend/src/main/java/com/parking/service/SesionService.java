package com.parking.service;

import com.parking.domain.*;
import com.parking.dto.*;
import com.parking.exception.BusinessException;
import com.parking.exception.ResourceNotFoundException;
import com.parking.repository.PagoRepository;
import com.parking.repository.PlazaRepository;
import com.parking.repository.SesionRepository;
import com.parking.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SesionService {

    private final SesionRepository sesionRepository;
    private final PlazaRepository plazaRepository;
    private final PagoRepository pagoRepository;
    private final UsuarioRepository usuarioRepository;

    private final VehiculoService vehiculoService;
    private final TarifaService tarifaService;
    private final MembresiaService membresiaService;
    private final QrCodeService qrCodeService;
    private final AuditService auditService;

    @Transactional
    public SesionResponse registrarIngreso(IngresoRequest request, String usernameCajero) {
        String placa = request.placa().toUpperCase();

        sesionRepository.findFirstByVehiculo_PlacaIgnoreCaseAndEstado(placa, EstadoSesion.ACTIVA)
                .ifPresent(s -> {
                    throw new BusinessException("El vehiculo " + placa + " ya tiene una sesion activa");
                });

        PlazaEstacionamiento plaza = request.plazaId() != null
                ? obtenerPlazaEspecifica(request.plazaId(), request.tipo())
                : plazaRepository.findFirstByTipoAndEstadoOrderByIdAsc(request.tipo(), EstadoPlaza.LIBRE)
                        .orElseThrow(() -> new BusinessException("Estacionamiento lleno: no hay plazas disponibles para " + request.tipo()));

        Vehiculo vehiculo = vehiculoService.obtenerOCrear(placa, request.tipo(), request.modelo(), request.clienteId());
        Usuario cajero = usuarioActual(usernameCajero);
        BigDecimal tarifaHora = tarifaService.precioHoraVigente(request.tipo());
        String codigoQr = qrCodeService.generarCodigoUnico();

        SesionEstacionamiento sesion = SesionEstacionamiento.builder()
                .vehiculo(vehiculo)
                .plaza(plaza)
                .usuario(cajero)
                .horaEntrada(LocalDateTime.now())
                .tarifaHoraAplicada(tarifaHora)
                .estado(EstadoSesion.ACTIVA)
                .membresiaAplicada(false)
                .codigoQr(codigoQr)
                .build();
        sesion = sesionRepository.save(sesion);

        plaza.setEstado(EstadoPlaza.OCUPADA);
        plazaRepository.save(plaza);

        auditService.registrar("CREATE", "SESION", sesion.getId(),
                "Ingreso registrado: " + placa + " -> plaza " + plaza.getCodigo());

        String qrImage = qrCodeService.generarImagenBase64(codigoQr);
        return SesionResponse.from(sesion, qrImage);
    }

    public SesionResponse consultarActivaPorPlaca(String placa) {
        SesionEstacionamiento sesion = obtenerActivaPorPlaca(placa);
        return proyectarConEstimado(sesion);
    }

    public SesionResponse buscarPorCodigoQr(String codigoQr) {
        SesionEstacionamiento sesion = sesionRepository.findByCodigoQr(codigoQr)
                .orElseThrow(() -> new ResourceNotFoundException("No existe una sesion con ese codigo QR"));
        return sesion.getEstado() == EstadoSesion.ACTIVA ? proyectarConEstimado(sesion) : SesionResponse.from(sesion);
    }

    public List<SesionResponse> listarActivas() {
        return sesionRepository.findByEstado(EstadoSesion.ACTIVA).stream()
                .map(this::proyectarConEstimado)
                .toList();
    }

    @Transactional
    public ReciboResponse registrarSalida(SalidaRequest request, String usernameCajero) {
        SesionEstacionamiento sesion = resolverSesionActiva(request);

        LocalDateTime horaSalida = LocalDateTime.now();
        long minutos = Duration.between(sesion.getHoraEntrada(), horaSalida).toMinutes();
        long horas = minutos <= 0 ? 1 : (long) Math.ceil(minutos / 60.0);

        boolean clienteTieneMembresia = sesion.getVehiculo().getCliente() != null
                && membresiaService.tieneMembresiaActiva(sesion.getVehiculo().getCliente().getId());

        BigDecimal monto = clienteTieneMembresia
                ? BigDecimal.ZERO
                : sesion.getTarifaHoraAplicada().multiply(BigDecimal.valueOf(horas)).setScale(2, RoundingMode.HALF_UP);

        sesion.setHoraSalida(horaSalida);
        sesion.setDuracionMinutos((int) minutos);
        sesion.setMontoCobrado(monto);
        sesion.setEstado(EstadoSesion.CERRADA);
        sesion.setMembresiaAplicada(clienteTieneMembresia);
        sesion = sesionRepository.save(sesion);

        Pago pago = Pago.builder()
                .sesion(sesion)
                .monto(monto)
                .metodo(request.metodoPago())
                .fechaPago(horaSalida)
                .build();
        pago = pagoRepository.save(pago);

        PlazaEstacionamiento plaza = sesion.getPlaza();
        plaza.setEstado(EstadoPlaza.LIBRE);
        plazaRepository.save(plaza);

        auditService.registrar("UPDATE", "SESION", sesion.getId(),
                "Salida registrada: " + sesion.getVehiculo().getPlaca() + " monto=" + monto);

        return new ReciboResponse(SesionResponse.from(sesion), PagoResponse.from(pago));
    }

    public Page<HistorialItemResponse> historialPorPlaca(String placa, Pageable pageable) {
        return sesionRepository.findByVehiculo_PlacaIgnoreCaseOrderByHoraEntradaDesc(placa, pageable)
                .map(this::aHistorialItem);
    }

    public Page<HistorialItemResponse> historialPorCliente(Long clienteId, Pageable pageable) {
        return sesionRepository.findByVehiculo_Cliente_IdOrderByHoraEntradaDesc(clienteId, pageable)
                .map(this::aHistorialItem);
    }

    private HistorialItemResponse aHistorialItem(SesionEstacionamiento s) {
        return new HistorialItemResponse(
                s.getId(),
                s.getVehiculo().getPlaca(),
                s.getPlaza().getCodigo(),
                s.getHoraEntrada(),
                s.getHoraSalida(),
                s.getDuracionMinutos(),
                s.getMontoCobrado(),
                s.isMembresiaAplicada(),
                pagoRepository.findBySesionId(s.getId()).map(p -> p.getMetodo().name()).orElse(null)
        );
    }

    // --- helpers internos ---

    private PlazaEstacionamiento obtenerPlazaEspecifica(Long plazaId, TipoVehiculo tipo) {
        PlazaEstacionamiento plaza = plazaRepository.findById(plazaId)
                .orElseThrow(() -> new ResourceNotFoundException("Plaza no encontrada: " + plazaId));
        if (plaza.getEstado() != EstadoPlaza.LIBRE) {
            throw new BusinessException("La plaza " + plaza.getCodigo() + " ya no esta libre");
        }
        if (plaza.getTipo() != tipo) {
            throw new BusinessException("La plaza " + plaza.getCodigo() + " es para " + plaza.getTipo() + ", no para " + tipo);
        }
        return plaza;
    }

    private SesionEstacionamiento resolverSesionActiva(SalidaRequest request) {
        if (request.sesionId() != null) {
            SesionEstacionamiento sesion = sesionRepository.findById(request.sesionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sesion no encontrada: " + request.sesionId()));
            validarActiva(sesion);
            return sesion;
        }
        if (request.codigoQr() != null && !request.codigoQr().isBlank()) {
            SesionEstacionamiento sesion = sesionRepository.findByCodigoQr(request.codigoQr())
                    .orElseThrow(() -> new ResourceNotFoundException("No existe una sesion con ese codigo QR"));
            validarActiva(sesion);
            return sesion;
        }
        if (request.placa() != null && !request.placa().isBlank()) {
            return obtenerActivaPorPlaca(request.placa());
        }
        throw new BusinessException("Debe indicar sesionId, placa o codigoQr para registrar la salida");
    }

    private void validarActiva(SesionEstacionamiento sesion) {
        if (sesion.getEstado() != EstadoSesion.ACTIVA) {
            throw new BusinessException("La sesion ya se encuentra cerrada");
        }
    }

    private SesionEstacionamiento obtenerActivaPorPlaca(String placa) {
        return sesionRepository.findFirstByVehiculo_PlacaIgnoreCaseAndEstado(placa.toUpperCase(), EstadoSesion.ACTIVA)
                .orElseThrow(() -> new ResourceNotFoundException("No hay una sesion activa para la placa " + placa));
    }

    private SesionResponse proyectarConEstimado(SesionEstacionamiento sesion) {
        long minutos = Duration.between(sesion.getHoraEntrada(), LocalDateTime.now()).toMinutes();
        long horas = minutos <= 0 ? 1 : (long) Math.ceil(minutos / 60.0);

        boolean clienteTieneMembresia = sesion.getVehiculo().getCliente() != null
                && membresiaService.tieneMembresiaActiva(sesion.getVehiculo().getCliente().getId());
        BigDecimal estimado = clienteTieneMembresia
                ? BigDecimal.ZERO
                : sesion.getTarifaHoraAplicada().multiply(BigDecimal.valueOf(horas)).setScale(2, RoundingMode.HALF_UP);

        SesionEstacionamiento copia = SesionEstacionamiento.builder()
                .id(sesion.getId())
                .vehiculo(sesion.getVehiculo())
                .plaza(sesion.getPlaza())
                .usuario(sesion.getUsuario())
                .horaEntrada(sesion.getHoraEntrada())
                .horaSalida(null)
                .tarifaHoraAplicada(sesion.getTarifaHoraAplicada())
                .duracionMinutos((int) minutos)
                .montoCobrado(estimado)
                .estado(sesion.getEstado())
                .membresiaAplicada(clienteTieneMembresia)
                .codigoQr(sesion.getCodigoQr())
                .build();
        return SesionResponse.from(copia);
    }

    private Usuario usuarioActual(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
    }
}
