import { PipeTransform, BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (e) {
      console.error('Validation Failed', e);
      throw new BadRequestException('Validation failed');
    }
  }
}
