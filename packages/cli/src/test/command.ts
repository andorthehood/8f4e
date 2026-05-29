import { promises as fs } from 'fs';
import path from 'path';

import { compileProject } from '../compile/compileProject';
import parse8f4eToProject from '../shared/parse8f4e';

import type { ProjectInput } from '../shared/types';
import type { TestAssertionMetadata } from '@8f4e/compiler-spec';

const WASM_MEMORY_PAGE_SIZE = 65536;

interface TestCommandArgs {
	inputPath?: string;
}

interface AssertionFailure {
	assertIndex: number;
	expected: number;
	received: number;
}

type WebAssemblyMemoryLike = {
	buffer: ArrayBufferLike;
};

type WebAssemblyInstanceLike = {
	exports: Record<string, unknown>;
};

type WebAssemblyApiLike = {
	Memory: new (descriptor: { initial: number; maximum: number }) => WebAssemblyMemoryLike;
	instantiate: (
		bytes: Buffer,
		imports: { js: Record<string, WebAssemblyMemoryLike>; test: { assertFailed: CallableFunction } }
	) => Promise<{ instance: WebAssemblyInstanceLike }>;
};

function getWebAssemblyApi(): WebAssemblyApiLike {
	return (globalThis as unknown as { WebAssembly: WebAssemblyApiLike }).WebAssembly;
}

function parseTestArgs(args: string[]): TestCommandArgs {
	let inputPath: string | undefined;

	for (const arg of args) {
		if (!inputPath && !arg.startsWith('-')) {
			inputPath = arg;
			continue;
		}

		throw new Error(`Unknown test argument: ${arg}`);
	}

	return { inputPath };
}

function createWebAssemblyMemory(requiredMemoryBytes: number): WebAssemblyMemoryLike {
	const memorySizePages = Math.max(1, Math.ceil(requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE));
	return new (getWebAssemblyApi().Memory)({ initial: memorySizePages, maximum: memorySizePages });
}

function createMemoryImports(
	requiredMemoryBytes: number,
	requiredMemoryBytesByRegion: Record<string, number> = {}
): Record<string, WebAssemblyMemoryLike> {
	return {
		memory: createWebAssemblyMemory(requiredMemoryBytes),
		...Object.fromEntries(
			Object.entries(requiredMemoryBytesByRegion).map(([regionName, bytes]) => [
				regionName,
				createWebAssemblyMemory(bytes),
			])
		),
	};
}

function formatFailure(failure: AssertionFailure, metadata: TestAssertionMetadata | undefined): string {
	const location = metadata ? `${metadata.moduleId}:${metadata.lineNumber}` : `assert #${failure.assertIndex}`;

	return `${location} expected ${failure.expected}, received ${failure.received}`;
}

export function getTestUsage(): string {
	return 'Usage: cli test <input.8f4e|input.8f4em>';
}

export async function runTestCommand(args: string[]): Promise<void> {
	const { inputPath } = parseTestArgs(args);

	if (!inputPath) {
		throw new Error(getTestUsage());
	}

	const resolvedInput = path.resolve(process.cwd(), inputPath);
	const extension = path.extname(resolvedInput);
	if (extension !== '.8f4e' && extension !== '.8f4em') {
		throw new Error('Invalid input file: expected a .8f4e project file or .8f4em module file');
	}

	const inputRaw = await fs.readFile(resolvedInput, 'utf8');
	const project = parse8f4eToProject(inputRaw) as ProjectInput;
	const compileResult = compileProject(project, {
		compilerOptions: {
			disableSharedMemory: true,
			includeTestRunner: true,
		},
	});

	if (!compileResult.compiledWasm) {
		throw new Error('Unable to run tests: compilation did not produce runnable output');
	}

	const failures: AssertionFailure[] = [];
	const memoryImports = createMemoryImports(
		compileResult.requiredMemoryBytes ?? 0,
		compileResult.requiredMemoryBytesByRegion
	);
	const { instance } = await getWebAssemblyApi().instantiate(Buffer.from(compileResult.compiledWasm, 'base64'), {
		js: memoryImports,
		test: {
			assertFailed(assertIndex: number, expected: number, received: number) {
				failures.push({ assertIndex, expected, received });
			},
		},
	});

	(instance.exports.init as CallableFunction)();
	(instance.exports.runTests as CallableFunction)();

	const assertions = compileResult.testAssertions ?? [];
	if (failures.length > 0) {
		const metadataByIndex = new Map(assertions.map(assertion => [assertion.assertIndex, assertion]));
		throw new Error(
			[
				`${failures.length} assertion${failures.length === 1 ? '' : 's'} failed:`,
				...failures.map(failure => `  ${formatFailure(failure, metadataByIndex.get(failure.assertIndex))}`),
			].join('\n')
		);
	}

	process.stdout.write(`Ran ${assertions.length} assertion${assertions.length === 1 ? '' : 's'}.\n`);
}
