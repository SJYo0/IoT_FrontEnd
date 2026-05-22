UPDATE users
SET created_at = NOW()
WHERE created_at IS NULL;

UPDATE users
SET updated_at = NOW()
WHERE updated_at IS NULL;
