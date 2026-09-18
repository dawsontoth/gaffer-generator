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
 * Also pins down how the CLI reports a failed download: a non-zero exit code, without
 * abandoning any other .templateroots in the same run.
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
  function runCli(args) {
    return new Promise(resolve => {
      const child = spawn(process.execPath, [cliPath, ...args], {
        cwd: process.cwd(),
        env: { ...process.env, FORCE_COLOR: '0' },
        stdio: 'pipe',
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', chunk => stdout += chunk);
      child.stderr.on('data', chunk => stderr += chunk);
      child.on('close', status => resolve({ status, stdout, stderr }));
    });
  }

  function expectSuccess(res) {
    expect(res.status, `CLI exited with ${res.status}\nstdout:\n${res.stdout}\nstderr:\n${res.stderr}`).toBe(0);
  }

  // Each templateroot needs its own parent directory: `create` refuses to overwrite an
  // existing templateroot, and the example writes its output to a sibling `sample.output`.
  async function createTemplateUsingFetch(templaterootPath, metadataUrl) {
    fs.mkdirSync(path.dirname(templaterootPath), { recursive: true });
    const templatePath = path.join(templaterootPath, 'template.mjs');
    expectSuccess(await runCli(['create', templaterootPath]));

    // Swap the example's fake download for one that uses the injected fetch.
    const original = 'export function download() {\n'
      + '  return new Promise(resolve => resolve(sample))\n'
      + '    .then(json => createFileNames(json));\n'
      + '}';
    const replacement = 'export function download(fetch) {\n'
      + `  return fetch(${JSON.stringify(metadataUrl)})\n`
      + '    .then(res => res.json())\n'
      + '    .then(json => createFileNames(json));\n'
      + '}';
    // Normalize line endings: on Windows, git may check the example out with CRLF.
    const src = fs.readFileSync(templatePath, 'utf8').replace(/\r\n/g, '\n');
    expect(src).toContain(original);
    fs.writeFileSync(templatePath, src.replace(original, replacement));
  }

  function expectGeneratedOutput(outDir) {
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
  }

  it('generates the expected files when download() fetches metadata over HTTP', async () => {
    const projectDir = path.join(tmpDir, 'ok');
    await createTemplateUsingFetch(path.join(projectDir, 'sample.templateroot'), `${baseUrl}/swagger`);

    expectSuccess(await runCli(['generate', projectDir]));
    expectGeneratedOutput(path.join(projectDir, 'sample.output'));
  });

  it('reports the download error, generates nothing and exits non-zero when the fetch fails', async () => {
    const projectDir = path.join(tmpDir, 'missing');
    await createTemplateUsingFetch(path.join(projectDir, 'sample.templateroot'), `${baseUrl}/missing`);

    const generate = await runCli(['generate', projectDir]);
    expect(generate.stdout + generate.stderr).toContain('Hit error when downloading');
    expect(fs.existsSync(path.join(projectDir, 'sample.output'))).toBe(false);
    expect(generate.status).not.toBe(0);
  });

  it('still processes the remaining .templateroots when one download fails', async () => {
    const projectDir = path.join(tmpDir, 'mixed');
    // "broken" sorts before "working", so the failure is hit first and must not stop the loop.
    await createTemplateUsingFetch(path.join(projectDir, 'broken', 'sample.templateroot'), `${baseUrl}/missing`);
    await createTemplateUsingFetch(path.join(projectDir, 'working', 'sample.templateroot'), `${baseUrl}/swagger`);

    const generate = await runCli(['generate', projectDir]);
    expect(generate.stdout + generate.stderr).toContain('Hit error when downloading');
    expect(fs.existsSync(path.join(projectDir, 'broken', 'sample.output'))).toBe(false);
    expectGeneratedOutput(path.join(projectDir, 'working', 'sample.output'));
    expect(generate.status).not.toBe(0);
  });
});
