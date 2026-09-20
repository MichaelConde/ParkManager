package com.parking.service;

import com.parking.domain.*;
import com.parking.dto.IngresoRequest;
import com.parking.dto.ReciboResponse;
import com.parking.dto.SalidaRequest;
import com.parking.dto.SesionResponse;
import com.parking.exception.BusinessException;
import com.parking.repository.PagoRepository;
import com.parking.repository.PlazaRepository;
import com.parking.repository.SesionRepository;
import com.parking.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SesionServiceTest {

    @Mock private SesionRepository sesionRepository;
    @Mock private PlazaRepository plazaRepository;
    @Mock private PagoRepository pagoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private VehiculoService vehiculoService;
    @Mock private TarifaService tarifaService;
    @Mock private MembresiaService membresiaService;
    @Mock private QrCodeService qrCodeService;
    @Mock private AuditService auditService;

    @InjectMocks
    private SesionService sesionService;

    private Usuario cajero;
    private PlazaEstacionamiento plazaLibre;
    private Vehiculo vehiculo;

    @BeforeEach
    void setUp() {
        cajero = Usuario.builder().id(1L).username("cajero1").rol(Rol.CAJERO).build();
        plazaLibre = PlazaEstacionamiento.builder().id(10L).codigo("A-01").tipo(TipoVehiculo.AUTO).estado(EstadoPlaza.LIBRE).build();
        vehiculo = Vehiculo.builder().id(100L).placa("ABC-123").tipo(TipoVehiculo.AUTO).build();
    }

    @Test
    void registrarIngreso_asignaPlazaLibreYCongelaLaTarifaVigente() {
        IngresoRequest request = new IngresoRequest("abc-123", TipoVehiculo.AUTO, "Toyota Yaris", null, null);

        when(sesionRepository.findFirstByVehiculo_PlacaIgnoreCaseAndEstado("ABC-123", EstadoSesion.ACTIVA))
                .thenReturn(Optional.empty());
        when(plazaRepository.findFirstByTipoAndEstadoOrderByIdAsc(TipoVehiculo.AUTO, EstadoPlaza.LIBRE))
                .thenReturn(Optional.of(plazaLibre));
        when(vehiculoService.obtenerOCrear("ABC-123", TipoVehiculo.AUTO, "Toyota Yaris", null)).thenReturn(vehiculo);
        when(usuarioRepository.findByUsername("cajero1")).thenReturn(Optional.of(cajero));
        when(tarifaService.precioHoraVigente(TipoVehiculo.AUTO)).thenReturn(new BigDecimal("4.00"));
        when(qrCodeService.generarCodigoUnico()).thenReturn("QR123456789");
        when(qrCodeService.generarImagenBase64(anyString())).thenReturn("data:image/png;base64,AAAA");
        when(sesionRepository.save(any(SesionEstacionamiento.class))).thenAnswer(inv -> {
            SesionEstacionamiento s = inv.getArgument(0);
            s.setId(500L);
            return s;
        });

        SesionResponse response = sesionService.registrarIngreso(request, "cajero1");

        assertThat(response.plazaCodigo()).isEqualTo("A-01");
        assertThat(response.tarifaHoraAplicada()).isEqualByComparingTo("4.00");
        assertThat(response.estado()).isEqualTo("ACTIVA");
        assertThat(response.qrImageBase64()).isNotBlank();
        assertThat(plazaLibre.getEstado()).isEqualTo(EstadoPlaza.OCUPADA);
        verify(plazaRepository).save(plazaLibre);
        verify(auditService).registrar(eq("CREATE"), eq("SESION"), any(), anyString());
    }

    @Test
    void registrarIngreso_usaLaPlazaEspecificaCuandoSeIndicaPlazaId() {
        IngresoRequest request = new IngresoRequest("ABC-123", TipoVehiculo.AUTO, null, null, 10L);

        when(sesionRepository.findFirstByVehiculo_PlacaIgnoreCaseAndEstado("ABC-123", EstadoSesion.ACTIVA))
                .thenReturn(Optional.empty());
        when(plazaRepository.findById(10L)).thenReturn(Optional.of(plazaLibre));
        when(vehiculoService.obtenerOCrear("ABC-123", TipoVehiculo.AUTO, null, null)).thenReturn(vehiculo);
        when(usuarioRepository.findByUsername("cajero1")).thenReturn(Optional.of(cajero));
        when(tarifaService.precioHoraVigente(TipoVehiculo.AUTO)).thenReturn(new BigDecimal("4.00"));
        when(qrCodeService.generarCodigoUnico()).thenReturn("QR123456789");
        when(qrCodeService.generarImagenBase64(anyString())).thenReturn("data:image/png;base64,AAAA");
        when(sesionRepository.save(any(SesionEstacionamiento.class))).thenAnswer(inv -> {
            SesionEstacionamiento s = inv.getArgument(0);
            s.setId(500L);
            return s;
        });

        SesionResponse response = sesionService.registrarIngreso(request, "cajero1");

        assertThat(response.plazaCodigo()).isEqualTo("A-01");
        verify(plazaRepository, never()).findFirstByTipoAndEstadoOrderByIdAsc(any(), any());
        verify(plazaRepository).save(plazaLibre);
    }

    @Test
    void registrarIngreso_fallaSiLaPlazaEspecificaYaNoEstaLibre() {
        plazaLibre.setEstado(EstadoPlaza.OCUPADA);
        IngresoRequest request = new IngresoRequest("ABC-123", TipoVehiculo.AUTO, null, null, 10L);

        when(sesionRepository.findFirstByVehiculo_PlacaIgnoreCaseAndEstado("ABC-123", EstadoSesion.ACTIVA))
                .thenReturn(Optional.empty());
        when(plazaRepository.findById(10L)).thenReturn(Optional.of(plazaLibre));

        assertThatThrownBy(() -> sesionService.registrarIngreso(request, "cajero1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya no esta libre");
    }

    @Test
    void registrarIngreso_fallaSiLaPlazaEspecificaEsDeOtroTipo() {
        IngresoRequest request = new IngresoRequest("MOT-123", TipoVehiculo.MOTO, null, null, 10L);

        when(sesionRepository.findFirstByVehiculo_PlacaIgnoreCaseAndEstado("MOT-123", EstadoSesion.ACTIVA))
                .thenReturn(Optional.empty());
        when(plazaRepository.findById(10L)).thenReturn(Optional.of(plazaLibre));

        assertThatThrownBy(() -> sesionService.registrarIngreso(request, "cajero1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("es para AUTO");
    }

    @Test
    void registrarIngreso_fallaSiNoHayPlazasDisponibles() {
        IngresoRequest request = new IngresoRequest("ABC-123", TipoVehiculo.AUTO, null, null, null);

        when(sesionRepository.findFirstByVehiculo_PlacaIgnoreCaseAndEstado("ABC-123", EstadoSesion.ACTIVA))
                .thenReturn(Optional.empty());
        when(plazaRepository.findFirstByTipoAndEstadoOrderByIdAsc(TipoVehiculo.AUTO, EstadoPlaza.LIBRE))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> sesionService.registrarIngreso(request, "cajero1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("lleno");
    }

    @Test
    void registrarIngreso_fallaSiElVehiculoYaTieneSesionActiva() {
        IngresoRequest request = new IngresoRequest("ABC-123", TipoVehiculo.AUTO, null, null, null);
        SesionEstacionamiento activa = SesionEstacionamiento.builder().id(1L).build();

        when(sesionRepository.findFirstByVehiculo_PlacaIgnoreCaseAndEstado("ABC-123", EstadoSesion.ACTIVA))
                .thenReturn(Optional.of(activa));

        assertThatThrownBy(() -> sesionService.registrarIngreso(request, "cajero1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("sesion activa");
    }

    @Test
    void registrarSalida_calculaMontoRedondeandoHorasHaciaArriba() {
        // 90 minutos de estancia -> se cobran 2 horas
        SesionEstacionamiento sesion = SesionEstacionamiento.builder()
                .id(500L)
                .vehiculo(vehiculo)
                .plaza(plazaLibre)
                .usuario(cajero)
                .horaEntrada(LocalDateTime.now().minusMinutes(90))
                .tarifaHoraAplicada(new BigDecimal("4.00"))
                .estado(EstadoSesion.ACTIVA)
                .codigoQr("QR123456789")
                .build();
        plazaLibre.setEstado(EstadoPlaza.OCUPADA);

        SalidaRequest request = new SalidaRequest(500L, null, null, MetodoPago.EFECTIVO);

        when(sesionRepository.findById(500L)).thenReturn(Optional.of(sesion));
        when(sesionRepository.save(any(SesionEstacionamiento.class))).thenAnswer(inv -> inv.getArgument(0));
        when(pagoRepository.save(any(Pago.class))).thenAnswer(inv -> {
            Pago p = inv.getArgument(0);
            p.setId(900L);
            return p;
        });

        ReciboResponse recibo = sesionService.registrarSalida(request, "cajero1");

        assertThat(recibo.sesion().montoCobrado()).isEqualByComparingTo("8.00"); // 2 horas x 4.00
        assertThat(recibo.sesion().estado()).isEqualTo("CERRADA");
        assertThat(recibo.pago().metodo()).isEqualTo("EFECTIVO");
        assertThat(plazaLibre.getEstado()).isEqualTo(EstadoPlaza.LIBRE);
    }

    @Test
    void registrarSalida_omiteCobroSiElClienteTieneMembresiaActiva() {
        Cliente cliente = Cliente.builder().id(7L).nombre("Juan Perez").build();
        Vehiculo vehiculoConCliente = Vehiculo.builder().id(101L).placa("XYZ-999").tipo(TipoVehiculo.AUTO).cliente(cliente).build();
        SesionEstacionamiento sesion = SesionEstacionamiento.builder()
                .id(501L)
                .vehiculo(vehiculoConCliente)
                .plaza(plazaLibre)
                .usuario(cajero)
                .horaEntrada(LocalDateTime.now().minusHours(3))
                .tarifaHoraAplicada(new BigDecimal("4.00"))
                .estado(EstadoSesion.ACTIVA)
                .codigoQr("QR987654321")
                .build();

        SalidaRequest request = new SalidaRequest(501L, null, null, MetodoPago.EFECTIVO);

        when(sesionRepository.findById(501L)).thenReturn(Optional.of(sesion));
        when(membresiaService.tieneMembresiaActiva(7L)).thenReturn(true);
        when(sesionRepository.save(any(SesionEstacionamiento.class))).thenAnswer(inv -> inv.getArgument(0));
        when(pagoRepository.save(any(Pago.class))).thenAnswer(inv -> {
            Pago p = inv.getArgument(0);
            p.setId(901L);
            return p;
        });

        ReciboResponse recibo = sesionService.registrarSalida(request, "cajero1");

        assertThat(recibo.sesion().montoCobrado()).isEqualByComparingTo("0.00");
        assertThat(recibo.sesion().membresiaAplicada()).isTrue();
    }
}
