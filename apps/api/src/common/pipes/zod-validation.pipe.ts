import { PipeTransform, BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Validation failed');
    }
  }
}
