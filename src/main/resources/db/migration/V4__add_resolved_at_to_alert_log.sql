-- 해결 시간 컬럼 추가
ALTER TABLE alert_log
    ADD COLUMN resolved_at DATETIME(3) NULL COMMENT '알람 상황 종료(해결) 시간';

-- "현재 진행 중인 알람(resolved_at IS NULL)"을 빠르게 찾기 위한 인덱스
CREATE INDEX idx_alert_resolved_at ON alert_log (resolved_at);