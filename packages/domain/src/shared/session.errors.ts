// Errores de sesión del catálogo (`claude/contratos-api.md`, pasos 3.2 y 3.4).
// Los lanzan las implementaciones del puerto `AuthService`; la API los traduce a 401.
import { DomainError } from './DomainError.js';

/** Correo o contraseña incorrectos; nunca se distingue cuál de los dos falla. */
export class InvalidCredentialsError extends DomainError<'INVALID_CREDENTIALS', undefined> {
  constructor() {
    super('INVALID_CREDENTIALS', undefined);
  }
}

/** El token de refresco no existe, caducó, se revocó o ya se usó (rotación). */
export class InvalidRefreshTokenError extends DomainError<'INVALID_REFRESH_TOKEN', undefined> {
  constructor() {
    super('INVALID_REFRESH_TOKEN', undefined);
  }
}

/** Falta el token de acceso, está caducado o no es válido. */
export class UnauthenticatedError extends DomainError<'UNAUTHENTICATED', undefined> {
  constructor() {
    super('UNAUTHENTICATED', undefined);
  }
}
