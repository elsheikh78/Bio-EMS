import { describe, expect, it } from "vitest";
import {
  createPlatformCustomerRequestSchema,
  platformOperationsOverviewSchema,
} from "./contracts";

const overview = {
  customers: [
    {
      id: 1,
      code: "BIO-EGYPT",
      name: "BIO EGYPT",
      status: "ACTIVE",
      createdAt: "2026-09-01T12:00:00Z",
      createdBy: "owner#1",
    },
  ],
  sites: [
    {
      id: 7,
      code: "OCT",
      name: "6th October",
      location: "Giza",
      timezone: "Africa/Cairo",
      active: 1,
    },
  ],
  licenses: [
    {
      id: 2,
      customerId: 1,
      siteId: 7,
      licenseKeyReference: "LIC-001",
      edition: "PILOT",
      status: "ACTIVE",
      startsAt: "2026-09-01T12:00:00Z",
      expiresAt: null,
      updateEntitlement: "FREE",
    },
  ],
  serviceEvents: [],
  commercialEvents: [
    {
      id: 3,
      eventType: "CUSTOMER_CREATED",
      entityType: "CUSTOMER",
      entityId: 1,
      occurredAt: "2026-09-01T12:00:00Z",
      actorIdentity: "owner#1",
    },
  ],
};

describe("platform fleet contracts", () => {
  it("accepts customer, Site linkage and immutable provenance projections", () => {
    expect(platformOperationsOverviewSchema.parse(overview)).toEqual(overview);
  });

  it("rejects non-platform customer lifecycle values", () => {
    expect(() =>
      platformOperationsOverviewSchema.parse({
        ...overview,
        customers: [{ ...overview.customers[0], status: "ADMIN" }],
      }),
    ).toThrow();
  });

  it("keeps create-customer input strict and bounded", () => {
    expect(
      createPlatformCustomerRequestSchema.parse({
        code: " BIO-EGYPT ",
        name: " BIO EGYPT ",
        status: "ACTIVE",
        createdAt: "2026-09-01T12:00:00Z",
      }),
    ).toMatchObject({ code: "BIO-EGYPT", name: "BIO EGYPT" });
    expect(() =>
      createPlatformCustomerRequestSchema.parse({
        code: "C1",
        name: "Customer",
        status: "ACTIVE",
        createdAt: "2026-09-01T12:00:00Z",
        actorIdentity: "customer-admin",
      }),
    ).toThrow();
  });
});
