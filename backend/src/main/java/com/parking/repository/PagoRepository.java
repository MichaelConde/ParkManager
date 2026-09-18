package com.parking.repository;

import com.parking.domain.MetodoPago;
import com.parking.domain.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, Long> {

    Optional<Pago> findBySesionId(Long sesionId);

    @Query("select p from Pago p where p.fechaPago between :desde and :hasta order by p.fechaPago")
    List<Pago> findEntreFechas(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Query("select p.metodo as metodo, sum(p.monto) as total from Pago p " +
            "where p.fechaPago between :desde and :hasta group by p.metodo")
    List<TotalPorMetodo> sumarPorMetodo(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    interface TotalPorMetodo {
        MetodoPago getMetodo();
        java.math.BigDecimal getTotal();
    }
}
