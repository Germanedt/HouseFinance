import { createBaseConfig } from '@hf/config/eslint';

export default createBaseConfig({ layer: 'api', configUrl: import.meta.url });
