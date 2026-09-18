package com.parking.scheduler;

import com.parking.domain.EstadoPlaza;
import com.parking.domain.Membresia;
import com.parking.domain.TipoNotificacion;
import com.parking.domain.TipoVehiculo;
import com.parking.repository.PlazaRepository;
import com.parking.service.MembresiaService;
import com.parking.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificacionScheduler {

    private final MembresiaService membresiaService;
    private final NotificacionService notificacionService;
    private final PlazaRepository plazaRepository;

    @Value("${app.membresia.dias-aviso-vencimiento:7}")
    private int diasAvisoVencimiento;

    @Value("${app.ocupacion.umbral-alerta-porcentaje:90}")
    private int umbralOcupacion;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /** Revisa membresias por vencer una vez al dia (07:00). */
    @Scheduled(cron = "0 0 7 * * *")
    public void avisarMembresiasPorVencer() {
        for (Membresia membresia : membresiaService.porVencerEn(diasAvisoVencimiento)) {
            if (membresia.isAvisoVencimientoEnviado()) {
                continue;
            }
            String mensaje = "La membresia de " + membresia.getCliente().getNombre()
                    + " (" + membresia.getPlan().getNombre() + ") vence el "
                    + membresia.getFechaFin().format(FMT);
            notificacionService.crearSiNoExisteHoy(TipoNotificacion.MEMBRESIA_VENCE, membresia.getId(), mensaje);
            membresiaService.marcarAvisoEnviado(membresia);
        }
    }

    /** Evalua la ocupacion actual cada 15 minutos y alerta si supera el umbral configurado. */
    @Scheduled(fixedRate = 15 * 60 * 1000)
    public void avisarOcupacionAlta() {
        for (TipoVehiculo tipo : TipoVehiculo.values()) {
            long total = plazaRepository.countByTipo(tipo);
            if (total == 0) {
                continue;
            }
            long ocupadas = plazaRepository.countByTipoAndEstado(tipo, EstadoPlaza.OCUPADA);
            double porcentaje = (ocupadas * 100.0) / total;
            if (porcentaje >= umbralOcupacion) {
                String mensaje = "Ocupacion de " + tipo + " al " + Math.round(porcentaje) + "% ("
                        + ocupadas + "/" + total + " plazas)";
                notificacionService.crearSiNoExisteHoy(TipoNotificacion.OCUPACION, (long) tipo.ordinal(), mensaje);
            }
        }
    }
}
