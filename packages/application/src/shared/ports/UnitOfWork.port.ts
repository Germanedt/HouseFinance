/**
 * Ejecuta varias escrituras dentro de una sola transacción: o se guarda todo o nada.
 * Toda acción que escribe en más de una tabla (pagar, anular, crear una obligación con su recibo)
 * va dentro de `run`.
 *
 * La función no recibe la transacción: la implementación real (`DrizzleUnitOfWork`, F0-10) la
 * propaga a los repositorios, de modo que los casos de uso nunca conocen la infraestructura.
 * Si `work` falla, la transacción se deshace y el error se propaga tal cual.
 */
export type UnitOfWork = {
  run<TResult>(work: () => Promise<TResult>): Promise<TResult>;
};
