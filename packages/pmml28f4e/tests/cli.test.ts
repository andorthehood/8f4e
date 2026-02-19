import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDir, '..');
const fixturePath = path.join(testDir, 'fixtures', 'tiny.pmml');
const tmpDir = path.join(testDir, '.tmp');
const outputPath = path.join(tmpDir, 'project.8f4e');

describe('pmml28f4e cli', () => {
	it('writes output .8f4e text when --out is provided', async () => {
		await fs.mkdir(tmpDir, { recursive: true });
		await execFileAsync(
			process.execPath,
			[path.join(packageRoot, 'dist', 'cli.js'), fixturePath, '--out', outputPath],
			{ cwd: packageRoot }
		);

		const raw = await fs.readFile(outputPath, 'utf8');

		expect(raw).toMatch(/^8f4e\/v1/);
	});
});
