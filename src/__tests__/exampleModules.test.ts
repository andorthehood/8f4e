import { readdirSync, readFileSync } from 'fs';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import compile from '@8f4e/compiler';
import { WASM_MEMORY_PAGE_SIZE } from '@8f4e/compiler-wasm-utils';
import { parse8f4eProject, pickProjectCompilerBlocks } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function collectModulePaths(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const entryPath = resolve(directory, entry.name);

		if (entry.isDirectory()) {
			return collectModulePaths(entryPath);
		}

		return entry.name.endsWith('.8f4em') ? [entryPath] : [];
	});
}

const moduleRoot = resolve(__dirname, '../../packages/examples/src/modules');
const exampleModules = collectModulePaths(moduleRoot)
	.map(path => ({ path, source: readFileSync(path, 'utf-8') }))
	.sort((left, right) => left.path.localeCompare(right.path));
const modulesWithTests = exampleModules.filter(({ source }) =>
	source.split('\n').some(line => line.trim() === '#test')
);

describe('Example Module Files', () => {
	it.each(exampleModules.map(({ path, source }) => [basename(path, '.8f4em'), source] as const))(
		'parses %s as a versioned module document',
		(_name, source) => {
			expect(source.split('\n')[0]).toBe('8f4e/v1');
			expect(() => parse8f4eProject(source)).not.toThrow();
		}
	);

	it.each(modulesWithTests.map(({ path, source }) => [basename(path, '.8f4em'), source] as const))(
		'runs embedded tests in %s',
		async (_name, source) => {
			const project = parse8f4eProject(source);
			const { moduleBlocks, functionBlocks, macroBlocks } = pickProjectCompilerBlocks(project.codeBlocks);
			const result = compile(
				moduleBlocks,
				{
					startingMemoryWordAddress: 1,
					disableSharedMemory: true,
					includeTestRunner: true,
				},
				functionBlocks.length > 0 ? functionBlocks : undefined,
				macroBlocks.length > 0 ? macroBlocks : undefined
			);
			const failures: Array<{ assertIndex: number; expected: number; received: number }> = [];
			const memorySizePages = Math.max(1, Math.ceil(result.requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE));
			const memory = new WebAssembly.Memory({ initial: memorySizePages, maximum: memorySizePages });
			const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
				js: { memory },
				test: {
					assertFailed(assertIndex: number, expected: number, received: number) {
						failures.push({ assertIndex, expected, received });
					},
				},
			});

			(instance.exports.init as CallableFunction)();
			(instance.exports.runTests as CallableFunction)();

			expect(failures).toEqual([]);
		}
	);
});
