import { SetMetadata } from '@nestjs/common';
import { ZodType } from 'zod';
import { ZOD_SERIALIZER_SCHEMA_KEY } from '../interceptors/zod-serializer.interceptor';

export const SerializeResponse = (schema: ZodType) =>
  SetMetadata(ZOD_SERIALIZER_SCHEMA_KEY, schema);
