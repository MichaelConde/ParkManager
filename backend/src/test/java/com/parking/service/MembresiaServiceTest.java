package com.parking.service;

import com.parking.domain.Cliente;
import com.parking.domain.Membresia;
import com.parking.domain.PlanMembresia;
import com.parking.dto.AsignarMembresiaRequest;
import com.parking.exception.BusinessException;
import com.parking.repository.MembresiaRepository;
import com.parking.repository.PlanMembresiaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MembresiaServiceTest {

    @Mock private MembresiaRepository membresiaRepository;
    @Mock private PlanMembresiaRepository planMembresiaRepository;
    @Mock private ClienteService clienteService;
    @Mock private AuditService auditService;

    @InjectMocks
    private MembresiaService membresiaService;

    @Test
    void tieneMembresiaActiva_devuelveFalseSiNoHayClienteAsociado() {
        assertThat(membresiaService.tieneMembresiaActiva(null)).isFalse();
    }

    @Test
    void tieneMembresiaActiva_devuelveTrueCuandoExisteUnaVigenteHoy() {
        when(membresiaRepository.findActivaByCliente(eq(7L), any(LocalDate.class)))
                .thenReturn(Optional.of(Membresia.builder().id(1L).build()));

        assertThat(membresiaService.tieneMembresiaActiva(7L)).isTrue();
    }

    @Test
    void asignar_fallaSiExisteUnaMembresiaSolapadaParaElMismoCliente() {
        Cliente cliente = Cliente.builder().id(7L).nombre("Ana Diaz").build();
        PlanMembresia plan = PlanMembresia.builder().id(1L).nombre("Mensual Auto").duracionDias(30)
                .precio(new BigDecimal("120.00")).build();

        when(clienteService.obtener(7L)).thenReturn(cliente);
        when(planMembresiaRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(membresiaRepository.findSolapadas(eq(7L), any(), any()))
                .thenReturn(List.of(Membresia.builder().id(99L).build()));

        AsignarMembresiaRequest request = new AsignarMembresiaRequest(7L, 1L, LocalDate.now());

        assertThatThrownBy(() -> membresiaService.asignar(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("solapa");
    }
}
