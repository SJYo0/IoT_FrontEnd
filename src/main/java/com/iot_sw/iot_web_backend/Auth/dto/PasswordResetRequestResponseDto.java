package com.iot_sw.iot_web_backend.Auth.dto;

import lombok.Builder;

@Builder
public record PasswordResetRequestResponseDto(
        String message,
        boolean emailSent,
        String resetCode
) {
}
