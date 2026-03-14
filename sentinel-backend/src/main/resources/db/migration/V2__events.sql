-- V2: Event log tables — location_log, motion_log

CREATE TABLE IF NOT EXISTS location_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id    UUID NOT NULL,
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    accuracy    DOUBLE PRECISION,
    speed       DOUBLE PRECISION,
    heading     DOUBLE PRECISION,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_child_time
    ON location_log(child_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS motion_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id    UUID NOT NULL,
    accel_x     DOUBLE PRECISION,
    accel_y     DOUBLE PRECISION,
    accel_z     DOUBLE PRECISION,
    gyro_x      DOUBLE PRECISION,
    gyro_y      DOUBLE PRECISION,
    gyro_z      DOUBLE PRECISION,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motion_child_time
    ON motion_log(child_id, recorded_at DESC);
