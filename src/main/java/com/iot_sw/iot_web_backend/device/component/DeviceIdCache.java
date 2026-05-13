package com.iot_sw.iot_web_backend.device.component;

import com.iot_sw.iot_web_backend.device.repository.DeviceRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class DeviceIdCache {

    private final DeviceRepository deviceRepository;

    private final Map<String, Long> macToIdMap = new ConcurrentHashMap<>();

    // 서버 시작 시 모든 기기의 MAC-ID 쌍을 메모리에 로드
    @PostConstruct
    public void init() {
        refreshCache();
    }

    public void refreshCache() {
        deviceRepository.findAll().forEach(device -> {
            macToIdMap.put(device.getMacId(), device.getId());
        });
    }

    // MAC 주소로 ID 찾기 (없으면 null 반환)
    public Long getDeviceId(String macId) {
        return macToIdMap.get(macId);
    }

    // 새로운 기기가 승인되었을 때 캐시에 추가하기 위함
    public void put(String macId, Long id) {
        macToIdMap.put(macId, id);
    }
}
