import { instructionSpecs } from './instructionSpecs';
import { memoryDeclarationInstructions } from './memory';

import type {
	CodegenInstructionSpecName,
	InstructionSpec,
	InstructionSpecName,
	NonCodegenInstructionSpecName,
	SourceInstructionSpecName,
} from './instructionSpecs';
import type { MemoryDeclarationInstruction } from './memory';

export type SemanticInstructionName = Extract<NonCodegenInstructionSpecName, SourceInstructionSpecName>;
export const semanticInstructionNames = Object.keys(instructionSpecs).filter(
	(instruction): instruction is SemanticInstructionName => {
		const spec = instructionSpecs[instruction as InstructionSpecName] as InstructionSpec;

		return spec.sourceInstruction !== false && spec.codegen === false;
	}
);

export const macroInstructionNames = ['defineMacro', 'defineMacroEnd', 'macro'] as const;
export type MacroInstructionName = (typeof macroInstructionNames)[number];

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
	{ type: 'module', start: 'module', end: 'moduleEnd' },
	{ type: 'function', start: 'function', end: 'functionEnd' },
	{ type: 'constants', start: 'constants', end: 'constantsEnd' },
] as const;

export type CompilerSourceBlockType = (typeof compilerSourceBlockInstructionPairs)[number]['type'];
export const compilerSourceBlockTypes = compilerSourceBlockInstructionPairs.map(
	({ type }) => type
) as CompilerSourceBlockType[];

export type CompiledModuleBlockType = Exclude<CompilerSourceBlockType, 'function'>;
export const compiledModuleBlockTypes = compilerSourceBlockTypes.filter(
	(type): type is CompiledModuleBlockType => type !== 'function'
);

export const compilerSourceBlockInstructionByType = Object.fromEntries(
	compilerSourceBlockInstructionPairs.map(pair => [pair.type, pair])
) as {
	readonly [Type in CompilerSourceBlockType]: Extract<
		(typeof compilerSourceBlockInstructionPairs)[number],
		{ type: Type }
	>;
};

export const documentOnlyInstructionNames = ['note', 'noteEnd'] as const;
export type DocumentOnlyInstructionName = (typeof documentOnlyInstructionNames)[number];

export const documentBlockInstructionPairs = [
	...compilerSourceBlockInstructionPairs,
	{ type: 'macro', start: 'defineMacro', end: 'defineMacroEnd' },
	{ type: 'note', start: 'note', end: 'noteEnd' },
] as const;

export type DocumentBlockType = (typeof documentBlockInstructionPairs)[number]['type'];
export type DocumentBlockStartInstruction = (typeof documentBlockInstructionPairs)[number]['start'];
export type DocumentBlockEndInstruction = (typeof documentBlockInstructionPairs)[number]['end'];

export const documentBlockInstructionByType = Object.fromEntries(
	documentBlockInstructionPairs.map(pair => [pair.type, pair])
) as { readonly [Type in DocumentBlockType]: Extract<(typeof documentBlockInstructionPairs)[number], { type: Type }> };

export type CompilableBlockType = Exclude<DocumentBlockType, 'note'>;
export const compilableBlockTypes = documentBlockInstructionPairs
	.map(({ type }) => type)
	.filter((type): type is CompilableBlockType => type !== 'note');

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
	| MacroInstructionName
	| DocumentOnlyInstructionName;

export const languageInstructionNames = Array.from(
	new Set([
		...codegenInstructionNames,
		...memoryDeclarationInstructions,
		...semanticInstructionNames,
		...macroInstructionNames,
		...documentOnlyInstructionNames,
	])
) as Instruction[];
