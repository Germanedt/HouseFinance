// API pública de @hf/config. Configuración compartida: tsconfig, ESLint y Prettier.
// Puntos de entrada:
//   @hf/config/tsconfig.base.json    tsconfig estricto de todos los paquetes
//   @hf/config/tsconfig.nextjs.json  añadidos que exige Next.js (apps/web)
//   @hf/config/eslint                createBaseConfig
//   @hf/config/eslint/next           createNextConfig (apps/web)
//   @hf/config/prettier              configuración de Prettier
export type { Layer } from './eslint/layers.js';
