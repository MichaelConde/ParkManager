package com.parking.repository;

import com.parking.domain.Membresia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MembresiaRepository extends JpaRepository<Membresia, Long> {

    @Query("select m from Membresia m where m.cliente.id = :clienteId and m.activa = true " +
            "and :hoy between m.fechaInicio and m.fechaFin")
    Optional<Membresia> findActivaByCliente(@Param("clienteId") Long clienteId, @Param("hoy") LocalDate hoy);

    @Query("select m from Membresia m where m.activa = true and m.fechaFin between :hoy and :limite")
    List<Membresia> findPorVencer(@Param("hoy") LocalDate hoy, @Param("limite") LocalDate limite);

    List<Membresia> findByClienteIdOrderByFechaInicioDesc(Long clienteId);

    @Query("select m from Membresia m where m.activa = true and " +
            "((m.fechaInicio <= :fechaFin) and (m.fechaFin >= :fechaInicio)) and m.cliente.id = :clienteId")
    List<Membresia> findSolapadas(@Param("clienteId") Long clienteId,
                                   @Param("fechaInicio") LocalDate fechaInicio,
                                   @Param("fechaFin") LocalDate fechaFin);
}
