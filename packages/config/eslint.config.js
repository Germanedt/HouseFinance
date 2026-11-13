// @hf/config se lintea con su propia configuración compilada (turbo.json: lint depende de build).
import { createBaseConfig } from './dist/eslint/index.js';

export default createBaseConfig({ layer: 'config', configUrl: import.meta.url });
