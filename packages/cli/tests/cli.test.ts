import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDir, '..');
const fixturePath = path.join(testDir, 'fixtures', 'audioBuffer.project.json');
const tmpDir = path.join(testDir, '.tmp');
const outputPath = path.join(tmpDir, 'audioBuffer.runtime-ready.json');

describe('cli', () => {
	it('compiles a project JSON to runtime-ready output', async () => {
		await fs.mkdir(tmpDir, { recursive: true });
		await execFileAsync(process.execPath, [path.join(packageRoot, 'bin', 'cli.js'), fixturePath, '-o', outputPath], {
			cwd: packageRoot,
		});

		const raw = await fs.readFile(outputPath, 'utf8');
		const output = JSON.parse(raw) as Record<string, unknown>;

		expect(output.compiledProjectConfig).toBeDefined();
		expect(output.compiledModules).toBeDefined();
		expect(output.compiledWasm).toBeDefined();
	});
});
