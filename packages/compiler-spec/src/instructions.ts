import type { InstructionSpec } from './instructionSpecs';
import { instructionSpecs } from './instructionSpecs';
import type {
	CodegenInstructionSpecName,
	InstructionSpecName,
	NonCodegenInstructionSpecName,
	SourceInstructionSpecName,
} from './instructionSpecTypes';
import type { MemoryDeclarationInstruction } from './memory';
import { memoryDeclarationInstructions } from './memory';

export type SemanticInstructionName = Extract<NonCodegenInstructionSpecName, SourceInstructionSpecName>;
export const semanticInstructionNames = Object.keys(instructionSpecs).filter(
	(instruction): instruction is SemanticInstructionName => {
		const spec = instructionSpecs[instruction as InstructionSpecName] as InstructionSpec;

		return spec.sourceInstruction !== false && spec.codegen === false;
	}
);

export const stackBlockInstructionPairs = [
	{ start: 'if', end: 'ifEnd' },
	{ start: 'block', end: 'blockEnd' },
	{ start: 'loop', end: 'loopEnd' },
] as const;

export const compilerBlockInstructionPairs = [
	...stackBlockInstructionPairs,
	{ start: 'function', end: 'functionEnd' },
	{ start: 'module', end: 'moduleEnd' },
	{ start: 'constants', end: 'constantsEnd' },
	{ start: 'prototype', end: 'prototypeEnd' },
	{ start: 'mapBegin', end: 'mapEnd' },
] as const;

export type BlockStartInstruction = (typeof compilerBlockInstructionPairs)[number]['start'];
export type BlockEndInstruction = (typeof compilerBlockInstructionPairs)[number]['end'];

export const blockStartInstructions = compilerBlockInstructionPairs.map(
	({ start }) => start
) as BlockStartInstruction[];

export const blockEndToStartInstruction = Object.fromEntries(
	compilerBlockInstructionPairs.map(({ start, end }) => [end, start])
) as Record<BlockEndInstruction, BlockStartInstruction>;

export const compilerSourceBlockInstructionPairs = [
	{ type: 'module', start: 'module', end: 'moduleEnd', compilesToModule: true, compilationMode: 'module' },
	{ type: 'function', start: 'function', end: 'functionEnd', compilesToModule: false, compilationMode: 'function' },
	{ type: 'constants', start: 'constants', end: 'constantsEnd', compilesToModule: true, compilationMode: null },
	{ type: 'prototype', start: 'prototype', end: 'prototypeEnd', compilesToModule: false, compilationMode: null },
] as const;

type CompilerSourceBlockInstructionPair = (typeof compilerSourceBlockInstructionPairs)[number];
type CompiledModuleSourceBlockPair = Extract<CompilerSourceBlockInstructionPair, { compilesToModule: true }>;

export type CompilerSourceBlockType = CompilerSourceBlockInstructionPair['type'];
export type CompilerSourceCompilationMode = Exclude<CompilerSourceBlockInstructionPair['compilationMode'], null>;
export const compilerSourceBlockTypes = compilerSourceBlockInstructionPairs.map(
	({ type }) => type
) as CompilerSourceBlockType[];

export type CompiledModuleBlockType = CompiledModuleSourceBlockPair['type'];
export const compiledModuleBlockTypes = compilerSourceBlockInstructionPairs
	.filter((pair): pair is CompiledModuleSourceBlockPair => pair.compilesToModule)
	.map(({ type }) => type) as CompiledModuleBlockType[];

export const compilerSourceBlockInstructionByType = Object.fromEntries(
	compilerSourceBlockInstructionPairs.map(pair => [pair.type, pair])
) as {
	readonly [Type in CompilerSourceBlockType]: Extract<
		(typeof compilerSourceBlockInstructionPairs)[number],
		{ type: Type }
	>;
};

export const documentOnlyInstructionNames = ['note', 'noteEnd', 'includes', 'include', 'includesEnd'] as const;
export type DocumentOnlyInstructionName = (typeof documentOnlyInstructionNames)[number];

export const documentBlockInstructionPairs = [
	...compilerSourceBlockInstructionPairs,
	{ type: 'note', start: 'note', end: 'noteEnd' },
	{ type: 'includes', start: 'includes', end: 'includesEnd' },
] as const;

export type DocumentBlockType = (typeof documentBlockInstructionPairs)[number]['type'];
export type DocumentBlockStartInstruction = (typeof documentBlockInstructionPairs)[number]['start'];
export type DocumentBlockEndInstruction = (typeof documentBlockInstructionPairs)[number]['end'];

export const documentBlockInstructionByType = Object.fromEntries(
	documentBlockInstructionPairs.map(pair => [pair.type, pair])
) as { readonly [Type in DocumentBlockType]: Extract<(typeof documentBlockInstructionPairs)[number], { type: Type }> };

export type CompilableBlockType = Exclude<DocumentBlockType, 'note' | 'includes'>;
export const compilableBlockTypes = documentBlockInstructionPairs
	.map(({ type }) => type)
	.filter((type): type is CompilableBlockType => type !== 'note' && type !== 'includes');

export type CodegenInstructionName = Extract<CodegenInstructionSpecName, SourceInstructionSpecName>;

export const codegenInstructionNames = Object.keys(instructionSpecs).filter(
	(instruction): instruction is CodegenInstructionName => {
		const spec = instructionSpecs[instruction as InstructionSpecName] as InstructionSpec;

		return spec.sourceInstruction !== false && spec.codegen !== false;
	}
);

export type Instruction =
	| CodegenInstructionName
	| MemoryDeclarationInstruction
	| SemanticInstructionName
	| DocumentOnlyInstructionName;

export const knownInstructionNameSet: ReadonlySet<string> = new Set([
	...codegenInstructionNames,
	...memoryDeclarationInstructions,
	...semanticInstructionNames,
	...documentOnlyInstructionNames,
]);

/**
 * Checks whether a string is one of the compiler's registered instruction names.
 *
 * @param instruction - Instruction keyword to inspect.
 * @returns True when the keyword belongs to a known compiler instruction.
 */
export function isKnownInstructionName(instruction: string): instruction is Instruction {
	return knownInstructionNameSet.has(instruction);
}
