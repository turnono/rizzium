import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      bundler: 'webpack',
      webServerCommands: {
        default: 'nx run rizzpos:serve',
        production: 'nx run rizzpos:serve:production',
      },
      ciWebServerCommand: 'nx run rizzpos:serve-static',
    }),
    baseUrl: 'http://localhost:4200',
    pageLoadTimeout: 120000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      TEST_USER_EMAIL: 'your-actual-test-user@example.com',
      TEST_USER_PASSWORD: 'your-actual-test-user-password',
    },
  },
});
