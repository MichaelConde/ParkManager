package com.parking.service;

import com.parking.domain.AuditLog;
import com.parking.repository.AuditLogRepository;
import com.parking.repository.UsuarioRepository;
import com.parking.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UsuarioRepository usuarioRepository;

    public void registrar(String accion, String entidad, Long entidadId, String detalle) {
        AuditLog.AuditLogBuilder builder = AuditLog.builder()
                .accion(accion)
                .entidad(entidad)
                .entidadId(entidadId)
                .detalle(detalle);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthenticatedUser authenticatedUser) {
            usuarioRepository.findById(authenticatedUser.getId()).ifPresent(builder::usuario);
        }

        auditLogRepository.save(builder.build());
    }
}
