import { describe, expect, it } from "vitest";
import { DEPLOYMENT_ISSUES, validateDeploymentEnvironment } from "./deployment-readiness";

const validEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: "production",
  PORT: "3001",
  API_PREFIX: "/api/v1",
  MQTT_PROTOCOL: "mqtts",
  MQTT_HOST: "broker.example.com",
  MQTT_PORT: "8883",
  MQTT_CLIENT_ID: "bio-ems-backend-pilot",
  MQTT_USERNAME: "backend",
  MQTT_PASSWORD: "secret-value",
  INFLUX_URL: "https://influx.example.com",
  INFLUX_TOKEN: "token-value",
  INFLUX_ORG: "bio-egypt",
  INFLUX_BUCKET: "telemetry",
  BIOEMS_JWT_SECRET: "a-secure-secret-with-more-than-32-bytes",
  BIOEMS_CORS_ALLOWED_ORIGINS: "https://ems.example.com",
  BIOEMS_SQLITE_PATH: "/var/lib/bio-ems/configuration.db",
  BIOEMS_SQLITE_BACKUP_DIR: "/var/backups/bio-ems",
  LOG_LEVEL: "info",
  BIOEMS_LOG_RETENTION_DAYS: "90",
  BIOEMS_SHUTDOWN_GRACE_SECONDS: "30",
};

describe("Deployment readiness gate", () => {
  it("accepts a complete production environment without returning secret values", () => {
    const result = validateDeploymentEnvironment(validEnvironment);

    expect(result).toEqual({ ready: true, issues: [] });
    expect(JSON.stringify(result)).not.toContain("secret-value");
    expect(JSON.stringify(result)).not.toContain("token-value");
  });

  it("fails closed for development defaults", () => {
    const result = validateDeploymentEnvironment({});

    expect(result.ready).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        DEPLOYMENT_ISSUES.NODE_ENV_NOT_PRODUCTION,
        DEPLOYMENT_ISSUES.INVALID_PORT,
        DEPLOYMENT_ISSUES.INVALID_API_PREFIX,
        DEPLOYMENT_ISSUES.MQTT_TLS_REQUIRED,
        DEPLOYMENT_ISSUES.MQTT_STABLE_CLIENT_ID_REQUIRED,
        DEPLOYMENT_ISSUES.MQTT_CREDENTIALS_REQUIRED,
        DEPLOYMENT_ISSUES.INFLUX_CONFIGURATION_INVALID,
        DEPLOYMENT_ISSUES.JWT_CONFIGURATION_INVALID,
        DEPLOYMENT_ISSUES.CORS_ORIGIN_REQUIRED,
        DEPLOYMENT_ISSUES.SQLITE_PATH_REQUIRED,
        DEPLOYMENT_ISSUES.SQLITE_BACKUP_DIRECTORY_REQUIRED,
        DEPLOYMENT_ISSUES.LOG_LEVEL_INVALID,
        DEPLOYMENT_ISSUES.LOG_RETENTION_DAYS_INVALID,
        DEPLOYMENT_ISSUES.SHUTDOWN_GRACE_SECONDS_INVALID,
      ])
    );
  });

  it("requires bounded operational settings and a separate backup location", () => {
    const result = validateDeploymentEnvironment({
      ...validEnvironment,
      BIOEMS_SQLITE_BACKUP_DIR: "/var/lib/bio-ems",
      LOG_LEVEL: "debug",
      BIOEMS_LOG_RETENTION_DAYS: "0",
      BIOEMS_SHUTDOWN_GRACE_SECONDS: "301",
    });
    expect(result.issues).toEqual(
      expect.arrayContaining([
        DEPLOYMENT_ISSUES.SQLITE_BACKUP_DIRECTORY_MUST_BE_SEPARATE,
        DEPLOYMENT_ISSUES.LOG_LEVEL_INVALID,
        DEPLOYMENT_ISSUES.LOG_RETENTION_DAYS_INVALID,
        DEPLOYMENT_ISSUES.SHUTDOWN_GRACE_SECONDS_INVALID,
      ])
    );
  });

  it("requires encrypted external endpoints and absolute persistence paths", () => {
    const result = validateDeploymentEnvironment({
      ...validEnvironment,
      MQTT_PROTOCOL: "mqtt",
      INFLUX_URL: "http://influx.example.com",
      BIOEMS_CORS_ALLOWED_ORIGINS: "http://ems.example.com",
      BIOEMS_SQLITE_PATH: "data/configuration.db",
      BIOEMS_SQLITE_BACKUP_DIR: "backups",
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        DEPLOYMENT_ISSUES.MQTT_TLS_REQUIRED,
        DEPLOYMENT_ISSUES.INFLUX_TLS_REQUIRED,
        DEPLOYMENT_ISSUES.CORS_HTTPS_REQUIRED,
        DEPLOYMENT_ISSUES.SQLITE_PATH_MUST_BE_ABSOLUTE,
        DEPLOYMENT_ISSUES.SQLITE_BACKUP_DIRECTORY_MUST_BE_ABSOLUTE,
      ])
    );
  });

  it("collapses invalid MQTT values to a non-sensitive issue code", () => {
    const result = validateDeploymentEnvironment({ ...validEnvironment, MQTT_PORT: "70000" });

    expect(result.ready).toBe(false);
    expect(result.issues).toContain(DEPLOYMENT_ISSUES.MQTT_CONFIGURATION_INVALID);
    expect(JSON.stringify(result)).not.toContain("70000");
  });
});
