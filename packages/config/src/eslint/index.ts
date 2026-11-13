// Configuración base de ESLint (sin Next.js). La de la web está en @hf/config/eslint/next.
export { createBaseConfig, type BaseConfigOptions } from './base.config.js';
export { getRestrictedImportPatterns, type Layer, type RestrictedImportPattern } from './layers.js';
