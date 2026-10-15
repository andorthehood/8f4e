import { readFile } from 'node:fs/promises';
import sources from 'virtual:8f4e-sources/stdlib';
import { compileProject, parseProjectSource } from '@8f4e/compiler';
import stdlibManifest from '@8f4e/stdlib/manifest.json';
import { describe, expect, it } from 'vitest';
import { resolveStdlibInclude } from './stdlib-resolver';

describe('resolveStdlibInclude', () => {
	it('covers the manifest and resolves the exact original source text', async () => {
		expect([...sources.keys()].sort()).toEqual(stdlibManifest.includes.map(include => include.id).sort());
		for (const include of stdlibManifest.includes) {
			const original = await readFile(new URL(import.meta.resolve(`@8f4e/stdlib/${include.path}`)), 'utf8');
			expect(await resolveStdlibInclude(include.id)).toBe(original);
		}
	});

	it('compiles and executes a project using a real standard-library include', async () => {
		const project = parseProjectSource(
			[
				'8f4e/v1',
				'includes',
				'include std/math/fract',
				'includesEnd',
				'entry main',
				'module consumer',
				'float result',
				'push &result',
				'push 3.25',
				'call fract',
				'store',
				'moduleEnd',
				'entryEnd',
			].join('\n')
		);
		const result = await compileProject(project, {
			disableSharedMemory: true,
			resolveInclude: resolveStdlibInclude,
		});
		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const { instance } = await WebAssembly.instantiate(result.codeBuffer, { host: { memory } });

		(instance.exports.main as () => void)();

		const resultAddress = result.memoryPlan.modules.consumer!.memory.result!.byteAddress;
		expect(new DataView(memory.buffer).getFloat32(resultAddress, true)).toBe(0.25);
	});

	it.each(['std/unknown', 'toString', '__proto__'])('returns undefined for unknown include %s', async id => {
		expect(await resolveStdlibInclude(id)).toBeUndefined();
	});
});
