DELETE FROM password_reset_token;

ALTER TABLE password_reset_token
    ADD COLUMN code_hash VARCHAR(255) NOT NULL AFTER reset_code;
