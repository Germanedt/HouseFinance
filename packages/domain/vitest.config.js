import { createVitestConfig } from '@hf/config/vitest';

// @hf/domain exige al menos un 90 % de cobertura (backlog F0-03 y skill de estándares).
export default createVitestConfig({ coverageThreshold: 90 });
