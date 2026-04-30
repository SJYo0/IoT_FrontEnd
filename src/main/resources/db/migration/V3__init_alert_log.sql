CREATE TABLE alert_log
(
    id          BIGINT AUTO_INCREMENT NOT NULL COMMENT '알림 고유 ID',
    mac_address VARCHAR(20)           NOT NULL COMMENT '알림 발생 기기 MAC 주소',
    category    VARCHAR(30)           NOT NULL COMMENT '알림 카테고리 (FIRE, TEMP, HUMIDITY, TVOC, ECO2)',
    severity    VARCHAR(20)           NOT NULL COMMENT '위험도 (WARNING, CRITICAL)',
    message     VARCHAR(255)          NOT NULL COMMENT '알림 상세 메시지',
    is_read     TINYINT(1) DEFAULT 0  NOT NULL COMMENT '관리자 확인 여부 (0: 미확인, 1: 확인)',
    created_at  DATETIME(3)           NOT NULL COMMENT '알림 발생 시간 (밀리초 포함)',

    CONSTRAINT pk_alert_log PRIMARY KEY (id)
);

-- 외래 키(FK) 설정: device 테이블의 mac_id 참조
ALTER TABLE alert_log
    ADD CONSTRAINT fk_alert_device
        FOREIGN KEY (mac_address) REFERENCES device (mac_id) ON DELETE CASCADE;

-- 프론트엔드 대시보드 조회를 위한 인덱스 최적화
CREATE INDEX idx_alert_created_at ON alert_log (created_at DESC);
CREATE INDEX idx_alert_mac_severity ON alert_log (mac_address, severity);
CREATE INDEX idx_alert_is_read ON alert_log (is_read);