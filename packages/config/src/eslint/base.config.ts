import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import type { Linter } from 'eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';
import { getRestrictedImportPatterns, type Layer } from './layers.js';

export type BaseConfigOptions = {
  /** Capa de Clean Architecture del paquete: decide qué importaciones están prohibidas. */
  readonly layer: Layer;
  /** `import.meta.url` del eslint.config.js del paquete. */
  readonly configUrl: string;
  /** Configuraciones de framework (p. ej. Next.js) que van tras las de TypeScript. */
  readonly frameworkConfigs?: readonly Linter.Config[];
  /** Archivos que pueden usar `export default` (archivos especiales de un framework). */
  readonly defaultExportFiles?: readonly string[];
};

const SOURCE_FILES = ['src/**/*.{ts,tsx}'];
const JS_FILES = ['**/*.{js,mjs,cjs}'];

/**
 * Configuración de ESLint común a todo el monorepo:
 * typescript-eslint en strict-type-checked y stylistic-type-checked, reglas de capas
 * y reglas de la skill de estándares. Prettier va al final para desactivar las reglas de formato.
 */
export function createBaseConfig(options: BaseConfigOptions): Linter.Config[] {
  const { layer, configUrl, frameworkConfigs = [], defaultExportFiles = [] } = options;

  return defineConfig(
    globalIgnores(['dist/', '.next/', 'coverage/', '.turbo/', 'next-env.d.ts']),
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: fileURLToPath(new URL('.', configUrl)),
        },
      },
    },
    ...frameworkConfigs,
    {
      // Los archivos de configuración en JavaScript no forman parte de ningún tsconfig.
      files: JS_FILES,
      extends: [tseslint.configs.disableTypeChecked],
    },
    {
      files: SOURCE_FILES,
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          { patterns: getRestrictedImportPatterns(layer).map((pattern) => ({ ...pattern })) },
        ],
        // Tipo de retorno explícito en todo lo exportado.
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        // Tipos con `type`, no con `interface` (props, modelos, entradas y salidas).
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        // Solo exportaciones nombradas.
        'no-restricted-exports': [
          'error',
          {
            restrictDefaultExports: {
              direct: true,
              named: true,
              defaultFrom: true,
              namedFrom: true,
              namespaceFrom: true,
            },
          },
        ],
      },
    },
    defaultExportFiles.length > 0
      ? { files: [...defaultExportFiles], rules: { 'no-restricted-exports': 'off' } }
      : {},
    prettier,
  );
}
