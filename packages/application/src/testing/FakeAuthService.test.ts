import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  UnauthenticatedError,
} from '@hf/domain';
import { describe, expect, it } from 'vitest';
import type { AuthService } from '../shared/ports/index.js';
import { FAKE_ACCESS_TOKEN_TTL_SECONDS, FakeAuthService } from './FakeAuthService.js';

const ANA = { id: 'user-ana', email: 'ana@example.com', password: 'S3cret!' } as const;
const LUIS = { id: 'user-luis', email: 'luis@example.com', password: 'Otra-clave' } as const;

function createService(): FakeAuthService {
  return new FakeAuthService([ANA, LUIS]);
}

describe('FakeAuthService', () => {
  describe('signIn', () => {
    it('opens a session with the shape of the session contract', async () => {
      const service: AuthService = createService();
      const session = await service.signIn({ email: ANA.email, password: ANA.password });
      expect(session).toEqual({
        accessToken: expect.any(String) as unknown,
        refreshToken: expect.any(String) as unknown,
        expiresIn: FAKE_ACCESS_TOKEN_TTL_SECONDS,
        user: { id: ANA.id, email: ANA.email },
      });
      await expect(service.verifyAccessToken(session.accessToken)).resolves.toBe(ANA.id);
    });

    it('ignores case and surrounding spaces in the email', async () => {
      const service = createService();
      const session = await service.signIn({ email: '  ANA@Example.com ', password: ANA.password });
      expect(session.user.id).toBe(ANA.id);
    });

    it.each([
      ['a wrong password', ANA.email, 'wrong'],
      ['a password with another case', ANA.email, 's3cret!'],
      ['an unknown email', 'nadie@example.com', ANA.password],
      ['empty credentials', '', ''],
    ])('rejects %s with INVALID_CREDENTIALS', async (_case, email, password) => {
      const service = createService();
      await expect(service.signIn({ email, password })).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
    });

    it('works without registered users', async () => {
      const service = new FakeAuthService();
      await expect(service.signIn({ email: ANA.email, password: ANA.password })).rejects.toThrow(
        InvalidCredentialsError,
      );
    });

    it('issues different tokens for each session', async () => {
      const service = createService();
      const first = await service.signIn({ email: ANA.email, password: ANA.password });
      const second = await service.signIn({ email: ANA.email, password: ANA.password });
      expect(second.accessToken).not.toBe(first.accessToken);
      expect(second.refreshToken).not.toBe(first.refreshToken);
      expect(service.activeSessionCount).toBe(2);
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token: the old one and its access token stop working', async () => {
      const service = createService();
      const original = await service.signIn({ email: ANA.email, password: ANA.password });

      const renewed = await service.refresh(original.refreshToken);
      expect(renewed.user).toEqual({ id: ANA.id, email: ANA.email });
      expect(renewed.refreshToken).not.toBe(original.refreshToken);
      await expect(service.verifyAccessToken(renewed.accessToken)).resolves.toBe(ANA.id);

      await expect(service.refresh(original.refreshToken)).rejects.toBeInstanceOf(
        InvalidRefreshTokenError,
      );
      await expect(service.verifyAccessToken(original.accessToken)).rejects.toBeInstanceOf(
        UnauthenticatedError,
      );
      expect(service.activeSessionCount).toBe(1);
    });

    it('rejects an unknown refresh token with INVALID_REFRESH_TOKEN', async () => {
      const service = createService();
      await expect(service.refresh('not-a-token')).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    });
  });

  describe('signOut', () => {
    it('revokes the session and its tokens', async () => {
      const service = createService();
      const session = await service.signIn({ email: ANA.email, password: ANA.password });

      await service.signOut(session.refreshToken);

      await expect(service.verifyAccessToken(session.accessToken)).rejects.toBeInstanceOf(
        UnauthenticatedError,
      );
      await expect(service.refresh(session.refreshToken)).rejects.toBeInstanceOf(
        InvalidRefreshTokenError,
      );
      expect(service.activeSessionCount).toBe(0);
    });

    it('is idempotent with an already revoked or unknown token', async () => {
      const service = createService();
      const session = await service.signIn({ email: ANA.email, password: ANA.password });
      await service.signOut(session.refreshToken);
      await expect(service.signOut(session.refreshToken)).resolves.toBeUndefined();
      await expect(service.signOut('not-a-token')).resolves.toBeUndefined();
    });

    it('only closes the given session', async () => {
      const service = createService();
      const ana = await service.signIn({ email: ANA.email, password: ANA.password });
      const luis = await service.signIn({ email: LUIS.email, password: LUIS.password });

      await service.signOut(ana.refreshToken);

      await expect(service.verifyAccessToken(luis.accessToken)).resolves.toBe(LUIS.id);
    });
  });

  describe('verifyAccessToken', () => {
    it('returns the userId of each user', async () => {
      const service = createService();
      const ana = await service.signIn({ email: ANA.email, password: ANA.password });
      const luis = await service.signIn({ email: LUIS.email, password: LUIS.password });
      await expect(service.verifyAccessToken(ana.accessToken)).resolves.toBe(ANA.id);
      await expect(service.verifyAccessToken(luis.accessToken)).resolves.toBe(LUIS.id);
    });

    it.each(['', 'not-a-token', 'fake-refresh-token-1'])(
      'rejects %j with UNAUTHENTICATED',
      async (token) => {
        const service = createService();
        await service.signIn({ email: ANA.email, password: ANA.password });
        await expect(service.verifyAccessToken(token)).rejects.toBeInstanceOf(UnauthenticatedError);
      },
    );
  });
});
