import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Config } from 'src/common/config/schema.config';
import { IS_PUBLIC_KEY } from './public.decorator';
import { JwtPayload } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService<Config>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if this endpoint / controller is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request: Request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);
    // If there is no access token, and the endpoint is private, the user is not authenticated
    if (!token && !isPublic) throw new UnauthorizedException();

    // If there is an access token
    if (token) {
      try {
        // Verify that it was signed by us
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
        });
        // If it was, add the user to the request (regardless of whether the endpoint is public or not, so
        // that we have access to the user if they are authenticated even on public endpoints)
        request.user = payload;
      } catch {
        // If the token wasn't signed by us, and the endpoint is private, the user is not authenticated
        if (!isPublic) throw new UnauthorizedException();
      }
    }
    // Otherwise, the endpoint is public, or the user is authenticated
    return true;
  }

  /**
   * Gets the bearer token contained in the authorization header if it exists
   * @param request Request object
   * @returns The bearer token, if it exists
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
