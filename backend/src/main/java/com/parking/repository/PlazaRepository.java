package com.parking.repository;

import com.parking.domain.EstadoPlaza;
import com.parking.domain.PlazaEstacionamiento;
import com.parking.domain.TipoVehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlazaRepository extends JpaRepository<PlazaEstacionamiento, Long> {

    Optional<PlazaEstacionamiento> findFirstByTipoAndEstadoOrderByIdAsc(TipoVehiculo tipo, EstadoPlaza estado);

    List<PlazaEstacionamiento> findByTipo(TipoVehiculo tipo);

    long countByTipo(TipoVehiculo tipo);

    long countByTipoAndEstado(TipoVehiculo tipo, EstadoPlaza estado);

    boolean existsByCodigoIgnoreCase(String codigo);

    List<PlazaEstacionamiento> findByZonaIgnoreCaseAndTipo(String zona, TipoVehiculo tipo);

    List<PlazaEstacionamiento> findByCodigoStartingWithIgnoreCase(String prefijo);
}
