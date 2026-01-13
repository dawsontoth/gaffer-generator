import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('CLI integration (README flow)', () => {
  let tmpDir;
  const cliPath = path.resolve(process.cwd(), 'cli.js');

  beforeAll(() => {
    vi.setSystemTime(new Date('2020-01-01T00:00:00Z')); // stabilize any timestamped logs
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gaffer-generator-e2e-'));
  });

  afterAll(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    catch {
      // best effort cleanup
    }
    vi.useRealTimers();
  });

  function runCli(args, options = {}) {
    // Run "node ./cli.js <args...>" to match README usage
    const res = spawnSync(process.execPath, [cliPath, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0' },
      encoding: 'utf8',
      stdio: 'pipe',
      ...options,
    });
    // Helpful diagnostics on failure
    if (res.status !== 0) {
       
      console.error('CLI stdout:\n', res.stdout);
       
      console.error('CLI stderr:\n', res.stderr);
    }
    return res;
  }

  it('creates a template and generates expected files into sample.output', () => {
    // 1) Create a template in the temp directory (README: "gaffer-generator create")
    const templaterootPath = path.join(tmpDir, 'sample.templateroot');
    const create = runCli(['create', templaterootPath]);
    expect(create.status).toBe(0);

    // Sanity: the templateroot should exist now
    expect(fs.existsSync(templaterootPath)).toBe(true);

    // 2) Generate code from that template (README: "gaffer-generator generate")
    const generate = runCli(['generate', tmpDir]);
    expect(generate.status).toBe(0);

    const outDir = path.join(tmpDir, 'sample.output');
    expect(fs.existsSync(outDir)).toBe(true);

    // 3) Verify the files listed in the README example are produced
    const expected = [
      'date-parser.ts',
      'is-set.ts',
      path.join('models', 'day-of-week.ts'),
      path.join('models', 'address.ts'),
      path.join('models', 'geo-point.ts'),
      path.join('models', 'geo-polygon.ts'),
      path.join('models', 'geo-rectangle.ts'),
      path.join('models', 'page-index.ts'),
      path.join('models', 'paging.ts'),
      path.join('models', 'index.ts'),
      path.join('services', 'address.service.ts'),
      path.join('services', 'index.ts'),
    ];

    for (const rel of expected) {
      const full = path.join(outDir, rel);
      expect(fs.existsSync(full)).toBe(true);
      const stat = fs.statSync(full);
      expect(stat.isFile()).toBe(true);
      // Ensure there is some content
      const content = fs.readFileSync(full, 'utf8');
      expect(content.length).toBeGreaterThan(0);
    }
  });
});
