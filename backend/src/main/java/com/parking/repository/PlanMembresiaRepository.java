package com.parking.repository;

import com.parking.domain.PlanMembresia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanMembresiaRepository extends JpaRepository<PlanMembresia, Long> {
    List<PlanMembresia> findByActivoTrue();
}
