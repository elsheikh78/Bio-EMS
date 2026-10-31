import type { RequestHandler } from "express";
import {
  featurePolicyStore,
  type defaultPlatformPolicy,
} from "../modules/controller-runtime/feature-policy";
import { AppError } from "../errors/app-error";

export function requireFeature(feature: keyof typeof defaultPlatformPolicy): RequestHandler {
  return (_req, _res, next) =>
    next(
      featurePolicyStore.enabled(feature)
        ? undefined
        : new AppError("Feature disabled by System Owner", 403, "FEATURE_DISABLED")
    );
}
