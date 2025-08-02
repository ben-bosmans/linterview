// What access token JWTs contain
export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

// JWT Payload if the endpoint is public - may or may not have user information
export type OptionalJwtPayload = JwtPayload | undefined;
