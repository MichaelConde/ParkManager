package com.parking.service;

import com.parking.domain.EstadoPlaza;
import com.parking.domain.PlazaEstacionamiento;
import com.parking.domain.TipoVehiculo;
import com.parking.dto.PlazaResponse;
import com.parking.dto.ZonaAjusteRequest;
import com.parking.dto.ZonaRequest;
import com.parking.exception.BusinessException;
import com.parking.exception.ResourceNotFoundException;
import com.parking.repository.PlazaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlazaServiceTest {

    @Mock private PlazaRepository plazaRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private PlazaService plazaService;

    private PlazaEstacionamiento plaza(String codigo, EstadoPlaza estado) {
        return PlazaEstacionamiento.builder().codigo(codigo).tipo(TipoVehiculo.AUTO).zona("Piso 2").estado(estado).build();
    }

    @Test
    void crearZona_generaCodigosSecuencialesDesdeUno() {
        ZonaRequest request = new ZonaRequest("Piso 2", TipoVehiculo.AUTO, "C", 3);

        when(plazaRepository.findByCodigoStartingWithIgnoreCase("C-")).thenReturn(List.of());
        when(plazaRepository.existsByCodigoIgnoreCase(anyString())).thenReturn(false);
        when(plazaRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        List<PlazaResponse> creadas = plazaService.crearZona(request);

        assertThat(creadas).extracting(PlazaResponse::codigo).containsExactly("C-01", "C-02", "C-03");
        verify(auditService).registrar(eq("CREATE"), eq("PLAZA"), any(), anyString());
    }

    @Test
    void crearZona_continuaLaNumeracionSiYaExistenPlazasConEsePrefijo() {
        ZonaRequest request = new ZonaRequest("Piso 2", TipoVehiculo.AUTO, "C", 2);

        when(plazaRepository.findByCodigoStartingWithIgnoreCase("C-"))
                .thenReturn(List.of(plaza("C-01", EstadoPlaza.LIBRE), plaza("C-02", EstadoPlaza.OCUPADA)));
        when(plazaRepository.existsByCodigoIgnoreCase(anyString())).thenReturn(false);
        when(plazaRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        List<PlazaResponse> creadas = plazaService.crearZona(request);

        assertThat(creadas).extracting(PlazaResponse::codigo).containsExactly("C-03", "C-04");
    }

    @Test
    void crearZona_fallaSiExcedeElMaximoPorLote() {
        ZonaRequest request = new ZonaRequest("Piso 2", TipoVehiculo.AUTO, "C", 201);

        assertThatThrownBy(() -> plazaService.crearZona(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("200");
    }

    @Test
    void ajustarZona_fallaSiLaZonaNoExiste() {
        ZonaAjusteRequest request = new ZonaAjusteRequest("Piso 9", TipoVehiculo.AUTO, 5);
        when(plazaRepository.findByZonaIgnoreCaseAndTipo("Piso 9", TipoVehiculo.AUTO)).thenReturn(List.of());

        assertThatThrownBy(() -> plazaService.ajustarZona(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void ajustarZona_agregaPlazasContinuandoElPrefijoExistente() {
        List<PlazaEstacionamiento> actuales = List.of(plaza("A-01", EstadoPlaza.LIBRE), plaza("A-02", EstadoPlaza.OCUPADA));
        List<PlazaEstacionamiento> finalEsperado = List.of(
                plaza("A-01", EstadoPlaza.LIBRE), plaza("A-02", EstadoPlaza.OCUPADA),
                plaza("A-03", EstadoPlaza.LIBRE), plaza("A-04", EstadoPlaza.LIBRE));
        ZonaAjusteRequest request = new ZonaAjusteRequest("Piso 2", TipoVehiculo.AUTO, 4);

        when(plazaRepository.findByZonaIgnoreCaseAndTipo("Piso 2", TipoVehiculo.AUTO))
                .thenReturn(actuales, finalEsperado);
        when(plazaRepository.findByCodigoStartingWithIgnoreCase("A-")).thenReturn(actuales);
        when(plazaRepository.existsByCodigoIgnoreCase(anyString())).thenReturn(false);
        when(plazaRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        List<PlazaResponse> resultado = plazaService.ajustarZona(request);

        ArgumentCaptor<List<PlazaEstacionamiento>> captor = ArgumentCaptor.forClass(List.class);
        verify(plazaRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).extracting(PlazaEstacionamiento::getCodigo).containsExactly("A-03", "A-04");
        assertThat(resultado).hasSize(4);
    }

    @Test
    void ajustarZona_quitaPrimeroLasPlazasLibresConCodigoMasAlto() {
        List<PlazaEstacionamiento> actuales = List.of(
                plaza("A-01", EstadoPlaza.LIBRE), plaza("A-02", EstadoPlaza.OCUPADA),
                plaza("A-03", EstadoPlaza.LIBRE), plaza("A-04", EstadoPlaza.LIBRE));
        ZonaAjusteRequest request = new ZonaAjusteRequest("Piso 2", TipoVehiculo.AUTO, 2);

        when(plazaRepository.findByZonaIgnoreCaseAndTipo("Piso 2", TipoVehiculo.AUTO))
                .thenReturn(actuales, List.of(actuales.get(0), actuales.get(1)));

        List<PlazaResponse> resultado = plazaService.ajustarZona(request);

        ArgumentCaptor<List<PlazaEstacionamiento>> captor = ArgumentCaptor.forClass(List.class);
        verify(plazaRepository).deleteAll(captor.capture());
        assertThat(captor.getValue()).extracting(PlazaEstacionamiento::getCodigo).containsExactly("A-04", "A-03");
        assertThat(resultado).hasSize(2);
    }

    @Test
    void ajustarZona_fallaSiNoHaySuficientesPlazasLibresParaQuitar() {
        List<PlazaEstacionamiento> actuales = List.of(
                plaza("A-01", EstadoPlaza.OCUPADA), plaza("A-02", EstadoPlaza.OCUPADA), plaza("A-03", EstadoPlaza.LIBRE));
        ZonaAjusteRequest request = new ZonaAjusteRequest("Piso 2", TipoVehiculo.AUTO, 0);

        when(plazaRepository.findByZonaIgnoreCaseAndTipo("Piso 2", TipoVehiculo.AUTO)).thenReturn(actuales);

        assertThatThrownBy(() -> plazaService.ajustarZona(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("solo hay 1 libres");
        verify(plazaRepository, never()).deleteAll(any());
    }
}
