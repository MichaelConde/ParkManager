package com.parking.service;

import com.parking.domain.TarifaConfig;
import com.parking.domain.TipoVehiculo;
import com.parking.dto.TarifaRequest;
import com.parking.repository.TarifaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TarifaServiceTest {

    @Mock private TarifaRepository tarifaRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private TarifaService tarifaService;

    @Test
    void actualizar_desactivaLaTarifaAnteriorYCreaUnaNuevaVigente() {
        TarifaConfig anterior = TarifaConfig.builder().id(1L).tipoVehiculo(TipoVehiculo.AUTO)
                .precioHora(new BigDecimal("3.50")).activa(true).build();

        when(tarifaRepository.findFirstByTipoVehiculoAndActivaTrueOrderByVigenteDesdeDesc(TipoVehiculo.AUTO))
                .thenReturn(Optional.of(anterior));
        when(tarifaRepository.save(any(TarifaConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        TarifaRequest request = new TarifaRequest(TipoVehiculo.AUTO, new BigDecimal("5.00"));
        var response = tarifaService.actualizar(request);

        assertThat(response.precioHora()).isEqualByComparingTo("5.00");
        assertThat(anterior.isActiva()).isFalse();

        ArgumentCaptor<TarifaConfig> captor = ArgumentCaptor.forClass(TarifaConfig.class);
        verify(tarifaRepository, times(2)).save(captor.capture());
        TarifaConfig nueva = captor.getAllValues().get(1);
        assertThat(nueva.isActiva()).isTrue();
        assertThat(nueva.getPrecioHora()).isEqualByComparingTo("5.00");
    }

    @Test
    void precioHoraVigente_devuelveElPrecioDeLaTarifaActiva() {
        TarifaConfig tarifa = TarifaConfig.builder().tipoVehiculo(TipoVehiculo.MOTO).precioHora(new BigDecimal("2.00")).activa(true).build();
        when(tarifaRepository.findFirstByTipoVehiculoAndActivaTrueOrderByVigenteDesdeDesc(TipoVehiculo.MOTO))
                .thenReturn(Optional.of(tarifa));

        BigDecimal precio = tarifaService.precioHoraVigente(TipoVehiculo.MOTO);

        assertThat(precio).isEqualByComparingTo("2.00");
    }
}
