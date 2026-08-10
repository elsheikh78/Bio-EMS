import { AppError } from "../errors/app-error";
import { UserCredentialRecord, UserRole } from "../entities/User";
import { LoginInput } from "../modules/auth/dto/login.schema";
import { verifyPassword } from "./password.service";
import { IssuedAccessToken } from "./token.service";

const DUMMY_BCRYPT_HASH = "$2b$12$a4qNLowNiYMqjgUx2Pa8D.ubXSEImfhQDmrsw.MYU80cl5Ge4FijK";

export interface AuthUserRepository {
  findCredentialsByUsername(username: string): UserCredentialRecord | undefined;
}

export interface AccessTokenIssuer {
  issueAccessToken(userId: number): IssuedAccessToken;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: {
    id: number;
    username: string;
    role: UserRole;
  };
}

const invalidCredentials = () => new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

export class AuthService {
  constructor(
    private readonly userRepository: AuthUserRepository,
    private readonly tokenIssuer: AccessTokenIssuer
  ) {}

  async login(input: LoginInput): Promise<LoginResponse> {
    const credentials = this.userRepository.findCredentialsByUsername(input.username);
    const passwordMatches = await verifyPassword(
      input.password,
      credentials?.password_hash ?? DUMMY_BCRYPT_HASH
    );

    if (!credentials || !passwordMatches || credentials.status !== "active") {
      throw invalidCredentials();
    }

    const issued = this.tokenIssuer.issueAccessToken(credentials.id);
    return {
      access_token: issued.accessToken,
      token_type: "bearer",
      expires_in: issued.expiresIn,
      user: {
        id: credentials.id,
        username: credentials.username,
        role: credentials.role,
      },
    };
  }
}
