package com.parking.service;

import com.parking.domain.Cliente;
import com.parking.domain.Membresia;
import com.parking.domain.PlanMembresia;
import com.parking.dto.AsignarMembresiaRequest;
import com.parking.dto.MembresiaResponse;
import com.parking.dto.PlanMembresiaRequest;
import com.parking.dto.PlanMembresiaResponse;
import com.parking.exception.BusinessException;
import com.parking.exception.ResourceNotFoundException;
import com.parking.repository.MembresiaRepository;
import com.parking.repository.PlanMembresiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MembresiaService {

    private final MembresiaRepository membresiaRepository;
    private final PlanMembresiaRepository planMembresiaRepository;
    private final ClienteService clienteService;
    private final AuditService auditService;

    // --- Planes ---

    public List<PlanMembresiaResponse> listarPlanes() {
        return planMembresiaRepository.findAll().stream().map(PlanMembresiaResponse::from).toList();
    }

    @Transactional
    public PlanMembresiaResponse crearPlan(PlanMembresiaRequest request) {
        PlanMembresia plan = PlanMembresia.builder()
                .nombre(request.nombre())
                .duracionDias(request.duracionDias())
                .precio(request.precio())
                .descripcion(request.descripcion())
                .activo(true)
                .build();
        plan = planMembresiaRepository.save(plan);
        auditService.registrar("CREATE", "PLAN_MEMBRESIA", plan.getId(), "Plan creado: " + plan.getNombre());
        return PlanMembresiaResponse.from(plan);
    }

    @Transactional
    public PlanMembresiaResponse actualizarPlan(Long id, PlanMembresiaRequest request) {
        PlanMembresia plan = planMembresiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan no encontrado: " + id));
        plan.setNombre(request.nombre());
        plan.setDuracionDias(request.duracionDias());
        plan.setPrecio(request.precio());
        plan.setDescripcion(request.descripcion());
        plan = planMembresiaRepository.save(plan);
        auditService.registrar("UPDATE", "PLAN_MEMBRESIA", plan.getId(), "Plan actualizado: " + plan.getNombre());
        return PlanMembresiaResponse.from(plan);
    }

    @Transactional
    public void desactivarPlan(Long id) {
        PlanMembresia plan = planMembresiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan no encontrado: " + id));
        plan.setActivo(false);
        planMembresiaRepository.save(plan);
        auditService.registrar("UPDATE", "PLAN_MEMBRESIA", plan.getId(), "Plan desactivado: " + plan.getNombre());
    }

    // --- Membresias ---

    public List<MembresiaResponse> listar() {
        return membresiaRepository.findAll().stream().map(MembresiaResponse::from).toList();
    }

    public List<MembresiaResponse> historialPorCliente(Long clienteId) {
        return membresiaRepository.findByClienteIdOrderByFechaInicioDesc(clienteId).stream()
                .map(MembresiaResponse::from).toList();
    }

    @Transactional
    public MembresiaResponse asignar(AsignarMembresiaRequest request) {
        Cliente cliente = clienteService.obtener(request.clienteId());
        PlanMembresia plan = planMembresiaRepository.findById(request.planId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan no encontrado: " + request.planId()));

        LocalDate inicio = request.fechaInicio() != null ? request.fechaInicio() : LocalDate.now();
        LocalDate fin = inicio.plusDays(plan.getDuracionDias());

        List<Membresia> solapadas = membresiaRepository.findSolapadas(cliente.getId(), inicio, fin);
        if (!solapadas.isEmpty()) {
            throw new BusinessException("El cliente ya tiene una membresia activa que se solapa con ese periodo");
        }

        Membresia membresia = Membresia.builder()
                .cliente(cliente)
                .plan(plan)
                .fechaInicio(inicio)
                .fechaFin(fin)
                .activa(true)
                .avisoVencimientoEnviado(false)
                .build();
        membresia = membresiaRepository.save(membresia);
        auditService.registrar("CREATE", "MEMBRESIA", membresia.getId(),
                "Membresia asignada a " + cliente.getNombre() + " (" + plan.getNombre() + ")");
        return MembresiaResponse.from(membresia);
    }

    /**
     * Verifica si el cliente dueno del vehiculo tiene una membresia activa hoy.
     * Se usa al cerrar una sesion para decidir si el cobro se omite.
     */
    public boolean tieneMembresiaActiva(Long clienteId) {
        if (clienteId == null) {
            return false;
        }
        Optional<Membresia> activa = membresiaRepository.findActivaByCliente(clienteId, LocalDate.now());
        return activa.isPresent();
    }

    public List<Membresia> porVencerEn(int dias) {
        LocalDate hoy = LocalDate.now();
        return membresiaRepository.findPorVencer(hoy, hoy.plusDays(dias));
    }

    @Transactional
    public void marcarAvisoEnviado(Membresia membresia) {
        membresia.setAvisoVencimientoEnviado(true);
        membresiaRepository.save(membresia);
    }
}
