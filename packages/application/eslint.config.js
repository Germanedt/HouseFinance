import { createBaseConfig } from '@hf/config/eslint';

export default createBaseConfig({ layer: 'application', configUrl: import.meta.url });
