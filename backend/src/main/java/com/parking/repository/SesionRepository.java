package com.parking.repository;

import com.parking.domain.EstadoSesion;
import com.parking.domain.SesionEstacionamiento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SesionRepository extends JpaRepository<SesionEstacionamiento, Long> {

    Optional<SesionEstacionamiento> findFirstByVehiculo_PlacaIgnoreCaseAndEstado(String placa, EstadoSesion estado);

    Optional<SesionEstacionamiento> findByCodigoQr(String codigoQr);

    List<SesionEstacionamiento> findByEstado(EstadoSesion estado);

    long countByEstado(EstadoSesion estado);

    Page<SesionEstacionamiento> findByVehiculo_PlacaIgnoreCaseOrderByHoraEntradaDesc(String placa, Pageable pageable);

    Page<SesionEstacionamiento> findByVehiculo_Cliente_IdOrderByHoraEntradaDesc(Long clienteId, Pageable pageable);

    @Query("select s from SesionEstacionamiento s where s.estado = 'CERRADA' " +
            "and s.horaSalida between :desde and :hasta order by s.horaSalida")
    List<SesionEstacionamiento> findCerradasEntre(@Param("desde") LocalDateTime desde,
                                                    @Param("hasta") LocalDateTime hasta);

    @Query("select s.plaza.codigo as codigo, count(s) as total from SesionEstacionamiento s " +
            "where s.horaEntrada between :desde and :hasta group by s.plaza.codigo order by count(s) desc")
    List<PlazaUso> findPlazasMasUsadas(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    interface PlazaUso {
        String getCodigo();
        Long getTotal();
    }
}
