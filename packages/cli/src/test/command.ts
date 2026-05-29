import { promises as fs } from 'fs';
import path from 'path';

import { compileProject } from '../compile/compileProject';
import parse8f4eToProject from '../shared/parse8f4e';

import type { ProjectInput } from '../shared/types';
import type { AssertionMetadata, CompiledModuleLookup } from '@8f4e/compiler-spec';

const WASM_MEMORY_PAGE_SIZE = 65536;

interface TestCommandArgs {
	inputSpecs: string[];
}

interface AssertionFailure {
	assertIndex: number;
	expected: number;
	received: number;
}

interface TestFileResult {
	assertions: number;
	skipped: boolean;
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
	const inputSpecs: string[] = [];

	for (const arg of args) {
		if (!arg.startsWith('-')) {
			inputSpecs.push(arg);
			continue;
		}

		throw new Error(`Unknown test argument: ${arg}`);
	}

	return { inputSpecs };
}

function hasGlobSyntax(value: string): boolean {
	return /[*?]/.test(value);
}

function toPosixPath(value: string): string {
	return value.split(path.sep).join('/');
}

function escapeRegExp(value: string): string {
	return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegExp(pattern: string): RegExp {
	let source = '^';

	for (let i = 0; i < pattern.length; i += 1) {
		const character = pattern[i];
		const nextCharacter = pattern[i + 1];
		const followingCharacter = pattern[i + 2];

		if (character === '*' && nextCharacter === '*' && followingCharacter === '/') {
			source += '(?:.*/)?';
			i += 2;
			continue;
		}
		if (character === '*' && nextCharacter === '*') {
			source += '.*';
			i += 1;
			continue;
		}
		if (character === '*') {
			source += '[^/]*';
			continue;
		}
		if (character === '?') {
			source += '[^/]';
			continue;
		}

		source += escapeRegExp(character);
	}

	source += '$';

	return new RegExp(source);
}

function getGlobSearchRoot(pattern: string): string {
	const normalizedPattern = toPosixPath(pattern);
	const parsed = path.parse(normalizedPattern);
	const root = toPosixPath(parsed.root);
	const relativePattern = normalizedPattern.slice(root.length);
	const segments = relativePattern.split('/');
	const firstGlobSegmentIndex = segments.findIndex(hasGlobSyntax);
	const rootSegments = firstGlobSegmentIndex === -1 ? segments.slice(0, -1) : segments.slice(0, firstGlobSegmentIndex);

	return rootSegments.length > 0 ? path.join(root, ...rootSegments) : parsed.root;
}

async function collectFiles(directory: string): Promise<string[]> {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(entry => {
			const entryPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				return collectFiles(entryPath);
			}
			if (entry.isFile()) {
				return [entryPath];
			}

			return [];
		})
	);

	return files.flat();
}

async function expandInputSpec(inputSpec: string): Promise<string[]> {
	const resolvedInput = path.resolve(process.cwd(), inputSpec);

	if (!hasGlobSyntax(inputSpec)) {
		return [resolvedInput];
	}

	const searchRoot = getGlobSearchRoot(resolvedInput);
	const matcher = globToRegExp(toPosixPath(resolvedInput));
	const files = await collectFiles(searchRoot);

	return files.filter(file => matcher.test(toPosixPath(file)));
}

async function resolveInputPaths(inputSpecs: string[]): Promise<string[]> {
	const expandedPaths = (await Promise.all(inputSpecs.map(expandInputSpec))).flat();
	const uniquePaths = Array.from(new Set(expandedPaths)).sort();

	if (uniquePaths.length === 0) {
		throw new Error('No input files matched.');
	}

	for (const inputPath of uniquePaths) {
		const extension = path.extname(inputPath);
		if (extension !== '.8f4e' && extension !== '.8f4em') {
			throw new Error('Invalid input file: expected a .8f4e project file or .8f4em module file');
		}
	}

	return uniquePaths;
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

function formatFailure(failure: AssertionFailure, metadata: AssertionMetadata | undefined): string {
	const location = metadata ? `${metadata.moduleId}:${metadata.lineNumber}` : `assert #${failure.assertIndex}`;

	return `${location} expected ${failure.expected}, received ${failure.received}`;
}

function hasTestGroup(project: ProjectInput): boolean {
	return project.codeBlocks.some(block => !block.disabled && block.executionGroupName === 'test');
}

function filterGroupAssertions(
	assertions: AssertionMetadata[],
	compiledModules: CompiledModuleLookup | undefined,
	groupName: string
): AssertionMetadata[] {
	return assertions.filter(assertion => compiledModules?.[assertion.moduleId]?.executionGroupName === groupName);
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
		return error.message;
	}
	return String(error);
}

export function getTestUsage(): string {
	return 'Usage: cli test <input.8f4e|input.8f4em|glob>...';
}

async function runTestFile(inputPath: string): Promise<TestFileResult> {
	const inputRaw = await fs.readFile(inputPath, 'utf8');
	const project = parse8f4eToProject(inputRaw) as ProjectInput;
	if (!hasTestGroup(project)) {
		return { assertions: 0, skipped: true };
	}

	const compileResult = compileProject(project, {
		compilerOptions: {
			disableSharedMemory: true,
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

	(instance.exports.initDefaults as CallableFunction)();
	(instance.exports.test as CallableFunction)();

	const assertions = filterGroupAssertions(compileResult.assertions ?? [], compileResult.compiledModules, 'test');
	if (failures.length > 0) {
		const metadataByIndex = new Map(
			(compileResult.assertions ?? []).map(assertion => [assertion.assertIndex, assertion])
		);
		throw new Error(
			[
				`${failures.length} assertion${failures.length === 1 ? '' : 's'} failed:`,
				...failures.map(failure => `  ${formatFailure(failure, metadataByIndex.get(failure.assertIndex))}`),
			].join('\n')
		);
	}

	return { assertions: assertions.length, skipped: false };
}

export async function runTestCommand(args: string[]): Promise<void> {
	const { inputSpecs } = parseTestArgs(args);

	if (inputSpecs.length === 0) {
		throw new Error(getTestUsage());
	}

	const inputPaths = await resolveInputPaths(inputSpecs);
	let executedFiles = 0;
	let assertionCount = 0;

	for (const inputPath of inputPaths) {
		try {
			const result = await runTestFile(inputPath);
			if (!result.skipped) {
				executedFiles += 1;
				assertionCount += result.assertions;
			}
		} catch (error) {
			const relativePath = path.relative(process.cwd(), inputPath);
			const message = getErrorMessage(error);
			throw new Error(`${relativePath}\n${message}`);
		}
	}

	if (executedFiles === 0) {
		process.stdout.write('No tests found.\n');
		return;
	}

	const assertionLabel = `assertion${assertionCount === 1 ? '' : 's'}`;
	if (inputPaths.length === 1) {
		process.stdout.write(`Ran ${assertionCount} ${assertionLabel}.\n`);
		return;
	}

	process.stdout.write(
		`Ran ${assertionCount} ${assertionLabel} in ${executedFiles} file${executedFiles === 1 ? '' : 's'}.\n`
	);
}
