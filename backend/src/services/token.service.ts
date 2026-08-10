import jwt from "jsonwebtoken";
import { JwtConfig } from "../config/jwt.config";

export interface IssuedAccessToken {
  accessToken: string;
  expiresIn: number;
}

export class TokenService {
  constructor(private readonly configuration: JwtConfig) {}

  issueAccessToken(userId: number): IssuedAccessToken {
    const expiresIn = this.configuration.expireMinutes * 60;
    const accessToken = jwt.sign({}, this.configuration.secret, {
      algorithm: "HS256",
      audience: this.configuration.audience,
      expiresIn,
      issuer: this.configuration.issuer,
      noTimestamp: true,
      subject: String(userId),
    });

    return { accessToken, expiresIn };
  }
}
