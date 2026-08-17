import path from "node:path";
import { loadCorsConfig } from "./cors.config";
import { loadJwtConfig } from "./jwt.config";
import { loadMqttConfig } from "./mqtt.config";

export const DEPLOYMENT_ISSUES = {
  NODE_ENV_NOT_PRODUCTION: "NODE_ENV_NOT_PRODUCTION",
  INVALID_PORT: "INVALID_PORT",
  INVALID_API_PREFIX: "INVALID_API_PREFIX",
  MQTT_CONFIGURATION_INVALID: "MQTT_CONFIGURATION_INVALID",
  MQTT_TLS_REQUIRED: "MQTT_TLS_REQUIRED",
  MQTT_STABLE_CLIENT_ID_REQUIRED: "MQTT_STABLE_CLIENT_ID_REQUIRED",
  MQTT_CREDENTIALS_REQUIRED: "MQTT_CREDENTIALS_REQUIRED",
  INFLUX_CONFIGURATION_INVALID: "INFLUX_CONFIGURATION_INVALID",
  INFLUX_TLS_REQUIRED: "INFLUX_TLS_REQUIRED",
  JWT_CONFIGURATION_INVALID: "JWT_CONFIGURATION_INVALID",
  CORS_CONFIGURATION_INVALID: "CORS_CONFIGURATION_INVALID",
  CORS_ORIGIN_REQUIRED: "CORS_ORIGIN_REQUIRED",
  CORS_HTTPS_REQUIRED: "CORS_HTTPS_REQUIRED",
  SQLITE_PATH_REQUIRED: "SQLITE_PATH_REQUIRED",
  SQLITE_PATH_MUST_BE_ABSOLUTE: "SQLITE_PATH_MUST_BE_ABSOLUTE",
  SQLITE_BACKUP_DIRECTORY_REQUIRED: "SQLITE_BACKUP_DIRECTORY_REQUIRED",
  SQLITE_BACKUP_DIRECTORY_MUST_BE_ABSOLUTE: "SQLITE_BACKUP_DIRECTORY_MUST_BE_ABSOLUTE",
} as const;

export type DeploymentIssue = (typeof DEPLOYMENT_ISSUES)[keyof typeof DEPLOYMENT_ISSUES];

export interface DeploymentReadinessResult {
  ready: boolean;
  issues: DeploymentIssue[];
}

export function validateDeploymentEnvironment(
  environment: NodeJS.ProcessEnv
): DeploymentReadinessResult {
  const issues = new Set<DeploymentIssue>();

  if (environment.NODE_ENV !== "production") {
    issues.add(DEPLOYMENT_ISSUES.NODE_ENV_NOT_PRODUCTION);
  }
  if (!isPort(environment.PORT)) {
    issues.add(DEPLOYMENT_ISSUES.INVALID_PORT);
  }
  if (!isApiPrefix(environment.API_PREFIX)) {
    issues.add(DEPLOYMENT_ISSUES.INVALID_API_PREFIX);
  }

  validateMqtt(environment, issues);
  validateInflux(environment, issues);
  validateJwt(environment, issues);
  validateCors(environment, issues);
  validatePersistence(environment, issues);

  return { ready: issues.size === 0, issues: [...issues] };
}

function validateMqtt(environment: NodeJS.ProcessEnv, issues: Set<DeploymentIssue>): void {
  try {
    const mqtt = loadMqttConfig(environment);
    if (mqtt.protocol !== "mqtts") issues.add(DEPLOYMENT_ISSUES.MQTT_TLS_REQUIRED);
    if (!environment.MQTT_CLIENT_ID?.trim()) {
      issues.add(DEPLOYMENT_ISSUES.MQTT_STABLE_CLIENT_ID_REQUIRED);
    }
    if (!mqtt.username || !mqtt.password) {
      issues.add(DEPLOYMENT_ISSUES.MQTT_CREDENTIALS_REQUIRED);
    }
  } catch {
    issues.add(DEPLOYMENT_ISSUES.MQTT_CONFIGURATION_INVALID);
  }
}

function validateInflux(environment: NodeJS.ProcessEnv, issues: Set<DeploymentIssue>): void {
  const values = [
    environment.INFLUX_URL,
    environment.INFLUX_TOKEN,
    environment.INFLUX_ORG,
    environment.INFLUX_BUCKET,
  ];
  if (values.some((value) => !value?.trim())) {
    issues.add(DEPLOYMENT_ISSUES.INFLUX_CONFIGURATION_INVALID);
    return;
  }

  try {
    if (new URL(environment.INFLUX_URL!).protocol !== "https:") {
      issues.add(DEPLOYMENT_ISSUES.INFLUX_TLS_REQUIRED);
    }
  } catch {
    issues.add(DEPLOYMENT_ISSUES.INFLUX_CONFIGURATION_INVALID);
  }
}

function validateJwt(environment: NodeJS.ProcessEnv, issues: Set<DeploymentIssue>): void {
  try {
    loadJwtConfig(environment);
  } catch {
    issues.add(DEPLOYMENT_ISSUES.JWT_CONFIGURATION_INVALID);
  }
}

function validateCors(environment: NodeJS.ProcessEnv, issues: Set<DeploymentIssue>): void {
  try {
    const cors = loadCorsConfig({ ...environment, NODE_ENV: "production" });
    if (cors.allowedOrigins.length === 0) {
      issues.add(DEPLOYMENT_ISSUES.CORS_ORIGIN_REQUIRED);
    }
    if (cors.allowedOrigins.some((origin) => new URL(origin).protocol !== "https:")) {
      issues.add(DEPLOYMENT_ISSUES.CORS_HTTPS_REQUIRED);
    }
  } catch {
    issues.add(DEPLOYMENT_ISSUES.CORS_CONFIGURATION_INVALID);
  }
}

function validatePersistence(environment: NodeJS.ProcessEnv, issues: Set<DeploymentIssue>): void {
  const sqlitePath = environment.BIOEMS_SQLITE_PATH?.trim();
  if (!sqlitePath) {
    issues.add(DEPLOYMENT_ISSUES.SQLITE_PATH_REQUIRED);
  } else if (!path.isAbsolute(sqlitePath)) {
    issues.add(DEPLOYMENT_ISSUES.SQLITE_PATH_MUST_BE_ABSOLUTE);
  }

  const backupDirectory = environment.BIOEMS_SQLITE_BACKUP_DIR?.trim();
  if (!backupDirectory) {
    issues.add(DEPLOYMENT_ISSUES.SQLITE_BACKUP_DIRECTORY_REQUIRED);
  } else if (!path.isAbsolute(backupDirectory)) {
    issues.add(DEPLOYMENT_ISSUES.SQLITE_BACKUP_DIRECTORY_MUST_BE_ABSOLUTE);
  }
}

function isPort(value: string | undefined): boolean {
  if (!value || !/^\d+$/.test(value)) return false;
  const port = Number(value);
  return Number.isSafeInteger(port) && port > 0 && port <= 65_535;
}

function isApiPrefix(value: string | undefined): boolean {
  return Boolean(value && /^\/[A-Za-z0-9/_-]*[A-Za-z0-9_-]$/.test(value));
}
