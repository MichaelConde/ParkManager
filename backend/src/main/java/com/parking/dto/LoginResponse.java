package com.parking.dto;

public record LoginResponse(
        String token,
        String username,
        String rol,
        long expiraEnMinutos
) {
}
