import { resolveIncludeSourceTreeAsync } from '@8f4e/include-resolver';
import type {
	AST,
	CompiledFunction,
	CompileResult,
	CompilerASTLine,
	MemoryDefault,
	MemoryDefaultValue,
	MemoryPointerMetadata,
	PlannedMemoryDeclaration,
	PlannedMemoryModule,
} from '@8f4e/language-spec';
import { POINTER_FUNCTION_TYPE_IDENTIFIERS, WASM_MEMORY_PAGE_SIZE } from '@8f4e/language-spec';
import {
	type ProjectBlock,
	type ProjectDocument,
	parseProjectSource,
	prepareCompilerInputFromProjectSourceTreeAsync,
} from '@8f4e/project-preparser';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import compile, { serializeDiagnostic } from '../src';
import { resolveStdlibInclude } from './stdlibResolver';

interface AssertionFailure {
	assertIndex: number;
	assertName: string;
	expected: number;
	received: number;
}

export interface FixtureCompileSnapshots {
	overview: Record<string, unknown>;
	moduleMemory: Record<string, unknown>;
	moduleAst: Record<string, unknown>;
	functionOverview: Record<string, unknown>;
	functionAst: Record<string, unknown>;
}

export interface CompiledFixtureProgram {
	compileResult: CompileResult;
	source: string;
	project: ProjectDocument;
}

export interface InstantiatedFixtureProgram extends CompiledFixtureProgram {
	instance: WebAssembly.Instance;
	host: Record<string, WebAssembly.Memory | CallableFunction>;
}

export interface FixtureProgramCompileOptions {
	extraCodeBlocks?: ProjectBlock[];
	includeAssertions?: boolean;
	includeStackAnalysis?: boolean;
	cache?: CompileResult['cache'];
}

export interface FixtureProgramInstantiateOptions extends FixtureProgramCompileOptions {
	hostImports?: Record<string, CallableFunction>;
}

export interface FixtureProgramRunResult extends InstantiatedFixtureProgram {
	assertionCount: number;
	compileSnapshots: FixtureCompileSnapshots;
}

export const testRoot = path.dirname(fileURLToPath(import.meta.url));

const FLOAT_ASSERT_TOLERANCE = 0.001;
const assertFunctionBlocks: ProjectBlock[] = [
	{
		id: -1,
		code: ['function assert', '#import assert', 'param int received', 'param int expected', 'functionEnd'],
	},
	{
		id: -2,
		code: ['function assert', '#import assert', 'param float received', 'param float expected', 'functionEnd'],
	},
	{
		id: -3,
		code: ['function assert', '#import assert', 'param float64 received', 'param float64 expected', 'functionEnd'],
	},
	...POINTER_FUNCTION_TYPE_IDENTIFIERS.map((type, index) => ({
		id: -4 - index,
		code: ['function assert', '#import assert', `param ${type} received`, `param ${type} expected`, 'functionEnd'],
	})),
];
const injectedAssertionFunctionNames = new Set(['assert']);
const memoryRegionsDirective = /^;\s*@memoryRegions\s+(.+)$/;

export function getTestMemoryRegions(source: string): string[] {
	return source
		.split('\n')
		.map(line => line.trim().match(memoryRegionsDirective)?.[1])
		.filter((regions): regions is string => regions !== undefined)
		.flatMap(regions => regions.split(/[\s,]+/).filter(Boolean));
}

export function hasTestExportDeclaration(project: ProjectDocument): boolean {
	return project.codeBlocks.some(block => {
		if (block.disabled) {
			return false;
		}
		if (block.entry === 'test') {
			return true;
		}

		const [openingLine, ...body] = block.code.map(line => line.trim());
		return openingLine === 'function test' && body.some(line => line === '#export' || line === '#export test');
	});
}

export async function collectFixtureProgramFiles(directory = testRoot): Promise<string[]> {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const nestedFiles = await Promise.all(
		entries.map(entry => {
			const entryPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				return collectFixtureProgramFiles(entryPath);
			}
			if (entry.isFile() && entry.name.endsWith('.test.8f4e')) {
				return [entryPath];
			}

			return [];
		})
	);

	return nestedFiles.flat().sort();
}

export function createMemory(requiredMemoryBytes: number): WebAssembly.Memory {
	const memorySizePages = Math.max(1, Math.ceil(requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE));
	return new WebAssembly.Memory({ initial: memorySizePages, maximum: memorySizePages });
}

export function createMemoryImports(
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

export function getExportedFunction(
	exports: WebAssembly.Exports,
	name: string,
	relativePath = 'fixture'
): CallableFunction {
	const exported = exports[name];
	if (typeof exported !== 'function') {
		throw new Error(`${relativePath}: expected compiled WebAssembly to export function "${name}"`);
	}
	return exported;
}

export function formatCompileError(relativePath: string, error: unknown): Error {
	const diagnostic = serializeDiagnostic(error);
	const line = diagnostic.line.instruction ? ` at ${diagnostic.line.instruction}` : '';
	const context = diagnostic.context.codeBlockId ? ` in ${diagnostic.context.codeBlockId}` : '';

	return new Error(`${relativePath}: ${diagnostic.message}${context}${line}`);
}

function formatFailure(failure: AssertionFailure): string {
	return `${failure.assertName} #${failure.assertIndex} expected ${failure.expected}, received ${failure.received}`;
}

function sortRecord<T, Result>(
	record: Record<string, T> | undefined,
	mapValue: (value: T, key: string) => Result
): Record<string, Result> {
	return Object.fromEntries(
		Object.entries(record ?? {})
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, value]) => [key, mapValue(value, key)])
	);
}

function serializeDefaultValue(value: MemoryDefaultValue): MemoryDefaultValue {
	if (value === null || typeof value !== 'object') {
		return value;
	}

	return sortRecord(value, item => item);
}

function serializeMemoryData(
	data: PlannedMemoryDeclaration,
	memoryDefault: MemoryDefault | undefined,
	pointerMetadata: MemoryPointerMetadata | undefined
): Record<string, unknown> {
	return {
		id: data.id,
		type: data.type,
		numberOfElements: data.numberOfElements,
		elementWordSize: data.elementWordSize,
		wordAlignedSize: data.wordAlignedSize,
		byteAddress: data.byteAddress,
		wordAlignedAddress: data.wordAlignedAddress,
		memoryIndex: data.memoryIndex,
		...(data.memoryRegionName ? { memoryRegionName: data.memoryRegionName } : {}),
		default: serializeDefaultValue(memoryDefault?.value ?? 0),
		...(memoryDefault?.hasExplicitDefault ? { hasExplicitDefault: true } : {}),
		...(memoryDefault?.isInherited ? { isInherited: true } : {}),
		isInteger: data.isInteger,
		...(data.isFloat64 ? { isFloat64: true } : {}),
		...(data.pointeeBaseType ? { pointeeBaseType: data.pointeeBaseType } : {}),
		...(pointerMetadata?.pointeeMemoryIndex !== undefined
			? { pointeeMemoryIndex: pointerMetadata.pointeeMemoryIndex }
			: {}),
		...(pointerMetadata?.pointeeMemoryRegionName
			? { pointeeMemoryRegionName: pointerMetadata.pointeeMemoryRegionName }
			: {}),
		...(pointerMetadata?.pointeeElementCount !== undefined
			? { pointeeElementCount: pointerMetadata.pointeeElementCount }
			: {}),
		pointerDepth: data.pointerDepth,
		isUnsigned: data.isUnsigned,
	};
}

function serializeAstLine(line: CompilerASTLine): Record<string, unknown> {
	const lineSnapshot: Record<string, unknown> = { ...line };

	delete lineSnapshot.lineNumber;
	delete lineSnapshot.ifBlock;
	delete lineSnapshot.ifEndBlock;
	delete lineSnapshot.blockBlock;
	delete lineSnapshot.blockEndBlock;

	return lineSnapshot;
}

function serializeAst(ast: AST | undefined): Record<string, unknown> | undefined {
	if (!ast) {
		return undefined;
	}

	const sharedAst = {
		type: ast.type,
		lines: ast.lines.map(serializeAstLine),
	};

	if (ast.type === 'function') {
		return {
			...sharedAst,
			name: ast.name,
		};
	}

	return {
		...sharedAst,
		id: ast.id,
	};
}

function serializeCompiledModuleOverview(
	module: CompileResult['compiledModules'][string],
	plannedModule: PlannedMemoryModule
): Record<string, unknown> {
	return {
		id: module.id,
		index: module.index,
		...(module.executionEntryName ? { executionEntryName: module.executionEntryName } : {}),
		memoryIndex: plannedModule.memoryIndex,
		...(plannedModule.memoryRegionName ? { memoryRegionName: plannedModule.memoryRegionName } : {}),
		byteAddress: plannedModule.byteAddress,
		wordAlignedAddress: plannedModule.byteAddress / 4,
		wordAlignedSize: plannedModule.wordAlignedSize,
		...(module.skipExecutionInCycle ? { skipExecutionInCycle: true } : {}),
	};
}

function serializeCompiledModuleMemory(
	result: CompileResult,
	plannedModule: PlannedMemoryModule
): Record<string, unknown> {
	const memoryDefaults = result.memoryDefaultsByModuleId[plannedModule.id]!;
	const pointerMetadata = result.pointerMetadataByModuleId[plannedModule.id]!;
	return {
		memory: sortRecord(plannedModule.memory, (data, id) =>
			serializeMemoryData(data, memoryDefaults[id], pointerMetadata[id])
		),
	};
}

function serializeCompiledFunctionOverview(func: CompiledFunction): Record<string, unknown> {
	return {
		id: func.id,
		signature: func.signature,
		...(func.import ? { import: func.import } : {}),
		...(func.exportName ? { exportName: func.exportName } : {}),
		...(func.paramShapeExpansions ? { paramShapeExpansions: func.paramShapeExpansions } : {}),
	};
}

function getFixtureCompiledFunctions(result: CompileResult): Array<[string, CompiledFunction]> {
	return Object.entries(result.compiledFunctions ?? {})
		.filter(([, func]) => !injectedAssertionFunctionNames.has(func.name))
		.sort(([left], [right]) => left.localeCompare(right));
}

export function serializeCompileResult(result: CompileResult): FixtureCompileSnapshots {
	const fixtureFunctions = getFixtureCompiledFunctions(result);
	const moduleEntries = Object.entries(result.compiledModules).sort(([left], [right]) => left.localeCompare(right));

	const moduleOverview = Object.fromEntries(
		moduleEntries.map(([id, module]) => [id, serializeCompiledModuleOverview(module, result.memoryPlan.modules[id]!)])
	);
	const moduleMemory = Object.fromEntries(
		moduleEntries.map(([id]) => [id, serializeCompiledModuleMemory(result, result.memoryPlan.modules[id]!)])
	);
	const moduleAst = Object.fromEntries(moduleEntries.map(([id, module]) => [id, serializeAst(module.ast)]));
	const functionOverview = Object.fromEntries(
		fixtureFunctions.map(([id, func]) => [id, serializeCompiledFunctionOverview(func)])
	);
	const functionAst = Object.fromEntries(fixtureFunctions.map(([id, func]) => [id, serializeAst(func.ast)]));

	return {
		overview: {
			requiredMemoryBytes: result.requiredMemoryBytes,
			requiredMemoryBytesByRegion: sortRecord(result.requiredMemoryBytesByRegion, bytes => bytes),
			compiledModules: Object.keys(moduleOverview),
			compiledFunctions: Object.keys(functionOverview),
		},
		moduleMemory,
		moduleAst,
		functionOverview,
		functionAst,
	};
}

export function getCompileSnapshotPath(filePath: string): string {
	const relativePath = path.relative(testRoot, filePath);

	return path.join(testRoot, '__snapshots__', `${relativePath}.compile-result.snap`);
}

export async function compileFixtureProgramSource(
	source: string,
	options: FixtureProgramCompileOptions = {}
): Promise<CompiledFixtureProgram> {
	const normalizedSource = source.trimStart();
	const project = parseProjectSource(normalizedSource);
	const memoryRegions = getTestMemoryRegions(normalizedSource);
	const sourceTree = await resolveIncludeSourceTreeAsync(normalizedSource, resolveStdlibInclude);
	const extraBlocks = [...(options.extraCodeBlocks ?? []), ...(options.includeAssertions ? assertFunctionBlocks : [])];
	const compilerInput = await prepareCompilerInputFromProjectSourceTreeAsync(sourceTree, { extraBlocks });

	return {
		source: normalizedSource,
		project,
		compileResult: compile(
			compilerInput,
			{
				disableSharedMemory: true,
				includeStackAnalysis: options.includeStackAnalysis,
				memoryRegions,
			},
			options.cache
		),
	};
}

export async function instantiateFixtureProgramSource(
	source: string,
	options: FixtureProgramInstantiateOptions = {}
): Promise<InstantiatedFixtureProgram> {
	const compiledFixture = await compileFixtureProgramSource(source, options);
	const host = {
		...createMemoryImports(
			compiledFixture.compileResult.requiredMemoryBytes,
			compiledFixture.compileResult.requiredMemoryBytesByRegion
		),
		...options.hostImports,
	};
	const { instance } = await WebAssembly.instantiate(compiledFixture.compileResult.codeBuffer, { host });

	return {
		...compiledFixture,
		host,
		instance,
	};
}

export async function runFixtureProgramFile(filePath: string): Promise<FixtureProgramRunResult> {
	const relativePath = path.relative(testRoot, filePath);
	const source = await fs.readFile(filePath, 'utf8');
	const project = parseProjectSource(source);

	if (!hasTestExportDeclaration(project)) {
		throw new Error(`${relativePath}: expected an entry test block or exported function test`);
	}

	const failures: AssertionFailure[] = [];
	let assertionCount = 0;
	let instantiatedFixture: InstantiatedFixtureProgram;
	try {
		instantiatedFixture = await instantiateFixtureProgramSource(source, {
			includeAssertions: true,
			hostImports: {
				assert(received: number, expected: number) {
					const assertIndex = assertionCount;
					assertionCount += 1;

					if (Math.abs(received - expected) > FLOAT_ASSERT_TOLERANCE) {
						failures.push({ assertIndex, assertName: 'assert', expected, received });
					}
				},
			},
		});
	} catch (error) {
		throw formatCompileError(relativePath, error);
	}
	const compileSnapshots = serializeCompileResult(instantiatedFixture.compileResult);

	compileSnapshots.overview.wasmExports = Object.keys(instantiatedFixture.instance.exports).sort();

	getExportedFunction(instantiatedFixture.instance.exports, 'initDefaults', relativePath)();
	getExportedFunction(instantiatedFixture.instance.exports, 'test', relativePath)();

	if (failures.length > 0) {
		throw new Error(
			[
				`${relativePath}: ${failures.length} assertion${failures.length === 1 ? '' : 's'} failed:`,
				...failures.map(failure => `  ${formatFailure(failure)}`),
			].join('\n')
		);
	}

	return {
		...instantiatedFixture,
		assertionCount,
		compileSnapshots,
	};
}
