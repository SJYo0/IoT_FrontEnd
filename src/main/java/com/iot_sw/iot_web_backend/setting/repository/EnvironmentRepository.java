package com.iot_sw.iot_web_backend.setting.repository;

import com.iot_sw.iot_web_backend.setting.entity.Environment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EnvironmentRepository extends JpaRepository<Environment, Long> {
    Optional<Environment> findByDeviceId(Long deviceId);
}
