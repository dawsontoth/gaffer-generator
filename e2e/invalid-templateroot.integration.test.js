import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * A .templateroot that cannot be used at all (no template file, or a template file
 * missing a required export) is logged and skipped. The CLI must still exit non-zero
 * so callers can tell the run was incomplete, without abandoning valid .templateroots.
 */
describe('CLI integration (invalid .templateroot)', () => {
  let tmpDir;
  const cliPath = path.resolve(process.cwd(), 'cli.js');

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gaffer-generator-invalid-e2e-'));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function runCli(args) {
    return spawnSync(process.execPath, [cliPath, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0' },
      encoding: 'utf8',
      stdio: 'pipe',
    });
  }

  function expectSuccess(res) {
    expect(res.status, `CLI exited with ${res.status}\nstdout:\n${res.stdout}\nstderr:\n${res.stderr}`).toBe(0);
  }

  function writeTemplateroot(templaterootPath, templateSource) {
    fs.mkdirSync(templaterootPath, { recursive: true });
    if (templateSource !== undefined) {
      fs.writeFileSync(path.join(templaterootPath, 'template.mjs'), templateSource);
    }
  }

  function expectFailure(projectDir, message) {
    const generate = runCli(['generate', projectDir]);
    expect(generate.stdout + generate.stderr).toContain(message);
    expect(fs.existsSync(path.join(projectDir, 'sample.output'))).toBe(false);
    expect(generate.status).not.toBe(0);
  }

  it('exits non-zero when a .templateroot has no template file', () => {
    const projectDir = path.join(tmpDir, 'no-template');
    writeTemplateroot(path.join(projectDir, 'sample.templateroot'));

    expectFailure(projectDir, 'Found .templateroot without a template.cjs, template.mjs, template.js or template.ts file');
  });

  it('exits non-zero when the template file has no "into" export', () => {
    const projectDir = path.join(tmpDir, 'no-into');
    writeTemplateroot(path.join(projectDir, 'sample.templateroot'), 'export function download() { return Promise.resolve({}); }\n');

    expectFailure(projectDir, 'Found .templateroot that does not have a "into" export');
  });

  it('exits non-zero when the template file has no "download" export', () => {
    const projectDir = path.join(tmpDir, 'no-download');
    writeTemplateroot(path.join(projectDir, 'sample.templateroot'), 'export const into = \'../sample.output/\';\n');

    expectFailure(projectDir, 'Found .templateroot that does not have a "download" export');
  });

  it('still generates a valid .templateroot alongside an invalid one', () => {
    const projectDir = path.join(tmpDir, 'mixed');
    // "broken" sorts before "working", so the invalid one is hit first and must not stop the loop.
    writeTemplateroot(path.join(projectDir, 'broken', 'sample.templateroot'));
    fs.mkdirSync(path.join(projectDir, 'working'));
    expectSuccess(runCli(['create', path.join(projectDir, 'working', 'sample.templateroot')]));

    const generate = runCli(['generate', projectDir]);
    expect(generate.stdout + generate.stderr).toContain('Found .templateroot without a template');
    expect(fs.existsSync(path.join(projectDir, 'broken', 'sample.output'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, 'working', 'sample.output', 'models', 'address.ts'))).toBe(true);
    expect(generate.status).not.toBe(0);
  });
});
