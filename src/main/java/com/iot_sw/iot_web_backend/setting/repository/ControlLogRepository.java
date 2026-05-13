package com.iot_sw.iot_web_backend.setting.repository;

import com.iot_sw.iot_web_backend.setting.entity.ControlLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ControlLogRepository extends JpaRepository<ControlLog, Long> {
    List<ControlLog> findByDeviceIdOrderByCreatedAtDesc(Long deviceId);
}
