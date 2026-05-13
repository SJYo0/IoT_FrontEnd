package com.iot_sw.iot_web_backend.device.controller;

import com.iot_sw.iot_web_backend.Auth.entity.User;
import com.iot_sw.iot_web_backend.Auth.repository.UserRepository;
import com.iot_sw.iot_web_backend.device.dto.request.ApproveRequestDTO;
import com.iot_sw.iot_web_backend.device.dto.request.RejectRequestDTO;
import com.iot_sw.iot_web_backend.device.dto.response.ApproveResponseDTO;
import com.iot_sw.iot_web_backend.device.entity.Device;
import com.iot_sw.iot_web_backend.device.repository.DeviceRepository;
import com.iot_sw.iot_web_backend.device.service.DeviceService;
import com.iot_sw.iot_web_backend.device.enums.DeviceStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/devices")
@CrossOrigin(origins = "*") // 리액트(5173 포트) 접속 허용
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final DeviceService deviceService;

    // 승인 대기 중(PENDING)인 기기 목록 조회
    @GetMapping("/pending")
    public List<Device> getPendingDevices() {
        return deviceRepository.findByStatus(DeviceStatus.PENDING);
    }

    // 기기 승인
    @PostMapping("/approve")
    public ResponseEntity<ApproveResponseDTO> approveDevice(@RequestBody ApproveRequestDTO requestDTO,
                                                            @AuthenticationPrincipal UserDetails userDetails ) { // 유저 아이디도 가져옴

        String currentUsername = userDetails.getUsername();

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        ApproveResponseDTO responseDTO = deviceService.approveDevice(requestDTO, currentUser);
        return ResponseEntity.ok().body(responseDTO);
    }

    // 3. 기기 거절 처리 (상태를 REJECTED로 변경)
    @PostMapping("/reject")
    public ResponseEntity<?> rejectDevice(@RequestBody RejectRequestDTO requestDTO,
                                          @AuthenticationPrincipal UserDetails userDetails) {

        String currentUsername = userDetails.getUsername();

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        deviceService.rejectDevice(requestDTO, currentUser);

        return ResponseEntity.ok().body("기기 거절 완료");
    }
}
