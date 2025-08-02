import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map } from 'rxjs';
import { ZodType } from 'zod';
export const ZOD_SERIALIZER_SCHEMA_KEY = 'zod_serializer_schema';
import { z } from 'zod';

@Injectable()
export class ZodSerializerInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const schema = this.reflector.getAllAndOverride<ZodType>(
      ZOD_SERIALIZER_SCHEMA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!schema) return next.handle();

    return next.handle().pipe(
      map((data) => {
        try {
          return schema.parse(data);
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error('Zod Response Validation Error:', error.message);
            throw new InternalServerErrorException(
              'Response data validation failed.',
            );
          }
          throw error;
        }
      }),
    );
  }
}
