/** Código de error del catálogo (`claude/contratos-api.md`, paso 3), en UPPER_SNAKE_CASE. */
export type ErrorCode = Uppercase<string>;

/** Datos tipados de un error; importes en céntimos y fechas en YYYY-MM-DD. */
export type ErrorDetails = Readonly<Record<string, unknown>>;

const UPPER_SNAKE_CASE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

/**
 * Base de todos los errores de negocio del dominio.
 *
 * - `code`: código del catálogo (UPPER_SNAKE_CASE), el mismo que devuelve la API.
 * - `details`: datos tipados para que la web componga el texto.
 *
 * Nunca lleva texto para el usuario: `message` es el propio código, solo para depurar.
 * Los errores concretos de cada módulo se crean en su fase y heredan de esta clase
 * (o de `NotFoundError` / `ValidationError`).
 */
export abstract class DomainError<
  TCode extends ErrorCode = ErrorCode,
  TDetails extends ErrorDetails | undefined = ErrorDetails | undefined,
> extends Error {
  readonly code: TCode;
  readonly details: TDetails;

  protected constructor(code: TCode, details: TDetails) {
    if (!UPPER_SNAKE_CASE.test(code)) {
      // Error de programación, nunca de negocio: el código no sigue el formato del catálogo.
      throw new TypeError(`Domain error code must be UPPER_SNAKE_CASE: "${code}"`);
    }
    super(code);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
  }
}

/** Recursos que pueden no existir (`details.resource` de `NOT_FOUND` en el catálogo). */
export type NotFoundResource = 'obligation' | 'bill' | 'movement' | 'income' | 'actor' | 'notice';

export type NotFoundDetails = {
  readonly resource: NotFoundResource;
};

/**
 * El recurso no existe, está eliminado o es de otro usuario (nunca se distingue cuál).
 * La API lo traduce a 404 `NOT_FOUND`.
 */
export class NotFoundError extends DomainError<'NOT_FOUND', NotFoundDetails> {
  constructor(resource: NotFoundResource) {
    super('NOT_FOUND', { resource });
  }
}

/** Códigos de error de campo del catálogo (`fields[].code`, paso 3.3). */
export type FieldErrorCode =
  | 'REQUIRED'
  | 'NOT_APPLICABLE'
  | 'INVALID_TYPE'
  | 'INVALID_VALUE'
  | 'INVALID_FORMAT'
  | 'INVALID_DATE'
  | 'NOT_INTEGER'
  | 'MUST_BE_POSITIVE'
  | 'OUT_OF_RANGE'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'EMPTY_UPDATE';

/** Un campo que no es válido, con la misma forma que `fields[]` de la respuesta de error. */
export type FieldError<TCode extends FieldErrorCode = FieldErrorCode> = {
  readonly path: string;
  readonly code: TCode;
};

/**
 * Uno o más campos no válidos, con la forma de `VALIDATION_ERROR` del catálogo
 * (`code` + `fields`, sin `details`). La API lo traduce a 422.
 */
export class ValidationError<
  TFieldCode extends FieldErrorCode = FieldErrorCode,
> extends DomainError<'VALIDATION_ERROR', undefined> {
  readonly fields: readonly [FieldError<TFieldCode>, ...FieldError<TFieldCode>[]];

  constructor(fields: readonly [FieldError<TFieldCode>, ...FieldError<TFieldCode>[]]) {
    super('VALIDATION_ERROR', undefined);
    // La copia de una tupla no vacía sigue teniendo al menos un elemento: el `as` es seguro.
    this.fields = Object.freeze(
      fields.map((field) => Object.freeze({ ...field })),
    ) as typeof fields;
  }
}
