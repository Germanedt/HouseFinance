/** Usuario autenticado (de Supabase Auth). No hay tabla propia de usuarios. */
export type AuthUser = {
  readonly id: string;
  readonly email: string;
};

/** Tokens de una sesión, con la forma de `SessionTokens` del contrato de sesión. */
export type AuthSession = {
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Segundos de vida del token de acceso. */
  readonly expiresIn: number;
  readonly user: AuthUser;
};

export type SignInCredentials = {
  readonly email: string;
  readonly password: string;
};

/**
 * Sesión de usuario: iniciar, renovar y cerrar, y validar el token de acceso de cada petición.
 * La implementación real es `SupabaseAuthService` (fase 1), usado solo desde la API.
 */
export type AuthService = {
  /** Lanza `InvalidCredentialsError` si el correo o la contraseña no son correctos. */
  signIn(credentials: SignInCredentials): Promise<AuthSession>;

  /**
   * Cambia el token de refresco por una sesión nueva; el anterior deja de valer (rotación).
   * Lanza `InvalidRefreshTokenError` si no existe, caducó, se revocó o ya se usó.
   */
  refresh(refreshToken: string): Promise<AuthSession>;

  /** Revoca la sesión y su token de refresco. Idempotente: un token ya revocado no da error. */
  signOut(refreshToken: string): Promise<void>;

  /** Devuelve el `userId` del token. Lanza `UnauthenticatedError` si no es válido. */
  verifyAccessToken(accessToken: string): Promise<string>;
};
