import { WASM_IF, WASM_MEMORY_SIZE } from '@8f4e/compiler-wasm-utils';
import type {
	AnalyzedLine,
	CompilationContext,
	CompilerASTLine,
	InstructionCompiler,
	MemoryDefaultValue,
	MemoryPointerMetadata,
	MemoryPointerMetadataMap,
	PlannedMemoryDeclaration,
} from '@8f4e/language-spec';
import { BlockType } from '@8f4e/language-spec';
import { analyzeInstruction } from '@8f4e/stack-analyzer/testing';
import { expect } from 'vitest';
import { createCompilationContext } from '../semantic/createCompilationContext';

export type MemoryFixture = PlannedMemoryDeclaration &
	MemoryPointerMetadata & {
		default?: MemoryDefaultValue;
		hasExplicitDefault?: boolean;
		isInherited?: boolean;
	};

type MemoryFixtureMap = Record<string, MemoryFixture>;

/**
 * Creates a compilation context fixture for instruction compiler tests.
 *
 * @param overrides - Context fields to override on the generated fixture.
 * @returns A compilation context with default module-scoped state.
 */
export default function createInstructionCompilerTestContext(
	overrides: Partial<CompilationContext> = {}
): CompilationContext {
	return createCompilationContext({
		...overrides,
		namespace: {
			moduleName: 'test',
			...overrides.namespace,
		},
		blockStack: overrides.blockStack ?? [
			{
				blockType: BlockType.MODULE,
				expectedResultTypes: [],
			},
		],
		codeBlockId: overrides.codeBlockId ?? 'test',
		codeBlockType: overrides.codeBlockType ?? 'module',
	});
}

/** Seeds compiler memory-plan context fields from planned memory declaration fixtures. */
export function seedTestMemoryDeclarations(
	context: CompilationContext,
	memoryDeclarations: MemoryFixtureMap
): CompilationContext {
	const memory = Object.fromEntries(
		Object.entries(memoryDeclarations).map(([id, memoryItem]) => {
			const {
				default: _default,
				hasExplicitDefault: _hasExplicitDefault,
				isInherited: _isInherited,
				pointeeMemoryIndex: _pointeeMemoryIndex,
				pointeeMemoryRegionName: _pointeeMemoryRegionName,
				pointeeElementCount: _pointeeElementCount,
				...declaration
			} = memoryItem;
			return [id, declaration as PlannedMemoryDeclaration];
		})
	);
	const pointerMetadata = Object.fromEntries(
		Object.entries(memoryDeclarations)
			.filter(([, memoryItem]) => memoryItem.pointeeBaseType)
			.map(([id, memoryItem]) => [
				id,
				{
					...(memoryItem.pointeeMemoryIndex !== undefined ? { pointeeMemoryIndex: memoryItem.pointeeMemoryIndex } : {}),
					...(memoryItem.pointeeMemoryRegionName
						? { pointeeMemoryRegionName: memoryItem.pointeeMemoryRegionName }
						: {}),
					...(memoryItem.pointeeElementCount !== undefined
						? { pointeeElementCount: memoryItem.pointeeElementCount }
						: {}),
				},
			])
	) as MemoryPointerMetadataMap;
	const declarations = Object.values(memory);
	const wordAlignedSize = declarations.reduce(
		(max, declaration) => Math.max(max, declaration.wordAlignedAddress + declaration.wordAlignedSize),
		0
	);
	const module = {
		id: context.namespace.moduleName ?? 'test',
		lineNumber: 0,
		byteAddress: 0,
		wordAlignedSize,
		memory,
		declarations,
		declarationSources: [],
		memoryIndex: context.currentMemoryIndex,
		...(context.currentMemoryRegionName ? { memoryRegionName: context.currentMemoryRegionName } : {}),
	};

	context.memoryPlan = {
		modules: { [module.id]: module },
		moduleList: [module],
		nextByteAddressByMemoryIndex: {},
	};
	context.currentPlannedModule = module;
	context.memoryDefaults = Object.fromEntries(
		Object.entries(memoryDeclarations).map(([id, memoryItem]) => [
			id,
			{
				value: memoryItem.default ?? 0,
				hasExplicitDefault: memoryItem.hasExplicitDefault === true,
				isInherited: memoryItem.isInherited ?? false,
			},
		])
	);
	context.pointerMetadata = pointerMetadata;

	return context;
}

/**
 * Runs stack analysis for a line and immediately compiles it with the provided compiler.
 *
 * @param compileInstruction - Instruction compiler under test.
 * @param line - Source AST line to analyze and compile.
 * @param context - Compilation context mutated by analysis and compilation.
 * @returns The updated compilation context.
 */
export function analyzeAndCompileInstruction<TLine extends CompilerASTLine>(
	compileInstruction: InstructionCompiler<TLine>,
	line: TLine,
	context: CompilationContext
): CompilationContext {
	compileInstruction(analyzeInstruction(line, context) as AnalyzedLine<TLine>, context);
	return context;
}

/**
 * Counts occurrences of one bytecode sequence inside another.
 *
 * @param haystack - Bytecode sequence to search.
 * @param needle - Bytecode subsequence to count.
 * @returns The number of matching subsequences.
 */
export function countByteCodeSequence(haystack: number[], needle: number[]): number {
	let count = 0;
	for (let i = 0; i <= haystack.length - needle.length; i++) {
		if (needle.every((value, index) => haystack[i + index] === value)) {
			count++;
		}
	}
	return count;
}

/**
 * Checks whether one bytecode sequence contains another.
 *
 * @param haystack - Bytecode sequence to search.
 * @param needle - Bytecode subsequence to find.
 * @returns True when the subsequence occurs at least once.
 */
export function containsByteCodeSequence(haystack: number[], needle: number[]): boolean {
	return countByteCodeSequence(haystack, needle) > 0;
}

/**
 * Asserts the bytecode shape emitted for guarded memory dereferences.
 *
 * @param byteCode - Compiled bytecode to inspect.
 * @param options - Expected prefix, final load sequence, guard count, and result type.
 * @returns Nothing.
 */
export function expectGuardedDereference(
	byteCode: number[],
	options: { prefix: number[]; finalLoad: number[]; guardCount: number; resultType: number }
): void {
	expect(byteCode.slice(0, options.prefix.length)).toEqual(options.prefix);
	expect(byteCode).toContain(WASM_MEMORY_SIZE);
	expect(containsByteCodeSequence(byteCode, options.finalLoad)).toBe(true);
	expect(countByteCodeSequence(byteCode, [WASM_IF, options.resultType])).toBe(options.guardCount);
}
