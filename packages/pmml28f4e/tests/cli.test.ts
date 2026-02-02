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
const outputPath = path.join(tmpDir, 'project.json');

describe('pmml28f4e cli', () => {
	it('writes output JSON when --out is provided', async () => {
		await fs.mkdir(tmpDir, { recursive: true });
		await execFileAsync(
			process.execPath,
			[path.join(packageRoot, 'dist', 'cli.js'), fixturePath, '--out', outputPath, '--pretty', '--name', 'Tiny'],
			{ cwd: packageRoot }
		);

		const raw = await fs.readFile(outputPath, 'utf8');
		const output = JSON.parse(raw) as Record<string, unknown>;

		expect(output.codeBlocks).toBeDefined();
	});
});
