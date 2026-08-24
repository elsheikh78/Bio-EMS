import { PlatformPrincipal } from "../entities/PlatformPrincipal";
import { UserRole } from "../entities/User";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: UserRole;
      };
      platformPrincipal?: PlatformPrincipal;
    }
  }
}

export {};
