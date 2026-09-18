package com.parking.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sesiones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SesionEstacionamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehiculo_id", nullable = false)
    private Vehiculo vehiculo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plaza_id", nullable = false)
    private PlazaEstacionamiento plaza;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "hora_entrada", nullable = false)
    private LocalDateTime horaEntrada;

    @Column(name = "hora_salida")
    private LocalDateTime horaSalida;

    @Column(name = "tarifa_hora_aplicada", nullable = false, precision = 10, scale = 2)
    private BigDecimal tarifaHoraAplicada;

    @Column(name = "duracion_minutos")
    private Integer duracionMinutos;

    @Column(name = "monto_cobrado", precision = 10, scale = 2)
    private BigDecimal montoCobrado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private EstadoSesion estado = EstadoSesion.ACTIVA;

    @Column(name = "membresia_aplicada", nullable = false)
    @Builder.Default
    private boolean membresiaAplicada = false;

    @Column(name = "codigo_qr", nullable = false, unique = true, length = 64)
    private String codigoQr;
}
