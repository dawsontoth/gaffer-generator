import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Exercises the `fetch` that the generator injects into a template's `download()`.
 * Nothing else in the suite performs a real HTTP request through it, so a swap or
 * major bump of the underlying fetch implementation would go unnoticed without this.
 */
describe('CLI integration (template downloads metadata via injected fetch)', () => {
  let tmpDir;
  let server;
  let baseUrl;
  const cliPath = path.resolve(process.cwd(), 'cli.js');
  const sampleJsonPath = path.resolve(process.cwd(), 'example', 'sample.templateroot', 'sample.json');

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gaffer-generator-fetch-e2e-'));
    server = http.createServer((req, res) => {
      if (req.url === '/swagger') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(fs.readFileSync(sampleJsonPath));
        return;
      }
      res.writeHead(404);
      res.end();
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // Must be async: a spawnSync would block this process's event loop, and the
  // in-process HTTP server above could never answer the child's request.
  function runCli(args, env = {}) {
    return new Promise(resolve => {
      const child = spawn(process.execPath, [cliPath, ...args], {
        cwd: process.cwd(),
        env: { ...process.env, FORCE_COLOR: '0', ...env },
        stdio: 'pipe',
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', chunk => stdout += chunk);
      child.stderr.on('data', chunk => stderr += chunk);
      child.on('close', status => {
        if (status !== 0) {
          console.error('CLI stdout:\n', stdout);
          console.error('CLI stderr:\n', stderr);
        }
        resolve({ status, stdout, stderr });
      });
    });
  }

  // Each test gets its own project directory: `create` refuses to overwrite an existing templateroot.
  function createTemplateUsingFetch(projectDir) {
    fs.mkdirSync(projectDir);
    const templaterootPath = path.join(projectDir, 'sample.templateroot');
    const templatePath = path.join(templaterootPath, 'template.mjs');
    return runCli(['create', templaterootPath]).then(create => {
      expect(create.status).toBe(0);

      // Swap the example's fake download for one that uses the injected fetch.
      const original = 'export function download() {\n'
        + '  return new Promise(resolve => resolve(sample))\n'
        + '    .then(json => createFileNames(json));\n'
        + '}';
      const replacement = 'export function download(fetch) {\n'
        + '  return fetch(process.env.GAFFER_TEST_METADATA_URL)\n'
        + '    .then(res => res.json())\n'
        + '    .then(json => createFileNames(json));\n'
        + '}';
      // Normalize line endings: on Windows, git may check the example out with CRLF.
      const src = fs.readFileSync(templatePath, 'utf8').replace(/\r\n/g, '\n');
      expect(src).toContain(original);
      fs.writeFileSync(templatePath, src.replace(original, replacement));
    });
  }

  it('generates the expected files when download() fetches metadata over HTTP', async () => {
    const projectDir = path.join(tmpDir, 'ok');
    await createTemplateUsingFetch(projectDir);

    const generate = await runCli(['generate', projectDir], { GAFFER_TEST_METADATA_URL: `${baseUrl}/swagger` });
    expect(generate.status).toBe(0);

    const outDir = path.join(projectDir, 'sample.output');
    const expected = [
      path.join('models', 'address.ts'),
      path.join('models', 'index.ts'),
      path.join('services', 'address.service.ts'),
      path.join('services', 'index.ts'),
    ];
    for (const rel of expected) {
      const full = path.join(outDir, rel);
      expect(fs.existsSync(full), `${rel} should exist`).toBe(true);
      expect(fs.readFileSync(full, 'utf8').length).toBeGreaterThan(0);
    }
    expect(fs.readFileSync(path.join(outDir, 'models', 'address.ts'), 'utf8')).toContain('export class Address');
  });

  it('reports the download error and generates nothing when the fetch fails', async () => {
    const projectDir = path.join(tmpDir, 'missing');
    await createTemplateUsingFetch(projectDir);

    const generate = await runCli(['generate', projectDir], { GAFFER_TEST_METADATA_URL: `${baseUrl}/missing` });
    expect(generate.stdout + generate.stderr).toContain('Hit error when downloading');
    expect(fs.existsSync(path.join(projectDir, 'sample.output'))).toBe(false);
  });
});
