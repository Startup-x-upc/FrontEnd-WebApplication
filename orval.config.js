module.exports = {
  ctrApi: {
    input: {
      target: './docs/api/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/app/shared/infrastructure/api/generated/ctr-api.ts',
      schemas: './src/app/shared/infrastructure/api/generated/model',
      client: 'angular',
      mock: false,
    },
  },
};
