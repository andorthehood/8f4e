import { WASM_MEMORY_PAGE_SIZE } from '@8f4e/language-spec';
import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { compileProject, deriveEffectiveMemorySize, parseProjectSource } from '../src';
import { resolveStdlibInclude } from './stdlibResolver';

describe('large WebAssembly function indices', () => {
	it.each([127, 128, 255, 256])('invokes the correct export at function index %i', async functionIndex => {
		const functions = Array.from({ length: functionIndex - 1 }, (_, index) =>
			[
				`function f${index}`,
				index === functionIndex - 2 ? '#export selected' : '',
				`push ${index}`,
				'functionEnd int',
			].join('\n')
		);
		const result = await compileProject(parseProjectSource(`8f4e/v1\n${functions.join('\n\n')}`), {
			disableSharedMemory: true,
		});
		const selected = Object.values(result.compiledFunctions).find(func => func.exportName === 'selected')!;
		expect(selected.wasmIndex).toBe(functionIndex);

		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const { instance } = await WebAssembly.instantiate(new Uint8Array(result.codeBuffer), { host: { memory } });
		expect((instance.exports.selected as CallableFunction)()).toBe(functionIndex - 2);
	});

	it('instantiates functions whose type indices exceed 127 and 255', async () => {
		const functions = Array.from({ length: 256 }, (_, index) => {
			const parameters = Array.from({ length: 8 }, (_, bit) => `param ${index & (1 << bit) ? 'float' : 'int'} p${bit}`);
			return [`function f${index}`, ...parameters, `push ${index}`, 'functionEnd int'].join('\n');
		});
		const source = `8f4e/v1\n${functions.join('\n\n')}\n\nfunction selected\n#export\npush 1234\nfunctionEnd int`;
		const result = await compileProject(parseProjectSource(source), { disableSharedMemory: true });
		expect(Math.max(...Object.values(result.compiledFunctions).map(func => func.typeIndex))).toBeGreaterThan(255);

		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const { instance } = await WebAssembly.instantiate(new Uint8Array(result.codeBuffer), { host: { memory } });
		expect((instance.exports.selected as CallableFunction)()).toBe(1234);
	});

	it.each([6, 7, 8, 9, 16])('runs the audio buffer with %i copies of the Clouds reverb group', async groupCount => {
		const source = readFileSync(
			new URL('../../examples/src/projects/audio/MICloudsReverbGrouped.8f4e', import.meta.url),
			'utf8'
		);
		const project = parseProjectSource(source);
		const originalGroup = project.groups[0];
		project.groups = Array.from({ length: groupCount }, (_, index) => {
			const group = structuredClone(originalGroup);
			group.name = index === 0 ? 'reverb' : `reverb${index}`;
			group.code[0] = `group ${group.name}`;
			return group;
		});

		const result = await compileProject(project, {
			startingMemoryWordAddress: 0,
			resolveInclude: resolveStdlibInclude,
		});
		const pages = deriveEffectiveMemorySize(result.requiredMemoryBytes) / WASM_MEMORY_PAGE_SIZE;
		const memory = new WebAssembly.Memory({ initial: pages, maximum: pages, shared: true });
		const { instance } = await WebAssembly.instantiate(new Uint8Array(result.codeBuffer), { host: { memory } });
		(instance.exports.initDefaults as CallableFunction)();
		(instance.exports.buffer as CallableFunction)();

		const playerMemory = result.memoryPlan.modules.pcmPlayer.memory;
		expect(new Int32Array(memory.buffer)[playerMemory.playhead.wordAlignedAddress]).toBe(
			playerMemory.buffer.byteAddress + 128 * playerMemory.buffer.elementWordSize
		);
	});
});
