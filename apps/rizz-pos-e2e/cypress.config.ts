import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      bundler: 'webpack',
      webServerCommands: {
        default: 'nx run rizz-pos:serve',
        production: 'nx run rizz-pos:serve:production',
      },
      ciWebServerCommand: 'nx run rizz-pos:serve-static',
    }),
    baseUrl: 'http://localhost:4200',
    pageLoadTimeout: 120000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      TEST_USER_EMAIL: 'test1@example.com',
      TEST_USER_PASSWORD: 'test1234',
    },
    specPattern: 'src/e2e/**/*.cy.ts',
  },
});
