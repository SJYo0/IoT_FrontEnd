-- environment 테이블
CREATE TABLE environment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL UNIQUE,
    north_window TINYINT(1) NULL,
    south_window TINYINT(1) NULL,
    east_window TINYINT(1) NULL,
    west_window TINYINT(1) NULL,
    air_conditioner TINYINT(1) NULL,
    heating TINYINT(1) NULL,
    humidifier TINYINT(1) NULL,
    dehumidifier TINYINT(1) NULL,
    air_cleaner TINYINT(1) NULL,
    sprinkler TINYINT(1) NULL,
    fire_alarm TINYINT(1) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_environment_device FOREIGN KEY (device_id) REFERENCES device (id) ON DELETE CASCADE
);

-- control_status 테이블
CREATE TABLE control_status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL UNIQUE,
    north_window TINYINT(1) NULL,
    south_window TINYINT(1) NULL,
    east_window TINYINT(1) NULL,
    west_window TINYINT(1) NULL,
    air_conditioner TINYINT(1) NULL,
    heating TINYINT(1) NULL,
    humidifier TINYINT(1) NULL,
    dehumidifier TINYINT(1) NULL,
    air_cleaner TINYINT(1) NULL,
    sprinkler TINYINT(1) NULL,
    fire_alarm TINYINT(1) NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_control_status_device FOREIGN KEY (device_id) REFERENCES device (id) ON DELETE CASCADE
);