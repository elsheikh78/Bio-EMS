import { AppError } from "../errors/app-error";
import {
  PlatformPrincipal,
  PlatformPrincipalCredentialRecord,
} from "../entities/PlatformPrincipal";
import { PlatformLoginInput } from "../modules/platform-auth/dto/platform-login.schema";
import { verifyPassword } from "./password.service";
import { IssuedPlatformAccessToken } from "./platform-token.service";

const DUMMY_BCRYPT_HASH = "$2b$12$a4qNLowNiYMqjgUx2Pa8D.ubXSEImfhQDmrsw.MYU80cl5Ge4FijK";

export interface PlatformAuthRepository {
  findCredentialsByUsername(username: string): PlatformPrincipalCredentialRecord | undefined;
}

export interface PlatformAccessTokenIssuer {
  issueAccessToken(principal: PlatformPrincipal): IssuedPlatformAccessToken;
}

export interface PlatformLoginResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  principal: PlatformPrincipal;
}

const invalidCredentials = () => new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

export class PlatformAuthService {
  constructor(
    private readonly repository: PlatformAuthRepository,
    private readonly tokenIssuer: PlatformAccessTokenIssuer
  ) {}

  async login(input: PlatformLoginInput): Promise<PlatformLoginResponse> {
    const credentials = this.repository.findCredentialsByUsername(input.username);
    const passwordMatches = await verifyPassword(
      input.password,
      credentials?.password_hash ?? DUMMY_BCRYPT_HASH
    );

    if (
      !credentials ||
      !passwordMatches ||
      credentials.status !== "active" ||
      credentials.principal_type !== "SYSTEM_OWNER"
    ) {
      throw invalidCredentials();
    }

    const principal: PlatformPrincipal = {
      kind: "platform",
      type: "SYSTEM_OWNER",
      id: credentials.id,
      username: credentials.username,
    };
    const issued = this.tokenIssuer.issueAccessToken(principal);

    return {
      access_token: issued.accessToken,
      token_type: "bearer",
      expires_in: issued.expiresIn,
      principal,
    };
  }
}
