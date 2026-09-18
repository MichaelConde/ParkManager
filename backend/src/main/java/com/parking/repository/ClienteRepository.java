package com.parking.repository;

import com.parking.domain.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    @Query("select c from Cliente c where lower(c.nombre) like lower(concat('%', :texto, '%')) " +
            "or lower(c.documento) like lower(concat('%', :texto, '%'))")
    List<Cliente> buscar(@Param("texto") String texto);

    Optional<Cliente> findByDocumento(String documento);
}
