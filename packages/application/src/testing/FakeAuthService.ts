import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  UnauthenticatedError,
} from '@hf/domain';
import type { AuthService, AuthSession, SignInCredentials } from '../shared/ports/index.js';

/** Usuario registrado en el `FakeAuthService`. */
export type FakeAuthUser = {
  readonly id: string;
  readonly email: string;
  readonly password: string;
};

type SessionRecord = {
  readonly userId: string;
  readonly email: string;
  readonly accessToken: string;
};

/** Segundos de vida del token de acceso que devuelve el fake. */
export const FAKE_ACCESS_TOKEN_TTL_SECONDS = 3600;

/**
 * Servicio de sesión en memoria para pruebas. Reproduce las reglas del contrato:
 * - el correo no distingue mayúsculas, la contraseña sí, y nunca se dice cuál de los dos falla;
 * - renovar rota el token de refresco: el anterior y su token de acceso dejan de valer;
 * - cerrar sesión revoca la sesión y es idempotente.
 */
export class FakeAuthService implements AuthService {
  private readonly usersByEmail = new Map<string, FakeAuthUser>();
  /** Sesiones vigentes por token de refresco. */
  private readonly sessions = new Map<string, SessionRecord>();
  /** Tokens de acceso vigentes y su usuario. */
  private readonly accessTokens = new Map<string, string>();
  private issued = 0;

  constructor(users: readonly FakeAuthUser[] = []) {
    for (const user of users) {
      this.usersByEmail.set(normalizeEmail(user.email), user);
    }
  }

  signIn(credentials: SignInCredentials): Promise<AuthSession> {
    const user = this.usersByEmail.get(normalizeEmail(credentials.email));
    if (user?.password !== credentials.password) {
      return Promise.reject(new InvalidCredentialsError());
    }
    return Promise.resolve(this.openSession(user.id, user.email));
  }

  refresh(refreshToken: string): Promise<AuthSession> {
    const session = this.sessions.get(refreshToken);
    if (session === undefined) {
      return Promise.reject(new InvalidRefreshTokenError());
    }
    this.closeSession(refreshToken, session);
    return Promise.resolve(this.openSession(session.userId, session.email));
  }

  signOut(refreshToken: string): Promise<void> {
    const session = this.sessions.get(refreshToken);
    if (session !== undefined) {
      this.closeSession(refreshToken, session);
    }
    return Promise.resolve();
  }

  verifyAccessToken(accessToken: string): Promise<string> {
    const userId = this.accessTokens.get(accessToken);
    if (userId === undefined) {
      return Promise.reject(new UnauthenticatedError());
    }
    return Promise.resolve(userId);
  }

  /** Número de sesiones abiertas en este momento. */
  get activeSessionCount(): number {
    return this.sessions.size;
  }

  private openSession(userId: string, email: string): AuthSession {
    this.issued += 1;
    const accessToken = `fake-access-token-${String(this.issued)}`;
    const refreshToken = `fake-refresh-token-${String(this.issued)}`;
    this.sessions.set(refreshToken, { userId, email, accessToken });
    this.accessTokens.set(accessToken, userId);
    return {
      accessToken,
      refreshToken,
      expiresIn: FAKE_ACCESS_TOKEN_TTL_SECONDS,
      user: { id: userId, email },
    };
  }

  private closeSession(refreshToken: string, session: SessionRecord): void {
    this.sessions.delete(refreshToken);
    this.accessTokens.delete(session.accessToken);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
