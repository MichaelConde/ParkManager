package com.parking.exception;

import java.time.LocalDateTime;
import java.util.List;

public record ApiError(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        List<String> detalles
) {
    public static ApiError of(int status, String error, String message) {
        return new ApiError(LocalDateTime.now(), status, error, message, null);
    }

    public static ApiError of(int status, String error, String message, List<String> detalles) {
        return new ApiError(LocalDateTime.now(), status, error, message, detalles);
    }
}
