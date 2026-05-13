CREATE TABLE device_log
(
    id              BIGINT AUTO_INCREMENT NOT NULL COMMENT '로그 고유 식별자',
    device_id       BIGINT                NOT NULL COMMENT '상태 변경 기기',
    previous_status VARCHAR(20)           NOT NULL COMMENT '변경 전 상태',
    new_status      VARCHAR(20)           NOT NULL COMMENT '변경 후 상태',
    changed_at      DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '상태 변경 일시',

    CONSTRAINT pk_device_log PRIMARY KEY (id),

    CONSTRAINT fk_device_log_device
        FOREIGN KEY (device_id) REFERENCES device (id) ON DELETE CASCADE
);

CREATE INDEX idx_device_log_device_id ON device_log (device_id);