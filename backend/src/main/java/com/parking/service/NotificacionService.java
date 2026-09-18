package com.parking.service;

import com.parking.domain.Notificacion;
import com.parking.domain.TipoNotificacion;
import com.parking.dto.NotificacionResponse;
import com.parking.exception.ResourceNotFoundException;
import com.parking.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    public List<NotificacionResponse> listar(boolean soloNoLeidas) {
        List<Notificacion> notificaciones = soloNoLeidas
                ? notificacionRepository.findByLeidaFalseOrderByFechaCreacionDesc()
                : notificacionRepository.findByOrderByFechaCreacionDesc();
        return notificaciones.stream().map(NotificacionResponse::from).toList();
    }

    @Transactional
    public void marcarLeida(Long id) {
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notificacion no encontrada: " + id));
        notificacion.setLeida(true);
        notificacionRepository.save(notificacion);
    }

    @Transactional
    public void crearSiNoExisteHoy(TipoNotificacion tipo, Long referenciaId, String mensaje) {
        LocalDateTime inicioDelDia = LocalDateTime.now().toLocalDate().atStartOfDay();
        boolean yaExiste = notificacionRepository.existsByTipoAndReferenciaIdAndFechaCreacionAfter(
                tipo, referenciaId, inicioDelDia);
        if (!yaExiste) {
            notificacionRepository.save(Notificacion.builder()
                    .tipo(tipo)
                    .referenciaId(referenciaId)
                    .mensaje(mensaje)
                    .build());
        }
    }
}
