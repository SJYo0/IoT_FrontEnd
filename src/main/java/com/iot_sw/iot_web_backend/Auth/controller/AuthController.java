package com.iot_sw.iot_web_backend.Auth.controller;

import com.iot_sw.iot_web_backend.Auth.dto.LoginRequestDto;
import com.iot_sw.iot_web_backend.Auth.dto.SignUpRequestDto;
import com.iot_sw.iot_web_backend.Auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 회원가입
    @PostMapping("/signup")
    public Map<String, String> signup(@Valid @RequestBody SignUpRequestDto dto) {
        authService.signup(dto);
        return Map.of("message", "회원가입 성공");
    }

    // 로그인
    @PostMapping("/login")
    public Map<String, String> login(@Valid @RequestBody LoginRequestDto dto, HttpServletRequest request) {
        authService.login(dto, request);
        return Map.of("message", "로그인 성공");
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication, HttpServletRequest request) {
        HttpSession session = request.getSession(true);
        AuthService.DeviceSessionContext context = authService.refreshDeviceContextInSession(session, authentication.getName());
        var devices = authService.getUserApprovedDevices(authentication.getName());
        return Map.of(
                "username", authentication.getName(),
                "deviceMac", context.mac(),
                "deviceIp", context.ip(),
                "devices", devices
        );
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken csrfToken) {
        return Map.of(
                "token", csrfToken.getToken(),
                "headerName", csrfToken.getHeaderName(),
                "parameterName", csrfToken.getParameterName()
        );
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();

        return Map.of("message", "로그아웃 성공");
    }
}