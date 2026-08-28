import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface RouteConfig { route: string; headers?: Record<string, string>; rewrite?: string }
interface StaticWebAppConfig {
  routes: RouteConfig[];
  mimeTypes: Record<string, string>;
  globalHeaders: Record<string, string>;
}

const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8')) as StaticWebAppConfig;

describe('deployment response policy', () => {
  it('sets immutable caching for content-hashed assets', () => {
    const assetRoute = config.routes.find((route) => route.route === '/assets/*');
    expect(assetRoute?.headers?.['Cache-Control']).toBe('public, max-age=31536000, immutable');
  });

  it('serves the manifest with its registered MIME type', () => {
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
  });

  it('sets browser hardening headers', () => {
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=(self)');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(config.globalHeaders['Strict-Transport-Security']).toContain('max-age=31536000');
  });
});
