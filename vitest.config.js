import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          bindings: {
            READWISE_TOKEN: 'test-token',
          },
          kvNamespaces: ['KV'],
        },
      },
    },
  },
});
