// Mirrors the public-site repo's config: serve the repo root with http-server
// and load pages via baseURL. No build step — this is a CDN-based SPA.
module.exports = {
  testDir: './tests',
  timeout: 20000,
  use: { baseURL: 'http://localhost:8080' },
  webServer: {
    command: 'npx http-server -p 8080 -c-1 .',
    port: 8080,
    reuseExistingServer: true,
  },
};
