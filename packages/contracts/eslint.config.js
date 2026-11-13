import { createBaseConfig } from '@hf/config/eslint';

export default createBaseConfig({ layer: 'contracts', configUrl: import.meta.url });
