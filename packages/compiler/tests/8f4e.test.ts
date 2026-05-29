import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { describe, expect, test } from 'vitest';
import { WASM_MEMORY_PAGE_SIZE } from '@8f4e/compiler-wasm-utils';
import { parse8f4eProject, pickProjectCompilerBlocks } from '@8f4e/tokenizer';

import compile, { serializeDiagnostic } from '../src';

import type { ProjectCodeBlock, ProjectInput } from '@8f4e/tokenizer';

interface AssertionFailure {
	assertIndex: number;
	assertName: string;
	expected: number;
	received: number;
}

const testRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '8f4e');
const FLOAT_ASSERT_TOLERANCE = 0.001;
const assertFunctionBlock: ProjectCodeBlock = {
	code: ['function assert', '#import assert', 'param int received', 'param int expected', 'functionEnd'],
};
const assertFloatFunctionBlock: ProjectCodeBlock = {
	code: ['function assertf', '#import assertf', 'param float received', 'param float expected', 'functionEnd'],
};
const assertFloat64FunctionBlock: ProjectCodeBlock = {
	code: ['function assertf64', '#import assertf64', 'param float64 received', 'param float64 expected', 'functionEnd'],
};
const memoryRegionsDirective = /^;\s*@memoryRegions\s+(.+)$/;

function getTestMemoryRegions(source: string): string[] {
	return source
		.split('\n')
		.map(line => line.trim().match(memoryRegionsDirective)?.[1])
		.filter((regions): regions is string => regions !== undefined)
		.flatMap(regions => regions.split(/[\s,]+/).filter(Boolean));
}

function hasTestExportDeclaration(project: ProjectInput): boolean {
	return project.codeBlocks.some(block => {
		if (block.disabled) {
			return false;
		}
		if (block.executionEntryName === 'test') {
			return true;
		}

		const [openingLine, ...body] = block.code.map(line => line.trim());
		return openingLine === 'function test' && body.some(line => line === '#export' || line === '#export test');
	});
}

async function collect8f4eTestFiles(directory: string): Promise<string[]> {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const nestedFiles = await Promise.all(
		entries.map(entry => {
			const entryPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				return collect8f4eTestFiles(entryPath);
			}
			if (entry.isFile() && entry.name.endsWith('.test.8f4e')) {
				return [entryPath];
			}

			return [];
		})
	);

	return nestedFiles.flat().sort();
}

function createMemory(requiredMemoryBytes: number): WebAssembly.Memory {
	const memorySizePages = Math.max(1, Math.ceil(requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE));
	return new WebAssembly.Memory({ initial: memorySizePages, maximum: memorySizePages });
}

function createMemoryImports(
	requiredMemoryBytes: number,
	requiredMemoryBytesByRegion: Record<string, number> = {}
): Record<string, WebAssembly.Memory> {
	return {
		memory: createMemory(requiredMemoryBytes),
		...Object.fromEntries(
			Object.entries(requiredMemoryBytesByRegion).map(([regionName, bytes]) => [regionName, createMemory(bytes)])
		),
	};
}

function getExportedFunction(exports: WebAssembly.Exports, name: string, relativePath: string): CallableFunction {
	const exported = exports[name];
	if (typeof exported !== 'function') {
		throw new Error(`${relativePath}: expected compiled WebAssembly to export function "${name}"`);
	}
	return exported;
}

function formatFailure(failure: AssertionFailure): string {
	return `${failure.assertName} #${failure.assertIndex} expected ${failure.expected}, received ${failure.received}`;
}

function formatCompileError(relativePath: string, error: unknown): Error {
	const diagnostic = serializeDiagnostic(error);
	const line = diagnostic.line.instruction ? ` at ${diagnostic.line.instruction}` : '';
	const context = diagnostic.context.codeBlockId ? ` in ${diagnostic.context.codeBlockId}` : '';

	return new Error(`${relativePath}: ${diagnostic.message}${context}${line}`);
}

async function run8f4eTestFile(filePath: string): Promise<number> {
	const relativePath = path.relative(testRoot, filePath);
	const source = await fs.readFile(filePath, 'utf8');
	const project = parse8f4eProject(source);
	const memoryRegions = getTestMemoryRegions(source);

	if (!hasTestExportDeclaration(project)) {
		throw new Error(`${relativePath}: expected an entry test block or exported function test`);
	}

	const { entries, constantsBlocks, functionBlocks, macroBlocks } = pickProjectCompilerBlocks([
		...project.codeBlocks,
		assertFunctionBlock,
		assertFloatFunctionBlock,
		assertFloat64FunctionBlock,
	]);
	let compileResult: ReturnType<typeof compile>;
	try {
		compileResult = compile(
			{
				entries,
				constants: constantsBlocks,
				functions: functionBlocks,
				macros: macroBlocks,
			},
			{
				disableSharedMemory: true,
				memoryRegions,
			}
		);
	} catch (error) {
		throw formatCompileError(relativePath, error);
	}
	const failures: AssertionFailure[] = [];
	let assertionCount = 0;
	const { instance } = await WebAssembly.instantiate(compileResult.codeBuffer, {
		host: {
			...createMemoryImports(compileResult.requiredMemoryBytes, compileResult.requiredMemoryBytesByRegion),
			assert(received: number, expected: number) {
				const assertIndex = assertionCount;
				assertionCount += 1;

				if (received !== expected) {
					failures.push({ assertIndex, assertName: 'assert', expected, received });
				}
			},
			assertf(received: number, expected: number) {
				const assertIndex = assertionCount;
				assertionCount += 1;

				if (Math.abs(received - expected) > FLOAT_ASSERT_TOLERANCE) {
					failures.push({ assertIndex, assertName: 'assertf', expected, received });
				}
			},
			assertf64(received: number, expected: number) {
				const assertIndex = assertionCount;
				assertionCount += 1;

				if (Math.abs(received - expected) > FLOAT_ASSERT_TOLERANCE) {
					failures.push({ assertIndex, assertName: 'assertf64', expected, received });
				}
			},
		},
	});

	getExportedFunction(instance.exports, 'initDefaults', relativePath)();
	getExportedFunction(instance.exports, 'test', relativePath)();

	if (failures.length > 0) {
		throw new Error(
			[
				`${relativePath}: ${failures.length} assertion${failures.length === 1 ? '' : 's'} failed:`,
				...failures.map(failure => `  ${formatFailure(failure)}`),
			].join('\n')
		);
	}

	return assertionCount;
}

const testFiles = await collect8f4eTestFiles(testRoot);

describe('8f4e compiler fixtures', () => {
	test('has fixtures', () => {
		expect(testFiles.length).toBeGreaterThan(0);
	});

	test.each(testFiles.map(filePath => [path.relative(testRoot, filePath), filePath]))('%s', async (_name, filePath) => {
		await expect(run8f4eTestFile(filePath)).resolves.toBeGreaterThan(0);
	});
});
