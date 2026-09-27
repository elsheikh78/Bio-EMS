import "dotenv/config";
import { timingSafeEqual } from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  deviceProvisioningDetectSchema,
  localProvisionerFlashSchema,
} from "../modules/device-provisioning/device-provisioning.schema";
import { LocalProvisioningRunner } from "../modules/device-provisioning/device-provisioning.runner";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function tokenMatches(received: string | undefined, expected: string): boolean {
  if (!received?.startsWith("Bearer ")) return false;
  const candidate = Buffer.from(received.slice(7), "utf8");
  const target = Buffer.from(expected, "utf8");
  return candidate.length === target.length && timingSafeEqual(candidate, target);
}

export function createDeviceProvisionerApp(runner: LocalProvisioningRunner, token: string) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use((request, response, next) => {
    if (!tokenMatches(request.header("authorization"), token)) {
      response.status(401).json({ code: "PROVISIONER_AUTHENTICATION_REQUIRED" });
      return;
    }
    next();
  });

  app.get("/health", (_request, response) => response.json(runner.health()));
  app.get("/ports", async (_request, response, next) => {
    try {
      response.json({ ports: await runner.listPorts() });
    } catch (error) {
      next(error);
    }
  });
  app.post("/detect", async (request, response, next) => {
    try {
      const input = deviceProvisioningDetectSchema.parse(request.body);
      response.json(await runner.detect(input.port));
    } catch (error) {
      next(error);
    }
  });
  app.post("/flash", async (request, response, next) => {
    try {
      const input = localProvisionerFlashSchema.parse(request.body);
      response.json(await runner.flash(input.port));
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) {
      response.status(400).json({ code: "PROVISIONER_REQUEST_INVALID" });
      return;
    }
    const message = error instanceof Error ? error.message : "Provisioning operation failed";
    response.status(503).json({
      code: "PROVISIONER_OPERATION_FAILED",
      message,
    });
  });
  return app;
}

if (require.main === module) {
  const token = required("BIOEMS_PROVISIONER_TOKEN");
  if (token.length < 32)
    throw new Error("BIOEMS_PROVISIONER_TOKEN must contain at least 32 characters");
  const applicationRoot = required("BIOEMS_APPLICATION_ROOT");
  const esptoolPath = required("BIOEMS_PROVISIONER_ESPTOOL_PATH");
  const firmwareManifestPath =
    process.env.BIOEMS_PROVISIONER_FIRMWARE_MANIFEST?.trim() || undefined;
  const port = Number(process.env.BIOEMS_PROVISIONER_PORT ?? "9444");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("BIOEMS_PROVISIONER_PORT is invalid");
  }

  const runner = new LocalProvisioningRunner({
    applicationRoot,
    esptoolPath,
    firmwareManifestPath,
  });
  const app = createDeviceProvisionerApp(runner, token);
  app.listen(port, "127.0.0.1", () => {
    console.log(`BIO-EMS Device Provisioner listening on 127.0.0.1:${port}`);
  });
}
