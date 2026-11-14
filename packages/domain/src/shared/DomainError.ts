/**
 * Base de todos los errores de negocio del dominio.
 *
 * - `code`: código del catálogo (UPPER_SNAKE_CASE), el mismo que devuelve la API.
 * - `details`: datos tipados para que la web componga el texto (importes en céntimos, fechas YYYY-MM-DD).
 *
 * Nunca lleva texto para el usuario: `message` es el propio código, solo para depurar.
 * F0-07 completa esta base con los errores genéricos `NotFoundError` y `ValidationError`.
 */
export abstract class DomainError<
  TCode extends string = string,
  TDetails extends Readonly<Record<string, unknown>> | undefined = undefined,
> extends Error {
  readonly code: TCode;
  readonly details: TDetails;

  protected constructor(code: TCode, details: TDetails) {
    super(code);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
  }
}
