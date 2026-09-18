package com.parking.repository;

import com.parking.domain.TarifaConfig;
import com.parking.domain.TipoVehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TarifaRepository extends JpaRepository<TarifaConfig, Long> {
    Optional<TarifaConfig> findFirstByTipoVehiculoAndActivaTrueOrderByVigenteDesdeDesc(TipoVehiculo tipoVehiculo);
    List<TarifaConfig> findByTipoVehiculoOrderByVigenteDesdeDesc(TipoVehiculo tipoVehiculo);
}
