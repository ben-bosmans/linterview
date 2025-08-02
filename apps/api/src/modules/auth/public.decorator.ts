import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/**
 * Decorator to indicate that an endpoint is public
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
