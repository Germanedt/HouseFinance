// @hf/config se prueba con su propia configuración compilada (turbo.json: test depende de build).
import { createVitestConfig } from './dist/vitest/index.js';

export default createVitestConfig();
