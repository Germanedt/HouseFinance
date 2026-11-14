import { describe, expect, it } from 'vitest';
import * as publicApi from './index';

// Prueba de ejemplo (F0-03): comprueba que el punto de entrada del paquete carga.
// Las pruebas reales llegan con el código de cada tarea del backlog.
describe('@hf/web public API', () => {
  it('loads the package entry point', () => {
    expect(publicApi).toBeTypeOf('object');
  });
});
