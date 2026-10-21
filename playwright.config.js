const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', timeout: 60000, workers: 1,
  use: {baseURL: process.env.DIAMOND_URL || 'http://127.0.0.1:8765', headless: true,
    launchOptions: process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']} : {},
    screenshot:'only-on-failure', trace:'retain-on-failure'},
  webServer: process.env.DIAMOND_URL ? undefined : {command:'python3 -m http.server 8765',port:8765,reuseExistingServer:!process.env.CI}
});
