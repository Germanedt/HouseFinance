import type { Linter } from 'eslint';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import { createBaseConfig } from './base.config.js';

export type NextConfigOptions = {
  /** `import.meta.url` del eslint.config.js de la app. */
  readonly configUrl: string;
};

/** Archivos especiales de Next.js que exigen `export default`. */
const NEXT_SPECIAL_FILES = [
  'src/app/**/{page,layout,template,loading,error,global-error,not-found,default,route}.tsx',
  'src/app/**/{opengraph-image,twitter-image,icon,apple-icon,sitemap,robots,manifest}.{ts,tsx}',
  'src/middleware.ts',
  'src/proxy.ts',
];

/** Configuración de ESLint de apps/web: la base del monorepo más eslint-config-next. */
export function createNextConfig(options: NextConfigOptions): Linter.Config[] {
  return createBaseConfig({
    layer: 'web',
    configUrl: options.configUrl,
    frameworkConfigs: [
      ...nextCoreWebVitals,
      ...nextTypescript,
      // Regla exclusiva del Pages Router; la web usa solo App Router.
      { rules: { '@next/next/no-html-link-for-pages': 'off' } },
    ],
    defaultExportFiles: NEXT_SPECIAL_FILES,
  });
}
