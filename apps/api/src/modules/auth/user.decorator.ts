import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Decorator to get the user from the request, if it exists, intended to be paired with JwtPayload or OptionalJwtPayload types
 * if endpoint is public to ensure proper type safety
 */
export const User = createParamDecorator(
  (_: unknown, context: ExecutionContext) => {
    const request: Request = context.switchToHttp().getRequest();
    return request.user;
  },
);
