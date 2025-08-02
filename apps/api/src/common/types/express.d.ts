import { JwtPayload } from 'src/modules/auth/auth.types';

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}
