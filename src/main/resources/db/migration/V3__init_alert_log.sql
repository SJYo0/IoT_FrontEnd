CREATE TABLE alert_log
(
    id          BIGINT AUTO_INCREMENT NOT NULL COMMENT '알림 고유 ID',
    device_id   BIGINT                NOT NULL COMMENT '대상 기기 ID',
    category    VARCHAR(30)           NOT NULL COMMENT '알림 카테고리 (FIRE, TEMP, HUMIDITY, TVOC, ECO2)',
    severity    VARCHAR(20)           NOT NULL COMMENT '위험도 (WARNING, CRITICAL)',
    message     VARCHAR(255)          NOT NULL COMMENT '알림 상세 메시지',
    is_read     TINYINT(1) DEFAULT 0  NOT NULL COMMENT '관리자 확인 여부 (0: 미확인, 1: 확인)',
    created_at  DATETIME(3)           NOT NULL COMMENT '알림 발생 시간',
    resolved_at DATETIME(3)           NULL     COMMENT '알람 상황 종료 시간',

    CONSTRAINT pk_alert_log PRIMARY KEY (id),

    CONSTRAINT fk_alert_device_id FOREIGN KEY (device_id) REFERENCES device (id) ON DELETE CASCADE
);

CREATE INDEX idx_alert_created_at ON alert_log (created_at DESC);
CREATE INDEX idx_alert_device_severity ON alert_log (device_id, severity);
CREATE INDEX idx_alert_is_read ON alert_log (is_read);
CREATE INDEX idx_alert_resolved_at ON alert_log (resolved_at);