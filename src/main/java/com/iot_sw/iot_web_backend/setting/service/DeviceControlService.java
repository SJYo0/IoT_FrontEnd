package com.iot_sw.iot_web_backend.setting.service;

import com.iot_sw.iot_web_backend.device.entity.Device;
import com.iot_sw.iot_web_backend.device.entity.ApproveLog;
import com.iot_sw.iot_web_backend.device.repository.ApproveLogRepository;
import com.iot_sw.iot_web_backend.device.repository.DeviceRepository;
import com.iot_sw.iot_web_backend.setting.dto.DeviceControlStateDto;
import com.iot_sw.iot_web_backend.setting.entity.ControlStatus;
import com.iot_sw.iot_web_backend.setting.entity.Environment;
import com.iot_sw.iot_web_backend.setting.repository.ControlStatusRepository;
import com.iot_sw.iot_web_backend.setting.repository.EnvironmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeviceControlService {

    private final DeviceRepository deviceRepository;
    private final ApproveLogRepository approveLogRepository;
    private final EnvironmentRepository environmentRepository;
    private final ControlStatusRepository controlStatusRepository;

    @Transactional(readOnly = true)
    public DeviceControlStateDto getEnvironmentState(String username, String mac) {
        Device device = findApprovedDeviceForUser(username, mac);
        Environment environment = environmentRepository.findByDeviceId(device.getId())
                .orElseGet(() -> Environment.builder().device(device).build());
        return toDto(environment);
    }

    @Transactional
    public DeviceControlStateDto saveEnvironmentState(String username, String mac, DeviceControlStateDto dto) {
        Device device = findApprovedDeviceForUser(username, mac);
        Environment environment = environmentRepository.findByDeviceId(device.getId())
                .orElseGet(() -> Environment.builder().device(device).build());
        applyToEnvironment(environment, dto);
        environmentRepository.save(environment);
        return toDto(environment);
    }

    @Transactional(readOnly = true)
    public DeviceControlStateDto getControlStatusState(String username, String mac) {
        Device device = findApprovedDeviceForUser(username, mac);
        ControlStatus status = controlStatusRepository.findByDeviceId(device.getId())
                .orElseGet(() -> ControlStatus.builder().device(device).build());
        return toDto(status);
    }

    @Transactional
    public DeviceControlStateDto saveControlStatusState(String username, String mac, DeviceControlStateDto dto) {
        Device device = findApprovedDeviceForUser(username, mac);
        ControlStatus status = controlStatusRepository.findByDeviceId(device.getId())
                .orElseGet(() -> ControlStatus.builder().device(device).build());
        applyToControlStatus(status, dto);
        controlStatusRepository.save(status);
        return toDto(status);
    }

    private Device findApprovedDeviceForUser(String username, String mac) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("로그인 사용자 정보가 필요합니다.");
        }

        String normalizedMac = mac == null ? "" : mac.trim().toUpperCase();
        if (!normalizedMac.isBlank()) {
            Device selectedDevice = deviceRepository.findByMacId(normalizedMac)
                    .orElseThrow(() -> new IllegalArgumentException("해당 MAC 주소의 장치를 찾을 수 없습니다."));

            boolean approved = approveLogRepository.existsByUser_UsernameAndDevice_IdAndIsApproveTrue(
                    username,
                    selectedDevice.getId()
            );
            if (!approved) {
                throw new IllegalArgumentException("해당 장치는 로그인 사용자에게 승인되지 않았습니다.");
            }
            return selectedDevice;
        }

        ApproveLog latestApprovedDevice = approveLogRepository
                .findTopByUser_UsernameAndIsApproveTrueOrderByApprovedAtDesc(username)
                .orElseThrow(() -> new IllegalArgumentException("로그인 사용자에게 승인된 장치가 없습니다."));
        return latestApprovedDevice.getDevice();
    }

    private static boolean toBool(Boolean value) {
        return Boolean.TRUE.equals(value);
    }

    private static DeviceControlStateDto toDto(Environment environment) {
        return new DeviceControlStateDto(
                toBool(environment.getNorthWindow()),
                toBool(environment.getSouthWindow()),
                toBool(environment.getEastWindow()),
                toBool(environment.getWestWindow()),
                toBool(environment.getAirConditioner()),
                toBool(environment.getHeating()),
                toBool(environment.getHumidifier()),
                toBool(environment.getDehumidifier()),
                toBool(environment.getAirCleaner()),
                toBool(environment.getSprinkler()),
                toBool(environment.getFireAlarm())
        );
    }

    private static DeviceControlStateDto toDto(ControlStatus status) {
        return new DeviceControlStateDto(
                toBool(status.getNorthWindow()),
                toBool(status.getSouthWindow()),
                toBool(status.getEastWindow()),
                toBool(status.getWestWindow()),
                toBool(status.getAirConditioner()),
                toBool(status.getHeating()),
                toBool(status.getHumidifier()),
                toBool(status.getDehumidifier()),
                toBool(status.getAirCleaner()),
                toBool(status.getSprinkler()),
                toBool(status.getFireAlarm())
        );
    }

    private static void applyToEnvironment(Environment environment, DeviceControlStateDto dto) {
        environment.setNorthWindow(toBool(dto.windowNorth()));
        environment.setSouthWindow(toBool(dto.windowSouth()));
        environment.setEastWindow(toBool(dto.windowEast()));
        environment.setWestWindow(toBool(dto.windowWest()));
        environment.setAirConditioner(toBool(dto.aircon()));
        environment.setHeating(toBool(dto.heater()));
        environment.setHumidifier(toBool(dto.humidifier()));
        environment.setDehumidifier(toBool(dto.dehumidifier()));
        environment.setAirCleaner(toBool(dto.airCleaner()));
        environment.setSprinkler(toBool(dto.sprinkler()));
        environment.setFireAlarm(toBool(dto.fireAlarm()));
    }

    private static void applyToControlStatus(ControlStatus status, DeviceControlStateDto dto) {
        status.setNorthWindow(toBool(dto.windowNorth()));
        status.setSouthWindow(toBool(dto.windowSouth()));
        status.setEastWindow(toBool(dto.windowEast()));
        status.setWestWindow(toBool(dto.windowWest()));
        status.setAirConditioner(toBool(dto.aircon()));
        status.setHeating(toBool(dto.heater()));
        status.setHumidifier(toBool(dto.humidifier()));
        status.setDehumidifier(toBool(dto.dehumidifier()));
        status.setAirCleaner(toBool(dto.airCleaner()));
        status.setSprinkler(toBool(dto.sprinkler()));
        status.setFireAlarm(toBool(dto.fireAlarm()));
    }
}
