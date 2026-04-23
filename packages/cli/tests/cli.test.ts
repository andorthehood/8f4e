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
const runtimeFixturePath = path.join(testDir, 'fixtures', 'runtimeInspect.8f4e');
const runtimeBytesPath = path.join(testDir, 'fixtures', 'runtimeBytes.bin');
const tmpDir = path.join(testDir, '.tmp');
const tracePath = path.join(tmpDir, 'audioBuffer.trace.json');
const wasmPath = path.join(tmpDir, 'audioBuffer.wasm');
const runOutPath = path.join(tmpDir, 'runtimeInspect.output.json');

function execCli(args: string[]) {
	return execFileAsync(process.execPath, [path.join(packageRoot, 'bin', 'cli.js'), ...args], {
		cwd: packageRoot,
	});
}

describe('cli', () => {
	it('writes instruction flow trace when compile --trace-output is provided', async () => {
		await fs.mkdir(tmpDir, { recursive: true });
		await execCli(['compile', fixturePath, '--trace-output', tracePath]);

		const raw = await fs.readFile(tracePath, 'utf8');
		const trace = JSON.parse(raw) as { requiredMemoryBytes: number; blocks: Array<{ entries: unknown[] }> };

		expect(trace.requiredMemoryBytes).toBeTypeOf('number');
		expect(Array.isArray(trace.blocks)).toBe(true);
		expect(trace.blocks.length).toBeGreaterThan(0);
		expect(trace.blocks.some(block => block.entries.length > 0)).toBe(true);
	});

	it('writes wasm bytes when compile --wasm-output is provided', async () => {
		await fs.mkdir(tmpDir, { recursive: true });
		await execCli(['compile', fixturePath, '--wasm-output', wasmPath]);

		const wasmBytes = await fs.readFile(wasmPath);

		expect(wasmBytes.length).toBeGreaterThan(8);
		expect(wasmBytes.subarray(0, 4)).toEqual(Buffer.from([0x00, 0x61, 0x73, 0x6d]));
	});

	it('fails when compile is called without any output flag', async () => {
		await fs.mkdir(tmpDir, { recursive: true });

		await expect(execCli(['compile', fixturePath])).rejects.toThrow('Command failed');
	});

	it('rejects JSON input files for compile', async () => {
		await fs.mkdir(tmpDir, { recursive: true });

		await expect(execCli(['compile', jsonFixturePath, '--wasm-output', wasmPath])).rejects.toThrow('Command failed');
	});

	it('runs cycles, applies sets, and dumps requested ids as JSON', async () => {
		const { stdout } = await execCli([
			'run',
			runtimeFixturePath,
			'--cycles',
			'3',
			'--set',
			'gain=1.25',
			'--set-json',
			'buffer=[1,2,3,4]',
			'--dump',
			'counter',
			'--dump',
			'gain',
			'--dump',
			'buffer',
		]);

		expect(JSON.parse(stdout)).toEqual({
			counter: 3,
			gain: 1.25,
			buffer: [1, 2, 3, 4],
		});
	});

	it('writes run output to a file when --out is provided', async () => {
		await fs.mkdir(tmpDir, { recursive: true });
		await execCli(['run', runtimeFixturePath, '--cycles', '2', '--dump', 'counter', '--out', runOutPath]);

		const raw = await fs.readFile(runOutPath, 'utf8');
		expect(JSON.parse(raw)).toEqual({
			counter: 2,
		});
	});

	it('loads raw file bytes directly into a target buffer', async () => {
		const { stdout } = await execCli([
			'run',
			runtimeFixturePath,
			'--load-file',
			'buffer=' + runtimeBytesPath,
			'--dump',
			'buffer',
		]);

		expect(JSON.parse(stdout)).toEqual({
			buffer: [1, 2, 3, -1],
		});
	});

	it('fails when run is called without any --dump', async () => {
		await expect(execCli(['run', runtimeFixturePath, '--cycles', '2'])).rejects.toThrow('Command failed');
	});
});
