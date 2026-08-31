import type Database from "better-sqlite3";
import { sqlite } from "./client";

export function createTables(database: Database.Database = sqlite): void {
  database.exec(`
        CREATE TABLE IF NOT EXISTS sites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            code TEXT NOT NULL UNIQUE,

            name TEXT NOT NULL,

            location TEXT,

            timezone TEXT,

            active INTEGER DEFAULT 1,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

  console.log("Sites table ready");

  database.exec(`
        CREATE TABLE IF NOT EXISTS devices (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            uuid TEXT NOT NULL UNIQUE,

            device_id TEXT NOT NULL UNIQUE,

            site_id INTEGER NOT NULL,

            device_type TEXT NOT NULL,

            protocol TEXT NOT NULL,

            manufacturer TEXT,

            model TEXT,

            firmware_version TEXT,

            status TEXT NOT NULL DEFAULT 'pending',

            activated INTEGER NOT NULL DEFAULT 0,

            last_seen_at TEXT,

            last_heartbeat_at TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            updated_at DATETIME,

            FOREIGN KEY (site_id)
                REFERENCES sites(id)

        );
    `);

  console.log("Devices table ready");

  database.exec(`
    CREATE TABLE IF NOT EXISTS device_communication_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('TELEMETRY','HEARTBEAT')),
      observed_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_device_communication_events_device_time
      ON device_communication_events(device_id, observed_at DESC, id DESC);
    CREATE TRIGGER IF NOT EXISTS trg_device_communication_events_no_update
    BEFORE UPDATE ON device_communication_events BEGIN
      SELECT RAISE(ABORT, 'device communication events are append-only');
    END;
    CREATE TRIGGER IF NOT EXISTS trg_device_communication_events_no_delete
    BEFORE DELETE ON device_communication_events BEGIN
      SELECT RAISE(ABORT, 'device communication events are append-only');
    END;
  `);

  database.exec(`
        CREATE TABLE IF NOT EXISTS rooms (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            uuid TEXT NOT NULL UNIQUE,

            site_id INTEGER NOT NULL,

            code TEXT NOT NULL,

            name TEXT NOT NULL,

            description TEXT,

            active INTEGER NOT NULL DEFAULT 1,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            updated_at DATETIME,

            FOREIGN KEY (site_id)
                REFERENCES sites(id),

            UNIQUE(site_id, code)

        );
    `);

  console.log("Rooms table ready");

  database.exec(`
    CREATE TABLE IF NOT EXISTS sensors (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        uuid TEXT NOT NULL UNIQUE,

        room_id INTEGER NOT NULL,

        device_id INTEGER NOT NULL,

        channel INTEGER NOT NULL,

        code TEXT NOT NULL,

        name TEXT NOT NULL,

        sensor_type TEXT NOT NULL,

        unit TEXT NOT NULL,

        min_value REAL,

        max_value REAL,

        warning_low REAL,

        alarm_low REAL,

        warning_high REAL,

        alarm_high REAL,

        warning_delay_seconds INTEGER NOT NULL DEFAULT 0
            CHECK(warning_delay_seconds BETWEEN 0 AND 86400),

        critical_delay_seconds INTEGER NOT NULL DEFAULT 0
            CHECK(critical_delay_seconds BETWEEN 0 AND 86400),

        product_grade TEXT NOT NULL DEFAULT 'STANDARD'
            CHECK(product_grade IN ('STANDARD', 'ADVANCED')),

        hardware_model TEXT,

        installation_date TEXT,

        calibration_status TEXT NOT NULL DEFAULT 'NOT_CALIBRATED'
            CHECK(calibration_status IN ('NOT_CALIBRATED', 'VALID', 'DUE', 'EXPIRED')),

        last_calibrated_at TEXT,

        calibration_due_at TEXT,

        calibration_offset REAL NOT NULL DEFAULT 0,

        certificate_reference TEXT,

        enabled INTEGER NOT NULL DEFAULT 1,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        updated_at DATETIME,

        FOREIGN KEY (room_id)
            REFERENCES rooms(id),

        FOREIGN KEY (device_id)
            REFERENCES devices(id),

        UNIQUE(device_id, channel),

        UNIQUE(room_id, code)

    );
`);

  console.log("Sensors table ready");

  database.exec(`
    CREATE TABLE IF NOT EXISTS calibration_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id INTEGER NOT NULL,
      result TEXT NOT NULL CHECK(result IN ('PASS', 'FAIL')),
      performed_at TEXT NOT NULL,
      due_at TEXT,
      offset REAL,
      certificate_reference TEXT,
      notes TEXT,
      performed_by_user_id INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE RESTRICT,
      FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_calibration_records_sensor_performed
      ON calibration_records(sensor_id, performed_at DESC, id DESC);

    CREATE TRIGGER IF NOT EXISTS prevent_calibration_record_update
    BEFORE UPDATE ON calibration_records
    BEGIN
      SELECT RAISE(ABORT, 'calibration records are immutable');
    END;

    CREATE TRIGGER IF NOT EXISTS prevent_calibration_record_delete
    BEFORE DELETE ON calibration_records
    BEGIN
      SELECT RAISE(ABORT, 'calibration records are immutable');
    END;
  `);

  console.log("Calibration records table ready");

  database.exec(`
    CREATE TABLE IF NOT EXISTS alarms (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        sensor_id INTEGER NOT NULL,

        type TEXT NOT NULL,

        severity TEXT NOT NULL DEFAULT 'WARNING',

        status TEXT NOT NULL DEFAULT 'TRIGGERED',

        trigger_value REAL NOT NULL,

        trigger_time DATETIME DEFAULT CURRENT_TIMESTAMP,

        acknowledged_time DATETIME,

        acknowledged_by_user_id INTEGER,

        recovered_time DATETIME,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (sensor_id)
            REFERENCES sensors(id),

        FOREIGN KEY (acknowledged_by_user_id)
            REFERENCES users(id)
            ON DELETE SET NULL

    );
    `);

  console.log("Alarms table ready");

  database.exec(`
    CREATE TABLE IF NOT EXISTS alarm_activation_candidates (
      sensor_id INTEGER PRIMARY KEY,
      alarm_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('WARNING', 'CRITICAL')),
      first_observed_at TEXT NOT NULL,
      last_observed_at TEXT NOT NULL,
      latest_value REAL NOT NULL,
      FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS notification_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL CHECK(event_type IN (
        'ALARM_TRIGGERED',
        'ALARM_RECOVERED',
        'ALARM_ACKNOWLEDGED',
        'DEVICE_STALE',
        'DEVICE_OFFLINE',
        'DEVICE_ONLINE'
      )),
      source_type TEXT NOT NULL CHECK(source_type IN ('ALARM', 'DEVICE')),
      source_id TEXT NOT NULL,
      deduplication_key TEXT NOT NULL UNIQUE,
      payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
      occurred_at TEXT NOT NULL,
      consumed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_notification_events_pending
      ON notification_events(consumed_at, id);
  `);

  console.log("Notification events table ready");

  database.exec(`
    CREATE TABLE IF NOT EXISTS escalation_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT, uuid TEXT NOT NULL UNIQUE,
      site_id INTEGER NOT NULL, name TEXT NOT NULL,
      owner_role TEXT NOT NULL CHECK(owner_role IN ('PRIMARY_CONTACT','QUALITY','ENGINEERING','SECURITY','MANAGEMENT','OTHER')),
      eligible_severities_json TEXT NOT NULL CHECK(json_valid(eligible_severities_json)),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT,
      FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_escalation_policies_site ON escalation_policies(site_id, status);
    CREATE TABLE IF NOT EXISTS escalation_policy_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT, policy_id INTEGER NOT NULL,
      position INTEGER NOT NULL CHECK(position > 0),
      delay_seconds INTEGER NOT NULL CHECK(delay_seconds BETWEEN 0 AND 604800),
      recipient_role TEXT NOT NULL CHECK(recipient_role IN ('PRIMARY_CONTACT','QUALITY','ENGINEERING','SECURITY','MANAGEMENT','OTHER')),
      channels_json TEXT NOT NULL CHECK(json_valid(channels_json)),
      FOREIGN KEY (policy_id) REFERENCES escalation_policies(id) ON DELETE CASCADE,
      UNIQUE(policy_id, position), UNIQUE(policy_id, delay_seconds)
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS notification_recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      site_id INTEGER NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN (
        'PRIMARY_CONTACT', 'QUALITY', 'ENGINEERING', 'SECURITY', 'MANAGEMENT', 'OTHER'
      )),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_notification_recipients_site_status
      ON notification_recipients(site_id, status, id);
    CREATE TABLE IF NOT EXISTS notification_recipient_endpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_id INTEGER NOT NULL,
      channel TEXT NOT NULL CHECK(channel IN ('EMAIL', 'SMS', 'WHATSAPP')),
      address TEXT NOT NULL,
      eligible_severities_json TEXT NOT NULL CHECK(
        eligible_severities_json IN ('["WARNING"]', '["CRITICAL"]', '["WARNING","CRITICAL"]')
      ),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      FOREIGN KEY (recipient_id) REFERENCES notification_recipients(id) ON DELETE CASCADE,
      UNIQUE(recipient_id, channel)
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL
        CHECK(length(username) BETWEEN 3 AND 64)
        CHECK(username = lower(trim(username)))
        CHECK(username NOT GLOB '*[^a-z0-9._-]*'),
      email TEXT,
      password_hash TEXT NOT NULL CHECK(length(password_hash) > 0),
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'OPERATOR', 'VIEWER')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
      ON users(username);
  `);

  console.log("Users table ready");
}
