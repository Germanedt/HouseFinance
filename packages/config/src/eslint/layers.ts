// Reglas de capas de Clean Architecture (tabla de la skill de estándares, sección 1).
// Cada capa declara qué no puede importar; ESLint lo hace cumplir con no-restricted-imports.

export type Layer = 'config' | 'domain' | 'application' | 'db' | 'contracts' | 'ui' | 'api' | 'web';

export type RestrictedImportPattern = {
  readonly group: readonly string[];
  readonly message: string;
};

const HONO = ['hono', 'hono/*'];
const NEXT = ['next', 'next/*'];
const REACT = ['react', 'react/*', 'react-dom', 'react-dom/*'];
const DRIZZLE = ['drizzle-orm', 'drizzle-orm/*', 'drizzle-kit'];
const SUPABASE = ['@supabase/*'];
const ZOD = ['zod', 'zod/*'];

/** Punto de entrada público con las implementaciones en memoria de los puertos. */
const TESTING_ENTRY_POINT = '@hf/application/testing';

/** Solo se importa la API pública de cada paquete, nunca sus rutas internas. */
const PUBLIC_API_ONLY: RestrictedImportPattern = {
  group: ['@hf/*/*', `!${TESTING_ENTRY_POINT}`],
  message: 'Importa solo la API pública del paquete (@hf/<nombre>), nunca sus rutas internas.',
};

/** Las implementaciones de prueba nunca llegan al código de producción. */
const TESTING_ONLY_IN_TESTS: RestrictedImportPattern = {
  group: [TESTING_ENTRY_POINT],
  message:
    'Las implementaciones de prueba (@hf/application/testing) solo se importan desde *.test.ts.',
};

export type RestrictedImportOptions = {
  /** El archivo es una prueba (`*.test.ts`): puede usar @hf/application/testing. */
  readonly isTestFile: boolean;
};

const LAYER_RESTRICTIONS: Readonly<Record<Layer, readonly RestrictedImportPattern[]>> = {
  config: [
    {
      group: ['@hf/*'],
      message: '@hf/config no depende de ningún otro paquete del monorepo.',
    },
  ],
  domain: [
    {
      group: ['@hf/*'],
      message: '@hf/domain no depende de ningún otro paquete del monorepo.',
    },
    {
      group: [...ZOD, ...HONO, '@hono/*', ...NEXT, ...REACT, ...DRIZZLE, ...SUPABASE],
      message: 'El dominio es TypeScript puro: sin librerías ni frameworks.',
    },
  ],
  application: [
    {
      group: ['@hf/db', '@hf/contracts', '@hf/ui', '@hf/config'],
      message: '@hf/application solo depende de @hf/domain.',
    },
    {
      group: [...ZOD, ...HONO, '@hono/*', ...NEXT, ...REACT, ...DRIZZLE, ...SUPABASE],
      message:
        'Los casos de uso no conocen frameworks ni infraestructura: dependen de puertos (interfaces).',
    },
  ],
  db: [
    {
      group: ['@hf/contracts', '@hf/ui', '@hf/config'],
      message: '@hf/db solo depende de @hf/application, @hf/domain y Drizzle.',
    },
    {
      group: [...HONO, '@hono/*', ...NEXT, ...REACT],
      message: 'La capa de datos no conoce la API HTTP ni la web.',
    },
  ],
  contracts: [
    {
      group: ['@hf/domain', '@hf/application', '@hf/db', '@hf/ui', '@hf/config'],
      message: '@hf/contracts no depende de ningún paquete del monorepo: solo de Zod.',
    },
    {
      group: [...HONO, ...NEXT, ...REACT, ...DRIZZLE, ...SUPABASE],
      message: 'Los contratos solo describen datos con Zod: sin frameworks ni infraestructura.',
    },
  ],
  ui: [
    {
      group: ['@hf/domain', '@hf/application', '@hf/db', '@hf/contracts', '@hf/config'],
      message: '@hf/ui no conoce ningún paquete de negocio: recibe todo por props.',
    },
    {
      group: [...HONO, '@hono/*', ...DRIZZLE, ...SUPABASE],
      message: '@hf/ui es solo presentación: sin API ni infraestructura.',
    },
  ],
  api: [
    {
      group: ['@hf/ui', '@hf/config'],
      message: 'apps/api depende de @hf/contracts, @hf/application, @hf/db y @hf/domain.',
    },
    {
      group: [...NEXT, ...REACT],
      message: 'La API no usa React ni Next.js.',
    },
  ],
  web: [
    {
      group: ['@hf/domain', '@hf/application', '@hf/db', '@hf/config'],
      message:
        'La web nunca conoce la base de datos ni la lógica de negocio: usa @hf/contracts y @hf/ui.',
    },
    {
      group: [...DRIZZLE, ...SUPABASE, ...HONO],
      message:
        'La web solo llama a la API con el cliente tipado de @hf/contracts; nunca a Supabase, Drizzle ni Hono.',
    },
  ],
};

export function getRestrictedImportPatterns(
  layer: Layer,
  options: RestrictedImportOptions = { isTestFile: false },
): readonly RestrictedImportPattern[] {
  const testingRule = options.isTestFile ? [] : [TESTING_ONLY_IN_TESTS];
  return [...testingRule, PUBLIC_API_ONLY, ...LAYER_RESTRICTIONS[layer]];
}
