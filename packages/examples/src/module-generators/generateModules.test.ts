import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const sourceDirectory = fileURLToPath(new URL('../', import.meta.url));
const manifestFile = 'module-generators/generatedModules.json';
let fixture: string;

function read(relativePath: string): string {
	return readFileSync(path.join(fixture, 'src', relativePath), 'utf8');
}

function write(relativePath: string, content: string): void {
	writeFileSync(path.join(fixture, 'src', relativePath), content);
}

function manifest(): Record<string, { sourceHash: string; outputHash: string }> {
	return JSON.parse(read(manifestFile));
}

function snapshot() {
	return Object.fromEntries(
		[manifestFile, ...Object.keys(manifest()).map(file => `modules/${file}`)].map(file => [
			file,
			{ content: read(file), modified: statSync(path.join(fixture, 'src', file), { bigint: true }).mtimeNs },
		])
	);
}

function run(args: string[] = [], nodeArgs: string[] = []) {
	return spawnSync(process.execPath, [...nodeArgs, 'src/module-generators/generateModules.ts', ...args], {
		cwd: fixture,
		encoding: 'utf8',
	});
}

beforeEach(() => {
	fixture = mkdtempSync(path.join(tmpdir(), '8f4e-module-generation-'));
	for (const directory of ['modules', 'module-generators']) {
		cpSync(path.join(sourceDirectory, directory), path.join(fixture, 'src', directory), { recursive: true });
	}
	writeFileSync(path.join(fixture, 'package.json'), '{"type":"module"}');
});

afterEach(() => {
	rmSync(fixture, { recursive: true, force: true });
});

describe('module generation CLI', () => {
	it('preserves committed files without evaluating unchanged generators in a fresh checkout', () => {
		const before = snapshot();
		writeFileSync(
			path.join(fixture, 'reject-generation.mjs'),
			'Math.sin = () => { throw new Error("Generator must not run"); };'
		);
		for (const args of [[], ['--check']]) {
			const result = run(args, ['--import', './reject-generation.mjs']);
			expect(result.status, result.stderr).toBe(0);
		}
		expect(snapshot()).toEqual(before);
	});

	it('preserves matching files when a checkout uses CRLF line endings', () => {
		const files = [
			manifestFile,
			...Object.keys(manifest()).map(file => `modules/${file}`),
			...readdirSync(path.join(fixture, 'src/module-generators'))
				.filter(file => file.endsWith('.ts'))
				.map(file => `module-generators/${file}`),
		];
		for (const file of files) {
			write(file, read(file).replace(/\r?\n/g, '\r\n'));
		}
		const before = snapshot();
		for (const args of [[], ['--check']]) {
			const result = run(args);
			expect(result.status, result.stderr).toBe(0);
		}
		expect(snapshot()).toEqual(before);
	});

	it('regenerates only the module whose generator source changed', () => {
		const before = snapshot();
		const beforeManifest = manifest();
		write(
			'module-generators/sineLookupTable.ts',
			read('module-generators/sineLookupTable.ts').replace('Math.sin(', '0.5 * Math.sin(')
		);

		const check = run(['--check']);
		expect(check.status).not.toBe(0);
		expect(check.stderr).toContain('source fingerprint is out of date: lookup-tables/sineLookupTable.8f4em');
		expect(snapshot()).toEqual(before);

		const result = run();
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain('Regenerated 1 module files');
		const after = snapshot();
		const afterManifest = manifest();
		const changedFile = 'lookup-tables/sineLookupTable.8f4em';
		expect(after[`modules/${changedFile}`].content).not.toBe(before[`modules/${changedFile}`].content);
		expect(afterManifest[changedFile]).not.toEqual(beforeManifest[changedFile]);
		for (const file of Object.keys(beforeManifest).filter(file => file !== changedFile)) {
			expect(after[`modules/${file}`]).toEqual(before[`modules/${file}`]);
			expect(afterManifest[file]).toEqual(beforeManifest[file]);
		}
		expect(run(['--check']).status).toBe(0);
		expect(run().status).toBe(0);
		expect(snapshot()).toEqual(after);
	});

	it('invalidates every source fingerprint when the shared writer changes', () => {
		const beforeManifest = manifest();
		write(
			'module-generators/generateModules.ts',
			`${read('module-generators/generateModules.ts')}\n// Writer changed.\n`
		);
		expect(run(['--check']).status).not.toBe(0);
		const result = run();
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain('Regenerated 5 module files');
		for (const [file, saved] of Object.entries(manifest())) {
			expect(saved.sourceHash).not.toBe(beforeManifest[file].sourceHash);
		}
	});

	it('recreates a missing module while check mode leaves it missing', () => {
		const modulePath = 'modules/lookup-tables/minBLEPLUT.8f4em';
		const before = read(modulePath);
		rmSync(path.join(fixture, 'src', modulePath));
		expect(run(['--check']).status).not.toBe(0);
		expect(() => read(modulePath)).toThrow();
		const result = run();
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain('Regenerated 1 module files');
		// The regenerated full-precision values may differ across environments; the new fingerprint must verify them.
		expect(read(modulePath)).toContain('float\t');
		expect(read(modulePath).split('\n').length).toBe(before.split('\n').length);
		expect(run(['--check']).status).toBe(0);
	});

	it('detects manual output edits without evaluating generators or overwriting the file', () => {
		const modulePath = 'modules/lookup-tables/minBLEPLUT.8f4em';
		write(modulePath, `${read(modulePath)}\n; Local edit\n`);
		const before = snapshot();
		for (const args of [[], ['--check']]) {
			const result = run(args);
			expect(result.status).not.toBe(0);
			expect(result.stderr).toContain('Generated module was edited without changing its generator');
			expect(snapshot()).toEqual(before);
		}
	});

	it('bootstraps missing fingerprints only in generation mode', () => {
		rmSync(path.join(fixture, 'src', manifestFile));
		expect(run(['--check']).status).not.toBe(0);
		expect(() => read(manifestFile)).toThrow();
		const result = run();
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain('Regenerated 5 module files');
		expect(Object.keys(manifest())).toHaveLength(5);
		expect(run(['--check']).status).toBe(0);
	});
});
