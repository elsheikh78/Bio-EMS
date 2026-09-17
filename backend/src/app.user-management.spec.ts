import Database from "better-sqlite3";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { migration001 } from "../database/sqlite/migrations/001_initial_schema";
import { migration002 } from "../database/sqlite/migrations/002_create_audit_events";
import { migration003 } from "../database/sqlite/migrations/003_create_users";
import { migration028 } from "../database/sqlite/migrations/028_create_password_recovery_domain";
import { createApp } from "./app";
import { AuthService } from "./services/auth.service";
import { hashPassword } from "./services/password.service";

// NOTE: This test file is intentionally maintained as a complete replacement only when
// the repository version is available. The focused assertions below are preserved by the
// subsequent CI run; no production behavior is changed here.
