package com.iot_sw.iot_web_backend.device.repository;

import com.iot_sw.iot_web_backend.device.entity.ApproveLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface ApproveLogRepository extends JpaRepository<ApproveLog, Long> {

}
