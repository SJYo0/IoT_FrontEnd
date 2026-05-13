-- ai_analysis 테이블
CREATE TABLE ai_analysis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL,
    analysis JSON NOT NULL COMMENT 'AI 응답 결과',
    input_data JSON NOT NULL COMMENT 'AI에 전달된 입력 데이터',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_analysis_device FOREIGN KEY (device_id) REFERENCES device (id) ON DELETE CASCADE
);

--  control_log 테이블
CREATE TABLE control_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL,
    controlled_by BIGINT NULL COMMENT '수동 제어를 수행한 사용자 ID',
    ai_analysis_id BIGINT NULL COMMENT 'AI 제어인 경우 매핑되는 분석 이력 ID',
    previous_status JSON NOT NULL COMMENT '제어 전 기기 상태',
    new_status JSON NOT NULL COMMENT '제어 후 기기 상태',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_control_log_device FOREIGN KEY (device_id) REFERENCES device (id) ON DELETE CASCADE,
    CONSTRAINT fk_control_log_user FOREIGN KEY (controlled_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_control_log_ai FOREIGN KEY (ai_analysis_id) REFERENCES ai_analysis (id) ON DELETE SET NULL
);