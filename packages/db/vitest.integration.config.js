import { createVitestConfig } from '@hf/config/vitest';

// Pruebas de integración contra un Postgres real (TEST_DATABASE_URL); ver src/testing/integrationGlobalSetup.ts.
export default createVitestConfig({
  integration: { globalSetup: './src/testing/integrationGlobalSetup.ts' },
});
