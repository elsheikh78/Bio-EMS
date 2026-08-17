import express, { Router } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasPermission } from "../../authorization/authorization.policy";
import { PERMISSION, Permission } from "../../authorization/permissions";
import { UserRole } from "../../entities/User";
import { errorMiddleware } from "../../middleware/error.middleware";

const { controller } = vi.hoisted(() => ({
  controller: vi.fn((_req, res) => res.status(204).end()),
}));

vi.mock("../../controllers/site.controller", () => ({
  createSiteController: controller,
  getSitesController: controller,
}));
vi.mock("../../controllers/room.controller", () => ({
  createRoom: controller,
  getRooms: controller,
}));
vi.mock("../../controllers/sensor.controller", () => ({
  createCalibrationRecord: controller,
  createSensor: controller,
  getCalibrationHistory: controller,
  getSensors: controller,
}));
vi.mock("../../controllers/device.controller", () => ({
  activateDeviceController: controller,
  createDeviceController: controller,
  disableDeviceController: controller,
  getDeviceController: controller,
  getDevicesController: controller,
  updateDeviceController: controller,
}));
vi.mock("../../controllers/alarm.controller", () => ({
  acknowledgeAlarm: controller,
  getActiveAlarms: controller,
  getAlarmById: controller,
  getAlarms: controller,
}));
vi.mock("../../controllers/dashboard.controller", () => ({
  DashboardController: class {
    getSummary = controller;
    getLatestTelemetry = controller;
    getRoomStatus = controller;
    getAlarmStatistics = controller;
  },
}));
vi.mock("../../controllers/user.controller", () => ({
  createUser: controller,
  listUsers: controller,
  updateUser: controller,
  updateUserPassword: controller,
  updateUserStatus: controller,
}));

import alarmRouter from "../alarm.route";
import dashboardRouter from "../dashboard.route";
import deviceRouter from "../device.route";
import roomRouter from "../room.route";
import sensorRouter from "../sensor.route";
import siteRouter from "../site.route";
import userRouter from "../user.route";

type Method = "get" | "patch" | "post" | "put";

interface RouteCase {
  area: string;
  method: Method;
  path: string;
  permission: Permission;
  router: Router;
  routerPath: string;
  body?: Record<string, unknown>;
}

interface RegisteredRouteLayer {
  route?: {
    methods: Record<string, boolean>;
    path: string;
  };
}

const validDevice = {
  uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
  device_id: "ZC-FW-001",
  site_id: 1,
  device_type: "zone-controller-firmware",
  protocol: "mqtt",
};

const validSensor = {
  uuid: "8ae946c2-1424-44e8-b98d-ae2fd2f2273e",
  room_id: 1,
  device_id: 1,
  channel: 0,
  code: "TEMP-01",
  name: "Cold room temperature",
  sensor_type: "TEMPERATURE",
  unit: "°C",
};

const ROUTES: readonly RouteCase[] = [
  configurationRoute("Sites", "get", "/sites", siteRouter, "/"),
  configurationRoute("Sites", "post", "/sites", siteRouter, "/"),
  configurationRoute("Rooms", "get", "/rooms", roomRouter, "/"),
  configurationRoute("Rooms", "post", "/rooms", roomRouter, "/"),
  configurationRoute("Sensors", "get", "/sensors", sensorRouter, "/"),
  configurationRoute("Sensors", "post", "/sensors", sensorRouter, "/", validSensor),
  configurationRoute(
    "Sensors",
    "get",
    `/sensors/${validSensor.uuid}/calibrations`,
    sensorRouter,
    "/:sensorUuid/calibrations"
  ),
  configurationRoute(
    "Sensors",
    "post",
    `/sensors/${validSensor.uuid}/calibrations`,
    sensorRouter,
    "/:sensorUuid/calibrations",
    {
      result: "PASS",
      performed_at: "2026-08-17T09:00:00Z",
      due_at: "2027-08-17T09:00:00Z",
      offset: 0,
    }
  ),
  deviceRoute("get", "/devices", "/"),
  deviceRoute("post", "/devices", "/", validDevice),
  deviceRoute("get", "/devices/ZC-FW-001", "/:deviceId"),
  deviceRoute("patch", "/devices/ZC-FW-001", "/:deviceId", { model: "ZC-16" }),
  deviceRoute("post", "/devices/ZC-FW-001/activate", "/:deviceId/activate"),
  deviceRoute("post", "/devices/ZC-FW-001/disable", "/:deviceId/disable"),
  alarmRoute("get", "/alarms", "/"),
  alarmRoute("get", "/alarms/active", "/active"),
  alarmRoute("get", "/alarms/4", "/:id"),
  alarmRoute("post", "/alarms/4/acknowledge", "/:id/acknowledge"),
  dashboardRoute("/dashboard/summary", "/summary"),
  dashboardRoute("/dashboard/latest-telemetry", "/latest-telemetry"),
  dashboardRoute("/dashboard/rooms/status", "/rooms/status"),
  dashboardRoute("/dashboard/alarm-statistics", "/alarm-statistics"),
  userRoute("get", "/users", "/"),
  userRoute("post", "/users", "/", {
    username: "new-user",
    password: "Password1234",
    role: "VIEWER",
  }),
  userRoute("patch", "/users/2", "/:user_id", { role: "VIEWER" }),
  userRoute("patch", "/users/2/status", "/:user_id/status", { status: "disabled" }),
  userRoute("put", "/users/2/password", "/:user_id/password", { password: "Password1234" }),
];

describe("actual route authorization matrix", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the tested inventory synchronized with every registered protected route", () => {
    const expected = ROUTES.map(
      ({ area, method, routerPath }) => `${area}:${method}:${routerPath}`
    );
    const actual = [
      ...registeredRoutes("Sites", siteRouter),
      ...registeredRoutes("Rooms", roomRouter),
      ...registeredRoutes("Sensors", sensorRouter),
      ...registeredRoutes("Devices", deviceRouter),
      ...registeredRoutes("Alarms", alarmRouter),
      ...registeredRoutes("Dashboard", dashboardRouter),
      ...registeredRoutes("Users", userRouter),
    ];

    expect(actual.sort()).toEqual(expected.sort());
  });

  it.each(["ADMIN", "OPERATOR", "VIEWER"] as const)(
    "enforces every mapped route for %s",
    async (role) => {
      for (const route of ROUTES) {
        const response = await executeRoute(route, role);
        const allowed = hasPermission(role, route.permission);

        expect(response.status, `${role} ${route.method.toUpperCase()} ${route.path}`).toBe(
          allowed ? 204 : 403
        );
        if (!allowed) {
          expect(response.body).toEqual({
            success: false,
            error: { code: "FORBIDDEN", message: "Forbidden" },
          });
          expect(JSON.stringify(response.body)).not.toMatch(
            new RegExp(`${role}|${route.permission}`, "i")
          );
        }
      }
    }
  );

  it("rejects an unknown role before the handler", async () => {
    const response = await executeRoute(ROUTES[0], "OWNER");

    expect(response.status).toBe(403);
    expect(controller).not.toHaveBeenCalled();
  });

  it("keeps missing authentication on the existing 401 contract", async () => {
    const response = await executeRoute(ROUTES[0], undefined);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required" },
    });
    expect(controller).not.toHaveBeenCalled();
  });

  it("denies before Device validation and its controller", async () => {
    const createDevice = ROUTES.find(
      (route) => route.method === "post" && route.path === "/devices"
    );
    if (!createDevice) throw new Error("Device create route missing from authorization inventory");

    const response = await executeRoute({ ...createDevice, body: {} }, "VIEWER");

    expect(response.status).toBe(403);
    expect(controller).not.toHaveBeenCalled();
  });
});

function configurationRoute(
  area: string,
  method: "get" | "post",
  path: string,
  router: Router,
  routerPath: string,
  body?: Record<string, unknown>
): RouteCase {
  return {
    area,
    method,
    path,
    permission: method === "get" ? PERMISSION.CONFIGURATION_READ : PERMISSION.CONFIGURATION_WRITE,
    router,
    routerPath,
    body,
  };
}

function deviceRoute(
  method: Method,
  path: string,
  routerPath: string,
  body?: Record<string, unknown>
): RouteCase {
  return {
    area: "Devices",
    method,
    path,
    permission: method === "get" ? PERMISSION.DEVICE_READ : PERMISSION.DEVICE_MANAGE,
    router: deviceRouter,
    routerPath,
    body,
  };
}

function alarmRoute(method: "get" | "post", path: string, routerPath: string): RouteCase {
  return {
    area: "Alarms",
    method,
    path,
    permission: method === "get" ? PERMISSION.ALARM_READ : PERMISSION.ALARM_ACKNOWLEDGE,
    router: alarmRouter,
    routerPath,
  };
}

function dashboardRoute(path: string, routerPath: string): RouteCase {
  return {
    area: "Dashboard",
    method: "get",
    path,
    permission: PERMISSION.DASHBOARD_READ,
    router: dashboardRouter,
    routerPath,
  };
}

function userRoute(
  method: Method,
  path: string,
  routerPath: string,
  body?: Record<string, unknown>
): RouteCase {
  return {
    area: "Users",
    method,
    path,
    permission: PERMISSION.USER_MANAGE,
    router: userRouter,
    routerPath,
    body,
  };
}

function registeredRoutes(area: string, router: Router): string[] {
  return (router.stack as unknown as RegisteredRouteLayer[]).flatMap((layer) => {
    const route = layer.route;
    if (!route) return [];
    return Object.keys(route.methods).map((method) => `${area}:${method}:${route.path}`);
  });
}

async function executeRoute(route: RouteCase, role: UserRole | string | undefined) {
  const app = express();
  app.use(express.json());
  if (role !== undefined) {
    app.use((req, _res, next) => {
      Object.assign(req, { user: { id: 7, username: "current-user", role } });
      next();
    });
  }
  app.use(`/api/v1/${route.area.toLowerCase()}`, route.router);
  app.use(errorMiddleware);

  const operation = request(app)[route.method](`/api/v1${route.path}`);
  if (route.body !== undefined) operation.send(route.body);
  return operation;
}
