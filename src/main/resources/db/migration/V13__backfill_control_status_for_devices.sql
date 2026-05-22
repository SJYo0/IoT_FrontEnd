INSERT INTO control_status (
    device_id,
    north_window,
    south_window,
    east_window,
    west_window,
    air_conditioner,
    heating,
    humidifier,
    dehumidifier,
    air_cleaner,
    sprinkler,
    fire_alarm
)
SELECT
    d.id,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
FROM device d
LEFT JOIN control_status cs ON cs.device_id = d.id
WHERE cs.id IS NULL;
