import type Database from "better-sqlite3";
import { sqlite } from "./client";
import { MigrationRepository } from "./migration.repository";

import { migration001 } from "./migrations/001_initial_schema";
import { migration002 } from "./migrations/002_add_warning_thresholds";
import { migration003 } from "./migrations/003_create_users";
import { migration004 } from "./migrations/004_add_alarm_acknowledging_user";
import { migration005 } from "./migrations/005_add_sensor_calibration_foundation";
import { migration006 } from "./migrations/006_create_calibration_records";
import { migration007 } from "./migrations/007_add_device_communication_health";
import { migration008 } from "./migrations/008_create_notification_events";
import { migration009 } from "./migrations/009_create_platform_principals";
import { migration010 } from "./migrations/010_create_audit_events";
import { migration011 } from "./migrations/011_add_alarm_delay_configuration";
import { migration012 } from "./migrations/012_create_notification_recipients";
import { migration013 } from "./migrations/013_create_escalation_policies";
import { migration014 } from "./migrations/014_create_device_communication_events";
import { migration015 } from "./migrations/015_create_notification_deliveries";
import { migration016 } from "./migrations/016_add_notification_attempt_phases";
import { migration017 } from "./migrations/017_create_commissioning_evidence";

export interface Migration {
  version: number;

  description: string;

  up(database: Database.Database): void;
}

const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
  migration008,
  migration009,
  migration010,
  migration011,
  migration012,
  migration013,
  migration014,
  migration015,
  migration016,
  migration017,
];

export function runMigrations(
  database: Database.Database = sqlite,
  registeredMigrations: Migration[] = migrations
): void {
  ensureMigrationTable(database);

  const repository = new MigrationRepository(database);

  for (const migration of registeredMigrations) {
    if (repository.hasMigration(migration.version)) {
      continue;
    }

    console.log(`Running migration ${migration.version}: ${migration.description}`);

    database.transaction(() => {
      migration.up(database);
      repository.recordMigration(migration.version, migration.description);
    })();

    console.log(`Migration ${migration.version} completed`);
  }
}

function ensureMigrationTable(database: Database.Database): void {
  database.exec(`

        CREATE TABLE IF NOT EXISTS schema_migrations (

            version INTEGER PRIMARY KEY,

            description TEXT NOT NULL,

            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP

        );

    `);
}
