/** Conteúdo do access token (JWT) emitido em POST /auth/login. */
export interface JwtPayload {
  /** id do usuário */
  sub: string;
  name: string;
  email: string;
}
