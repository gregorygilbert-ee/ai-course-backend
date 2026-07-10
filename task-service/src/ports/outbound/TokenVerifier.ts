export interface TokenPayload {
  sub: string;
  email: string;
}

export interface TokenVerifier {
  verify(token: string): TokenPayload;
}
