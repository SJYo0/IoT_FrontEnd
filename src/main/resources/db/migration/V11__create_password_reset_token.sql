CREATE TABLE password_reset_token
(
    id         BIGINT AUTO_INCREMENT NOT NULL,
    user_id    BIGINT                NOT NULL,
    reset_code VARCHAR(6)            NOT NULL,
    expires_at DATETIME              NOT NULL,
    used       TINYINT(1)            NOT NULL DEFAULT 0,
    created_at DATETIME              NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_password_reset_token PRIMARY KEY (id),
    CONSTRAINT fk_password_reset_token_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_token_user_code
    ON password_reset_token (user_id, reset_code);
