CREATE TABLE ai_report (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL,
    input_data JSON NOT NULL COMMENT 'LLM API INPUT',
    result JSON NOT NULL COMMENT 'LLM API REPORT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_report_device_id FOREIGN KEY (device_id) REFERENCES device(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기기 & 날짜 인덱스
CREATE INDEX idx_ai_report_device_created ON ai_report(device_id, created_at);