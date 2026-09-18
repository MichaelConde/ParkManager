package com.parking.config;

import com.parking.domain.Rol;
import com.parking.domain.Usuario;
import com.parking.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() == 0) {
            Usuario admin = Usuario.builder()
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .rol(Rol.ADMIN)
                    .activo(true)
                    .build();
            usuarioRepository.save(admin);

            Usuario cajero = Usuario.builder()
                    .username("cajero1")
                    .passwordHash(passwordEncoder.encode("cajero123"))
                    .rol(Rol.CAJERO)
                    .activo(true)
                    .build();
            usuarioRepository.save(cajero);

            log.info("Usuarios semilla creados: admin/admin123 (ADMIN), cajero1/cajero123 (CAJERO)");
        }
    }
}
