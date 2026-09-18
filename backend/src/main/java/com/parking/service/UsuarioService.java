package com.parking.service;

import com.parking.domain.Usuario;
import com.parking.dto.UsuarioRequest;
import com.parking.dto.UsuarioResponse;
import com.parking.exception.ConflictException;
import com.parking.exception.ResourceNotFoundException;
import com.parking.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream().map(UsuarioResponse::from).toList();
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        if (usuarioRepository.existsByUsername(request.username())) {
            throw new ConflictException("Ya existe un usuario con el nombre " + request.username());
        }
        Usuario usuario = Usuario.builder()
                .username(request.username())
                .passwordHash(passwordEncoder.encode(request.password()))
                .rol(request.rol())
                .activo(true)
                .build();
        usuario = usuarioRepository.save(usuario);
        auditService.registrar("CREATE", "USUARIO", usuario.getId(), "Usuario creado: " + usuario.getUsername());
        return UsuarioResponse.from(usuario);
    }

    @Transactional
    public UsuarioResponse cambiarEstado(Long id, boolean activo) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
        usuario.setActivo(activo);
        usuario = usuarioRepository.save(usuario);
        auditService.registrar("UPDATE", "USUARIO", usuario.getId(),
                (activo ? "Usuario activado: " : "Usuario desactivado: ") + usuario.getUsername());
        return UsuarioResponse.from(usuario);
    }
}
