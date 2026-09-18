package com.parking.service;

import com.parking.dto.LoginRequest;
import com.parking.dto.LoginResponse;
import com.parking.security.AuthenticatedUser;
import com.parking.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Value("${app.jwt.expiration-minutes}")
    private long expirationMinutes;

    public LoginResponse login(LoginRequest request) {
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRol());
        return new LoginResponse(token, user.getUsername(), user.getRol(), expirationMinutes);
    }
}
