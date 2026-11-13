import { defineConfig, type ViteUserConfig } from 'vitest/config';

export type VitestConfigOptions = {
  /** Porcentaje mínimo de cobertura (líneas, funciones, ramas y sentencias). Sin él, solo se informa. */
  readonly coverageThreshold?: number;
};

/** Pruebas junto al archivo que prueban: `<archivo>.test.ts`. */
const TEST_FILES = ['src/**/*.test.{ts,tsx}'];

/**
 * Configuración base de Vitest para todos los paquetes, con informe de cobertura (v8).
 * Los barriles `index.ts` solo reexportan, así que no cuentan para la cobertura.
 */
export function createVitestConfig(options: VitestConfigOptions = {}): ViteUserConfig {
  const { coverageThreshold } = options;

  return defineConfig({
    test: {
      include: TEST_FILES,
      environment: 'node',
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [...TEST_FILES, 'src/**/index.ts', 'src/**/*.d.ts'],
        reporter: ['text', 'html', 'lcov', 'json-summary'],
        reportsDirectory: 'coverage',
        ...(coverageThreshold === undefined
          ? {}
          : {
              thresholds: {
                lines: coverageThreshold,
                functions: coverageThreshold,
                branches: coverageThreshold,
                statements: coverageThreshold,
              },
            }),
      },
    },
  });
}
