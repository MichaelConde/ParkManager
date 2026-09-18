package com.parking.repository;

import com.parking.domain.Notificacion;
import com.parking.domain.TipoNotificacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findByOrderByFechaCreacionDesc();

    List<Notificacion> findByLeidaFalseOrderByFechaCreacionDesc();

    boolean existsByTipoAndReferenciaIdAndFechaCreacionAfter(TipoNotificacion tipo, Long referenciaId, LocalDateTime after);
}
