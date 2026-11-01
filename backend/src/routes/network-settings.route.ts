import type Database from "better-sqlite3";
import type { RequestHandler } from "express";
import { Router } from "express";
import { z } from "zod";
import { sqlite } from "../../database/sqlite/client";
import { AppError } from "../errors/app-error";
import { NetworkSettingsStore } from "../modules/controller-runtime/network-settings";

export const requireNetworkAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== "ADMIN") return next(new AppError("Admin required", 403, "FORBIDDEN"));
  next();
};
export function createNetworkSettingsRouter(
  db: Database.Database = sqlite,
  store = new NetworkSettingsStore(db)
) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  const binding = (value: unknown) => {
    const id = z.uuid().parse(value);
    if (
      !db
        .prepare(
          "SELECT 1 FROM device_platform_bindings WHERE platform_binding_id=? AND status='ACTIVE'"
        )
        .get(id)
    )
      throw new AppError("Active controller not found", 404, "CONTROLLER_NOT_FOUND");
    return id;
  };
  router.get("/", (_req, res) =>
    res.json({
      controllers: db
        .prepare(
          `SELECT platform_binding_id AS id,
    device_identity AS name,site_code AS site FROM device_platform_bindings WHERE status='ACTIVE'`
        )
        .all(),
    })
  );
  router.get("/:binding", (req, res) => res.json(store.get(binding(req.params.binding))));
  router.put("/:binding", (req, res) =>
    res.json(
      store.save(
        binding(req.params.binding),
        req.body,
        req.platformPrincipal ? `SYSTEM_OWNER:${req.platformPrincipal.id}` : `ADMIN:${req.user!.id}`
      )
    )
  );
  return router;
}
