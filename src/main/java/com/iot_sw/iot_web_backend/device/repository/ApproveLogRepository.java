package com.iot_sw.iot_web_backend.device.repository;

import com.iot_sw.iot_web_backend.device.entity.ApproveLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface ApproveLogRepository extends JpaRepository<ApproveLog, Long> {
    Optional<ApproveLog> findTopByUser_IdAndIsApproveTrueOrderByApprovedAtDesc(Long userId);
    List<ApproveLog> findByUser_IdAndIsApproveTrueOrderByApprovedAtDesc(Long userId);
    Optional<ApproveLog> findTopByUser_UsernameAndIsApproveTrueOrderByApprovedAtDesc(String username);
    Optional<ApproveLog> findTopByUser_UsernameAndDevice_MacIdAndIsApproveTrueOrderByApprovedAtDesc(
            String username,
            String macId
    );
    boolean existsByUser_UsernameAndDevice_IdAndIsApproveTrue(String username, Long deviceId);
}
