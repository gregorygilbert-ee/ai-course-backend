import jwt from 'jsonwebtoken';
import { TokenVerifier, TokenPayload } from '../ports/outbound/TokenVerifier';

export class InvalidTokenError extends Error {
  constructor() {
    super('Invalid or expired token');
    this.name = 'InvalidTokenError';
  }
}

export class JwtTokenVerifier implements TokenVerifier {
  constructor(private readonly secret: string) {}

  verify(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.secret) as { sub: string; email: string };
      return { sub: payload.sub, email: payload.email };
    } catch {
      throw new InvalidTokenError();
    }
  }
}
