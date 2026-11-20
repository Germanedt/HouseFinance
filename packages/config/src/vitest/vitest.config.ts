import { defineConfig, type ViteUserConfig } from 'vitest/config';

export type VitestConfigOptions = {
  /** Porcentaje mínimo de cobertura (líneas, funciones, ramas y sentencias). Sin él, solo se informa. */
  readonly coverageThreshold?: number;
  /**
   * Pruebas de integración (`*.integration.test.ts`) contra servicios reales, como Postgres.
   * Se ejecutan con su propio script (`test:integration`), en serie y sin informe de cobertura.
   */
  readonly integration?: {
    /** Archivo que prepara y destruye los recursos compartidos (p. ej. una base de datos temporal). */
    readonly globalSetup: string;
  };
};

/** Pruebas junto al archivo que prueban: `<archivo>.test.ts`. */
const TEST_FILES = ['src/**/*.test.{ts,tsx}'];
/** Pruebas de integración: `<archivo>.integration.test.ts`; nunca se ejecutan con `pnpm test`. */
const INTEGRATION_TEST_FILES = ['src/**/*.integration.test.{ts,tsx}'];

const INTEGRATION_TEST_TIMEOUT_MS = 30_000;

/**
 * Configuración base de Vitest para todos los paquetes, con informe de cobertura (v8).
 * Los barriles `index.ts` solo reexportan, así que no cuentan para la cobertura.
 */
export function createVitestConfig(options: VitestConfigOptions = {}): ViteUserConfig {
  const { coverageThreshold, integration } = options;

  if (integration !== undefined) {
    return defineConfig({
      test: {
        include: INTEGRATION_TEST_FILES,
        environment: 'node',
        globalSetup: [integration.globalSetup],
        // Comparten una base de datos: un archivo de pruebas detrás de otro.
        fileParallelism: false,
        testTimeout: INTEGRATION_TEST_TIMEOUT_MS,
        hookTimeout: INTEGRATION_TEST_TIMEOUT_MS,
      },
    });
  }

  return defineConfig({
    test: {
      include: TEST_FILES,
      exclude: INTEGRATION_TEST_FILES,
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
