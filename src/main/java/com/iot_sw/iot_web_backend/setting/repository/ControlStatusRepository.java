package com.iot_sw.iot_web_backend.setting.repository;

import com.iot_sw.iot_web_backend.setting.entity.ControlStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ControlStatusRepository extends JpaRepository<ControlStatus, Long> {
    Optional<ControlStatus> findByDeviceId(Long deviceId);
}
