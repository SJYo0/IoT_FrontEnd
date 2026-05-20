ALTER TABLE users
    ADD COLUMN created_at DATETIME NULL DEFAULT NOW(),
    ADD COLUMN updated_at DATETIME NULL DEFAULT NOW();

CREATE TABLE user_log
(
    id        BIGINT AUTO_INCREMENT NOT NULL,
    user_id   BIGINT                NOT NULL,
    login_at  DATETIME              NOT NULL DEFAULT NOW(),
    logout_at DATETIME              NULL,
    CONSTRAINT pk_user_log PRIMARY KEY (id),
    CONSTRAINT fk_user_log_user FOREIGN KEY (user_id) REFERENCES users (id)
);
ALTER TABLE users
    ADD COLUMN created_at DATETIME NULL DEFAULT NOW(),
    ADD COLUMN updated_at DATETIME NULL DEFAULT NOW();

CREATE TABLE user_log
(
    id        BIGINT AUTO_INCREMENT NOT NULL,
    user_id   BIGINT                NOT NULL,
    login_at  DATETIME              NOT NULL DEFAULT NOW(),
    logout_at DATETIME              NULL,
    CONSTRAINT pk_user_log PRIMARY KEY (id),
    CONSTRAINT fk_user_log_user FOREIGN KEY (user_id) REFERENCES users (id)
);
