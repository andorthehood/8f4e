import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDir, '..');
const fixturePath = path.join(testDir, 'fixtures', 'minimal.8f4e');
const jsonFixturePath = path.join(testDir, 'fixtures', 'audioBuffer.project.json');
const tmpDir = path.join(testDir, '.tmp');
const tracePath = path.join(tmpDir, 'audioBuffer.trace.json');
const wasmPath = path.join(tmpDir, 'audioBuffer.wasm');

describe('cli', () => {
	it('writes instruction flow trace when --trace-output is provided', async () => {
		await fs.mkdir(tmpDir, { recursive: true });
		await execFileAsync(process.execPath, [path.join(packageRoot, 'bin', 'cli.js'), fixturePath, '--trace-output', tracePath], {
			cwd: packageRoot,
		});

		const raw = await fs.readFile(tracePath, 'utf8');
		const trace = JSON.parse(raw) as { memorySizeBytes: number; blocks: Array<{ entries: unknown[] }> };

		expect(trace.memorySizeBytes).toBeTypeOf('number');
		expect(Array.isArray(trace.blocks)).toBe(true);
		expect(trace.blocks.length).toBeGreaterThan(0);
		expect(trace.blocks.some(block => block.entries.length > 0)).toBe(true);
	});

	it('writes wasm bytes when --wasm-output is provided', async () => {
		await fs.mkdir(tmpDir, { recursive: true });
		await execFileAsync(process.execPath, [path.join(packageRoot, 'bin', 'cli.js'), fixturePath, '--wasm-output', wasmPath], {
			cwd: packageRoot,
		});
		const wasmBytes = await fs.readFile(wasmPath);

		expect(wasmBytes.length).toBeGreaterThan(8);
		expect(wasmBytes.subarray(0, 4)).toEqual(Buffer.from([0x00, 0x61, 0x73, 0x6d]));
	});

	it('fails when neither --wasm-output nor --trace-output is provided', async () => {
		await fs.mkdir(tmpDir, { recursive: true });

		await expect(execFileAsync(process.execPath, [path.join(packageRoot, 'bin', 'cli.js'), fixturePath], { cwd: packageRoot })).rejects.toThrow(
			'Command failed'
		);
	});

	it('rejects JSON input files', async () => {
		await fs.mkdir(tmpDir, { recursive: true });

		await expect(
			execFileAsync(process.execPath, [path.join(packageRoot, 'bin', 'cli.js'), jsonFixturePath, '--wasm-output', wasmPath], {
				cwd: packageRoot,
			})
		).rejects.toThrow('Invalid input file: expected a .8f4e project file');
	});
});
