package com.iot_sw.iot_web_backend.Auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordResetConfirmDto {
    @NotBlank(message = "아이디를 입력해주세요.")
    private String username;

    @NotBlank(message = "인증 코드를 입력해주세요.")
    @Pattern(regexp = "\\d{6}", message = "인증 코드는 6자리 숫자여야 합니다.")
    private String code;

    @NotBlank(message = "새 비밀번호를 입력해주세요.")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d\\s])\\S{8,12}$",
            message = "비밀번호는 8~12자, 대문자/소문자/숫자/특수문자를 포함해야 합니다."
    )
    private String newPassword;
}
