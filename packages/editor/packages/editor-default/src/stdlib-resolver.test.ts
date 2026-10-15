import { readdir, readFile } from 'node:fs/promises';
import { sep } from 'node:path';
import sources from 'virtual:8f4e-sources/stdlib';
import { compileProject, parseProjectSource } from '@8f4e/compiler';
import { describe, expect, it } from 'vitest';
import { resolveStdlibInclude } from './stdlib-resolver';

describe('resolveStdlibInclude', () => {
	it('covers all stdlib source files and resolves their exact original text', async () => {
		const stdlibRoot = new URL('./', import.meta.resolve('@8f4e/stdlib/package.json'));
		const paths = (await readdir(new URL('std/', stdlibRoot), { recursive: true }))
			.filter(path => path.endsWith('.8f4e'))
			.map(path => `std/${path.split(sep).join('/')}`)
			.sort();
		expect([...sources.keys()].sort()).toEqual(paths.map(path => path.replace(/\.8f4e$/, '')));
		for (const path of paths) {
			const original = await readFile(new URL(import.meta.resolve(`@8f4e/stdlib/${path}`)), 'utf8');
			expect(await resolveStdlibInclude(path.replace(/\.8f4e$/, ''))).toBe(original);
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
