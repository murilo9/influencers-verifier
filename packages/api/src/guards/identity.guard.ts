import {
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from "@nestjs/common";
import { ObjectId } from "mongodb";
import { verify } from "jsonwebtoken";
import { DatabaseService } from "src/database.provider";
import { ConfigService } from "@nestjs/config";

/**
 * This guard takes the Authorization header to fetch the requesting user in the database.
 * If the user exists, save it in the request object.
 * Otherwise, throws a ForbiddenException.
 */
export class IdentityGuard implements CanActivate {
  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(ConfigService) private configService: ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization: string };
    }>();
    const jwtSecret = this.configService.get("JWT_SECRET");
    const { authorization } = request.headers;
    const { adminPassword } = verify(authorization, jwtSecret) as {
      adminPassword: string;
    };
    const actualAdminPassword = this.configService.get("ADMIN_PASSWORD");
    if (adminPassword !== actualAdminPassword) {
      throw new UnauthorizedException("Invalid admin password");
    }
    return true;
  }
}
