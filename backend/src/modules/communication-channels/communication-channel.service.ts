import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import { AppError } from "../../errors/app-error";
import { CustomerOwnershipRepository } from "../customer-ownership/customer-ownership.repository";
import { CommunicationChannelRepository } from "./communication-channel.repository";
import type {
  CommunicationChannel,
  CommunicationChannelConfig,
  CommunicationChannelScope,
  SaveCommunicationChannelInput,
} from "./communication-channel.schema";
import { RuntimeCommunicationProvider } from "./runtime-communication.provider";

export class CommunicationChannelService {
  private readonly repository: CommunicationChannelRepository;
  private readonly ownership: CustomerOwnershipRepository;

  constructor(
    encryptionKey: Buffer,
    private readonly database: Database.Database = sqlite
  ) {
    this.repository = new CommunicationChannelRepository(encryptionKey, database);
    this.ownership = new CustomerOwnershipRepository(database);
  }

  scopeForAdmin(userId: number, siteId: number | null): CommunicationChannelScope {
    const customer = this.ownership.forUser(userId);
    if (!customer || customer.customerStatus !== "ACTIVE") {
      throw new AppError("Active customer binding required", 403, "CUSTOMER_SCOPE_REQUIRED");
    }
    const scope = { customerId: customer.customerId, siteId };
    this.assertScope(scope);
    return scope;
  }

  scopeForOwner(customerId: number, siteId: number | null): CommunicationChannelScope {
    const scope = { customerId, siteId };
    this.assertScope(scope);
    return scope;
  }

  list(scope: CommunicationChannelScope) {
    return this.repository.list(scope);
  }

  save(
    scope: CommunicationChannelScope,
    routeChannel: CommunicationChannel,
    input: SaveCommunicationChannelInput,
    actor: string
  ) {
    if (input.config.channel !== routeChannel) {
      throw new AppError("Route and configuration channels must match", 400, "CHANNEL_MISMATCH");
    }
    if (input.siteId !== scope.siteId) {
      throw new AppError("Route and body scopes must match", 400, "SCOPE_MISMATCH");
    }
    if (
      input.config.channel === "SMS" &&
      input.config.transport === "HTTP" &&
      !input.config.providerUrl.startsWith("https://")
    ) {
      throw new AppError("HTTP SMS provider must use HTTPS", 400, "INSECURE_PROVIDER_URL");
    }
    const supplied = Object.fromEntries(
      Object.entries(input.secrets).filter(([, value]) => value.trim().length > 0)
    );
    let secrets = supplied;
    try {
      secrets = { ...this.repository.getRuntimeSecrets(scope, routeChannel), ...supplied };
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "Communication configuration not found") {
        throw error;
      }
    }
    if (Object.keys(secrets).length === 0) {
      throw new AppError(
        "A secret is required for initial configuration",
        400,
        "CHANNEL_SECRET_REQUIRED"
      );
    }
    return this.repository.upsert(
      scope,
      input.config as CommunicationChannelConfig,
      secrets,
      actor
    );
  }

  async test(
    scope: CommunicationChannelScope,
    channel: CommunicationChannel,
    destination: string
  ): Promise<{ messageId: string }> {
    if (scope.siteId === null)
      throw new AppError("Site scope is required for a delivery test", 400, "TEST_SITE_REQUIRED");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      return await new RuntimeCommunicationProvider(channel, this.repository).send(
        {
          delivery: {
            site_id: scope.siteId,
            channel,
            severity: "WARNING",
            idempotency_key: `test-${Date.now()}`,
          },
          recipient: destination,
          payload: { eventType: "CONFIGURATION_TEST", occurredAt: new Date().toISOString() },
        } as never,
        controller.signal
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private assertScope(scope: CommunicationChannelScope): void {
    const customer = this.database
      .prepare("SELECT status FROM platform_customers WHERE id=?")
      .get(scope.customerId) as { status: string } | undefined;
    if (!customer) throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
    if (customer.status !== "ACTIVE")
      throw new AppError("Customer is not active", 409, "CUSTOMER_NOT_ACTIVE");
    if (scope.siteId !== null) {
      const site = this.ownership.forSite(scope.siteId);
      if (!site || site.customerId !== scope.customerId) {
        throw new AppError("Site is outside customer scope", 403, "SITE_SCOPE_FORBIDDEN");
      }
    }
  }
}
