package com.iot_sw.iot_web_backend.device.service;

import com.iot_sw.iot_web_backend.Auth.entity.User;
import com.iot_sw.iot_web_backend.device.component.DeviceIdCache;
import com.iot_sw.iot_web_backend.device.dto.request.ApproveRequestDTO;
import com.iot_sw.iot_web_backend.device.dto.request.RegisterRequestDTO;
import com.iot_sw.iot_web_backend.device.dto.request.RejectRequestDTO;
import com.iot_sw.iot_web_backend.device.dto.request.TurnOffRequestDTO;
import com.iot_sw.iot_web_backend.device.dto.response.ApproveResponseDTO;
import com.iot_sw.iot_web_backend.device.entity.ApproveLog;
import com.iot_sw.iot_web_backend.device.entity.DeviceLog;
import com.iot_sw.iot_web_backend.device.repository.ApproveLogRepository;
import com.iot_sw.iot_web_backend.device.repository.DeviceLogRepository;
import com.iot_sw.iot_web_backend.device.repository.DeviceRepository;
import com.iot_sw.iot_web_backend.device.entity.Device;
import com.iot_sw.iot_web_backend.device.enums.DeviceStatus;
import com.iot_sw.iot_web_backend.mqtt.MqttGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final ApproveLogRepository approveLogRepository;
    private final DeviceLogRepository deviceLogRepository;
    private final MqttGateway mqttGateway;
    private final DeviceIdCache deviceIdCache;

    // 신규 기기 등록 (MqttService에서 호출됨)
    @Transactional
    public void registerPendingDevice(RegisterRequestDTO requestDTO) {

        // DB에 아예 없는 완전 신규 기기인 경우
        if (!deviceRepository.existsByMacId(requestDTO.getMacId())) {
            Device newDevice = new Device();
            newDevice.setMacId(requestDTO.getMacId());
            newDevice.setIpAddress(requestDTO.getIpAddress());

            // PENDING으로 덮어쓰우기 (관리자 승인 대기열로 이동)
            newDevice.setStatus(DeviceStatus.PENDING);
            deviceRepository.save(newDevice);

            // 기기 상태 변경 로그
            saveDeviceLog(newDevice, "NONE", DeviceStatus.PENDING.name());

            log.info("새 기기 연결 요청 (승인 대기): {}", requestDTO.getMacId());
        }
        // 이미 DB에 있고 승인했던 기기인 경우 자동 재승인 (변수에 의한 기기의 재접속을 고려)
        else {
            Device existingDevice = deviceRepository.findByMacId(requestDTO.getMacId()).get();
            String prevStatus = existingDevice.getStatus().name(); // 이전 상태

            if (existingDevice.getStatus() == DeviceStatus.ONLINE || existingDevice.getStatus() == DeviceStatus.OFFLINE) {
                log.info("이미 승인된 기기의 재접속 요청입니다. 허가증을 재발급합니다: {}", requestDTO.getMacId());

                // LWT 메시지를 고려하여 다시 ONLINE 상태로 갱신
                existingDevice.setStatus(DeviceStatus.ONLINE);
                existingDevice.setIpAddress(requestDTO.getIpAddress()); // IP가 바뀌었을 수 있으니 갱신
                deviceRepository.save(existingDevice);

                if (!prevStatus.equals(DeviceStatus.ONLINE.name())) {
                    saveDeviceLog(existingDevice, prevStatus, DeviceStatus.ONLINE.name());
                }

                // Response를 파이로 다시 쏘기
                String topic = "provisioning/response/" + requestDTO.getMacId();
                String approvalMsg = String.format(
                        "{\"status\": \"APPROVED\", \"device_id\": %d, \"name\": \"%s\"}",
                        existingDevice.getId(), existingDevice.getName()
                );
                mqttGateway.sendToMqtt(approvalMsg, topic);
            } else if (existingDevice.getStatus() == DeviceStatus.PENDING) {
                log.info("아직 관리자가 승인하지 않은 기기입니다. 대기 중: {}", requestDTO.getMacId());
            // 거절기기가 재접속 시 대기중으로 상태 변경
            } else if (existingDevice.getStatus() == DeviceStatus.REJECTED) {
                existingDevice.setStatus(DeviceStatus.PENDING);
                existingDevice.setIpAddress(requestDTO.getIpAddress());
                deviceRepository.save(existingDevice);

                saveDeviceLog(existingDevice, prevStatus, DeviceStatus.PENDING.name());
                log.info("관리자가 거절했던 기기입니다. 대기 중: {}", requestDTO.getMacId());
            }
        }
    }

    @Transactional
    void turnOffDevice(TurnOffRequestDTO requestDTO) {
        Device device = deviceRepository.findByMacId(requestDTO.getMacId())
                .orElseThrow(() -> new RuntimeException("기기를 찾을 수 없습니다."));

        if(device.getStatus() == DeviceStatus.ONLINE) {
            String prevStatus = device.getStatus().name();
            device.turnOff();
            deviceRepository.save(device);

            saveDeviceLog(device, prevStatus, DeviceStatus.OFFLINE.name());
            log.info("기기 연결 해제: {}", requestDTO.getMacId());
        }
    }

    // 기기 승인 로직
    @Transactional
    public ApproveResponseDTO approveDevice(ApproveRequestDTO requestDTO, User currentUser) {
        Device device = deviceRepository.findByMacId(requestDTO.getMacId())
                .orElseThrow(() -> new RuntimeException("기기를 찾을 수 없습니다."));

        String prevStatus = device.getStatus().name();

        // 상태 변경 및 이름 부여
        device.approve(requestDTO.getName(), requestDTO.getLocation());
        Device savedDevice = deviceRepository.save(device);

        saveDeviceLog(device, prevStatus, DeviceStatus.ONLINE.name());

        // 승인 기록 DB 삽입
        ApproveLog approveLog = ApproveLog.builder()
                .user(currentUser)
                .device(device)
                .isApprove(true)
                .build();

        approveLogRepository.save(approveLog);

        deviceIdCache.put(savedDevice.getMacId(), savedDevice.getId());
        deviceIdCache.refreshCache();

        // 승인 메시지 조립 및 전송
        String topic = "provisioning/response/" + requestDTO.getMacId();
        String approvalMsg = String.format(
                "{\"status\": \"APPROVED\", \"mac_address\": \"%s\", \"device_id\": %d, \"name\": \"%s\"}",
                device.getMacId() ,device.getId(), requestDTO.getName()
        );

        mqttGateway.sendToMqtt(approvalMsg, topic);
        log.info("기기 승인 완료 및 허가증 발급: {}", requestDTO.getMacId());

        return ApproveResponseDTO.builder()
                .id(savedDevice.getId())
                .name(savedDevice.getName())
                .location(savedDevice.getLocation())
                .ipAddress(savedDevice.getIpAddress())
                .macId(savedDevice.getMacId())
                .build();
    }

    // 기기 등록 거절 로직
    @Transactional
    public void rejectDevice(RejectRequestDTO requestDTO, User currentUser) {
        Device device = deviceRepository.findByMacId(requestDTO.getMacId())
                .orElseThrow(() -> new RuntimeException("기기를 찾을 수 없습니다."));

        String prevStatus = device.getStatus().name();
        device.reject();
        deviceRepository.save(device);

        saveDeviceLog(device, prevStatus, DeviceStatus.REJECTED.name());

        // 승인 기록 DB 삽입
        ApproveLog approveLog = ApproveLog.builder()
                .user(currentUser)
                .device(device)
                .isApprove(false)
                .build();

        approveLogRepository.save(approveLog);

        // 거절 메시지 조립 및 전송
        String topic = "provisioning/response/" + requestDTO.getMacId();
        String approvalMsg = String.format(
                "{\"status\": \"REJECTED\", \"mac_address\": \"%s\", \"device_id\": %d}",
                device.getMacId(), device.getId()
        );

        mqttGateway.sendToMqtt(approvalMsg, topic);
        log.info("기기 승인요청 거절: {}", requestDTO.getMacId());
    }

    private void saveDeviceLog(Device device, String prevStatus, String newStatus) {
        DeviceLog log = DeviceLog.builder()
                .device(device)
                .previousStatus(prevStatus)
                .newStatus(newStatus)
                .build();
        deviceLogRepository.save(log);
    }
}