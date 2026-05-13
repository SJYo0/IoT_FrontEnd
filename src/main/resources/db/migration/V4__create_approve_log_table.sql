CREATE TABLE approve_log
(
    id          BIGINT AUTO_INCREMENT NOT NULL COMMENT '승인 기록 고유 식별자',
    user_id     BIGINT                NOT NULL COMMENT '승인 유저 ID',
    device_id   BIGINT                NOT NULL COMMENT '승인 기기 ID',
    is_approve  TINYINT(1)            NOT NULL COMMENT '승인 여부 (1: 승인, 0: 거절/대기)',
    approved_at DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '승인 처리 일시',

    CONSTRAINT pk_approve_log PRIMARY KEY (id),

    -- 유저가 삭제되면 해당 유저의 승인 로그도 삭제
    CONSTRAINT fk_approve_log_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    -- 기기가 삭제되면 해당 기기의 승인 로그도 삭제
    CONSTRAINT fk_approve_log_device
        FOREIGN KEY (device_id) REFERENCES device (id) ON DELETE CASCADE
);
