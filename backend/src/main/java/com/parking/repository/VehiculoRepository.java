package com.parking.repository;

import com.parking.domain.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {
    Optional<Vehiculo> findByPlacaIgnoreCase(String placa);
    List<Vehiculo> findByClienteId(Long clienteId);
    boolean existsByPlacaIgnoreCase(String placa);
}
