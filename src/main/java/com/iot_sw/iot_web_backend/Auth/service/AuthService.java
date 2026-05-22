package com.iot_sw.iot_web_backend.Auth.service;

import com.iot_sw.iot_web_backend.Auth.dto.LoginRequestDto;
import com.iot_sw.iot_web_backend.Auth.dto.SignUpRequestDto;
import com.iot_sw.iot_web_backend.Auth.entity.User;
import com.iot_sw.iot_web_backend.Auth.entity.UserLog;
import com.iot_sw.iot_web_backend.Auth.repository.UserLogRepository;
import com.iot_sw.iot_web_backend.Auth.repository.UserRepository;
import com.iot_sw.iot_web_backend.device.entity.Device;
import com.iot_sw.iot_web_backend.device.enums.DeviceStatus;
import com.iot_sw.iot_web_backend.device.repository.DeviceRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Comparator;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.TOO_MANY_REQUESTS;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
public class AuthService {
    public static final String SESSION_DEVICE_MAC_KEY = "SESSION_DEVICE_MAC";
    public static final String SESSION_DEVICE_IP_KEY = "SESSION_DEVICE_IP";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final LoginAttemptService loginAttemptService;
    private final DeviceRepository deviceRepository;
    private final UserLogRepository userLogRepository;

    // 회원가입
    public void signup(SignUpRequestDto dto) {
        String username = dto.getUsername().trim();
        String email = dto.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(CONFLICT, "이미 존재하는 아이디입니다.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(CONFLICT, "이미 사용 중인 이메일입니다.");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setEmail(email);

        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(CONFLICT, "이미 사용 중인 아이디 또는 이메일입니다.");
        }
    }

    // 로그인
    public void login(LoginRequestDto dto, HttpServletRequest request) {
        String username = dto.getUsername().trim();
        String attemptKey = username + ":" + request.getRemoteAddr();

        if (loginAttemptService.isBlocked(attemptKey)) {
            throw new ResponseStatusException(TOO_MANY_REQUESTS, "로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(username, dto.getPassword())
            );

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            HttpSession session = request.getSession(true);
            request.changeSessionId();
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
            refreshDeviceContextInSession(session, username);
            createLoginLog(authentication.getName());
            loginAttemptService.clear(attemptKey);
        } catch (AuthenticationException exception) {
            loginAttemptService.recordFailure(attemptKey);
            throw new ResponseStatusException(UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다.");
        }
    }

    public DeviceSessionContext refreshDeviceContextInSession(HttpSession session, String username) {
        List<SessionDeviceItem> devices = getConnectedDevices();
        SessionDeviceItem first = devices.isEmpty() ? null : devices.get(0);
        if (first == null) {
            session.removeAttribute(SESSION_DEVICE_MAC_KEY);
            session.removeAttribute(SESSION_DEVICE_IP_KEY);
            return new DeviceSessionContext("", "");
        }

        String mac = first.mac();
        String ip = first.ip();
        session.setAttribute(SESSION_DEVICE_MAC_KEY, mac);
        session.setAttribute(SESSION_DEVICE_IP_KEY, ip);
        return new DeviceSessionContext(mac, ip);
    }

    public record DeviceSessionContext(String mac, String ip) {
    }

    public List<SessionDeviceItem> getUserApprovedDevices(String username) {
        return getConnectedDevices();
    }

    public record SessionDeviceItem(String mac, String ip, boolean online) {
    }

    private List<SessionDeviceItem> getConnectedDevices() {
        List<Device> devices = deviceRepository.findAll();
        LinkedHashMap<String, SessionDeviceItem> uniqueByMac = new LinkedHashMap<>();
        devices.stream()
                .sorted(Comparator.comparing(Device::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Device::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .forEach(device -> {
            String mac = device.getMacId() == null ? "" : device.getMacId().trim();
            if (mac.isBlank()) return;
            String ip = device.getIpAddress() == null ? "" : device.getIpAddress().trim();
            boolean online = device.getStatus() == DeviceStatus.ONLINE;
            uniqueByMac.putIfAbsent(mac, new SessionDeviceItem(mac, ip, online));
                });
        return new ArrayList<>(uniqueByMac.values());
    }

    @Transactional
    public void createLoginLog(String username) {
        userRepository.findByUsername(username).ifPresent(user ->
                userLogRepository.save(UserLog.builder().user(user).build())
        );
    }

    @Transactional
    public void markLogout(String username) {
        if (username == null || username.isBlank()) return;
        userRepository.findByUsername(username).ifPresent(user ->
                userLogRepository.findTopByUser_IdAndLogoutAtIsNullOrderByLoginAtDesc(user.getId())
                        .ifPresent(log -> {
                            log.setLogoutAt(java.time.LocalDateTime.now());
                            userLogRepository.save(log);
                        })
        );
    }
}