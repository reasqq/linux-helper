import { expect, it } from 'vitest';
import { build, createServer } from 'vite';
import { readFileSync } from 'node:fs';
it('built file:// HTML has a production CSP with no dev origins and relative assets', async () => {
  const result = await build({ build: { write: false }, logLevel: 'silent' });
  const outputs = Array.isArray(result) ? result : [result];
  const htmlAsset = outputs.flatMap(output => 'output' in output ? output.output : []).find(asset => asset.fileName === 'index.html');
  expect(htmlAsset && 'source' in htmlAsset).toBeTruthy();
  const html = String(htmlAsset && 'source' in htmlAsset ? htmlAsset.source : '');
  const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
  expect(csp).toContain("connect-src 'none'"); expect(csp).toContain("script-src 'self';");
  expect(csp).not.toMatch(/localhost|127\.0\.0\.1|5173|wss?:|unsafe-eval/);
  expect(html).toMatch(/src="\.\/assets\//);
}, 15000);
it('development transform supports HMR separately', async () => {
  const server = await createServer({ server: { middlewareMode: true }, logLevel: 'silent' });
  try {
    const html = await server.transformIndexHtml('/', readFileSync('index.html', 'utf8'));
    expect(html).toContain('ws://localhost:5173'); expect(html).toContain("script-src 'self' 'unsafe-inline'");
  } finally { await server.close(); }
});
it('Electron retains renderer isolation and external link restrictions', () => {
  const main = readFileSync('electron/main.cjs', 'utf8');
  for (const setting of ['contextIsolation: true', 'nodeIntegration: false', 'sandbox: true', 'webSecurity: true', "target.protocol === 'https:' && trustedHosts.has(target.hostname)", "return { action: 'deny' }"]) expect(main).toContain(setting);
});
