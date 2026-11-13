import { createBaseConfig } from '@hf/config/eslint';

export default createBaseConfig({ layer: 'db', configUrl: import.meta.url });
