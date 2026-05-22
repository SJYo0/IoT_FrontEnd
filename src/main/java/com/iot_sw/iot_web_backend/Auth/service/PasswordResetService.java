package com.iot_sw.iot_web_backend.Auth.service;

import com.iot_sw.iot_web_backend.Auth.dto.PasswordResetConfirmDto;
import com.iot_sw.iot_web_backend.Auth.dto.PasswordResetRequestDto;
import com.iot_sw.iot_web_backend.Auth.dto.PasswordResetRequestResponseDto;
import com.iot_sw.iot_web_backend.Auth.entity.PasswordResetToken;
import com.iot_sw.iot_web_backend.Auth.entity.User;
import com.iot_sw.iot_web_backend.Auth.repository.PasswordResetTokenRepository;
import com.iot_sw.iot_web_backend.Auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    private static final int TOKEN_EXPIRE_MINUTES = 10;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public PasswordResetRequestResponseDto request(PasswordResetRequestDto dto) {
        String username = dto.getUsername().trim();
        String email = dto.getEmail().trim().toLowerCase();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "사용자를 찾을 수 없습니다."));
        if (!email.equalsIgnoreCase(user.getEmail())) {
            throw new ResponseStatusException(BAD_REQUEST, "가입 이메일이 일치하지 않습니다.");
        }

        passwordResetTokenRepository.deleteByExpiresAtBeforeOrUsedTrue(LocalDateTime.now());

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .resetCode(code)
                .codeHash(passwordEncoder.encode(code))
                .expiresAt(LocalDateTime.now().plusMinutes(TOKEN_EXPIRE_MINUTES))
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();
        passwordResetTokenRepository.save(token);

        return PasswordResetRequestResponseDto.builder()
                .message("인증 코드가 발급되었습니다.")
                .emailSent(false)
                .resetCode(code)
                .build();
    }

    @Transactional
    public void confirm(PasswordResetConfirmDto dto) {
        String username = dto.getUsername().trim();
        String code = dto.getCode().trim();

        PasswordResetToken token = passwordResetTokenRepository
                .findTopByUser_UsernameAndResetCodeAndUsedFalseOrderByCreatedAtDesc(username, code)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "유효하지 않은 인증 코드입니다."));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "인증 코드가 만료되었습니다.");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);
    }
}
