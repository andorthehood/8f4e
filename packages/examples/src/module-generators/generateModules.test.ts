import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const sourceDirectory = fileURLToPath(new URL('../', import.meta.url));
let fixture: string;

function read(relativePath: string): string {
	return readFileSync(path.join(fixture, 'src', relativePath), 'utf8');
}

function write(relativePath: string, content: string): void {
	writeFileSync(path.join(fixture, 'src', relativePath), content);
}

function snapshot() {
	return Object.fromEntries(
		readdirSync(path.join(fixture, 'src/modules'), { recursive: true })
			.filter((file): file is string => typeof file === 'string' && file.endsWith('.8f4em'))
			.map(file => [
				file,
				{
					content: read(`modules/${file}`),
					modified: statSync(path.join(fixture, 'src/modules', file), { bigint: true }).mtimeNs,
				},
			])
	);
}

function run(args: string[] = []) {
	return spawnSync(process.execPath, ['src/module-generators/generateModules.ts', ...args], {
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
	it('regenerates the committed modules exactly without rewriting matching files', () => {
		const before = snapshot();
		for (const args of [[], [], ['--check']]) {
			const result = run(args);
			expect(result.status, result.stderr).toBe(0);
			expect(snapshot()).toEqual(before);
		}
	});

	it('detects a changed generator without writing, then updates its output during generation', () => {
		const before = snapshot();
		write(
			'module-generators/sineLookupTable.ts',
			read('module-generators/sineLookupTable.ts').replace('Math.sin(', '0.5 * Math.sin(')
		);
		const check = run(['--check']);
		expect(check.status).not.toBe(0);
		expect(check.stderr).toContain('Generated module does not match saved source: lookup-tables/sineLookupTable.8f4em');
		expect(snapshot()).toEqual(before);

		const result = run();
		expect(result.status, result.stderr).toBe(0);
		const after = snapshot();
		for (const file of Object.keys(before)) {
			if (file === 'lookup-tables/sineLookupTable.8f4em') {
				expect(after[file].content).not.toBe(before[file].content);
			} else {
				expect(after[file]).toEqual(before[file]);
			}
		}
	});

	it('recreates a missing table identically while check mode leaves it missing', () => {
		const modulePath = 'modules/lookup-tables/minBLEPLUT.8f4em';
		const before = read(modulePath);
		rmSync(path.join(fixture, 'src', modulePath));
		expect(run(['--check']).status).not.toBe(0);
		expect(() => read(modulePath)).toThrow();
		const result = run();
		expect(result.status, result.stderr).toBe(0);
		expect(read(modulePath)).toBe(before);
	});
});
