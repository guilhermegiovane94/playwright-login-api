const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'html',
  timeout: 120000,
  use: {
    baseURL: 'https://reqres.in',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.REQRES_API_KEY && {
        'x-api-key': process.env.REQRES_API_KEY,
      }),
    },
    extraHTTPHeaders: {
      'User-Agent': 'playwright-login-api/1.0',
    },
  },
  projects: [
    {
      name: 'login-api',
      testMatch: /.*\.spec\.js/,
    },
  ],
});
