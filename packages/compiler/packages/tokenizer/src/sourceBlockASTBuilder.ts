import type {
	AST,
	CompilerASTLine,
	CompilerASTLines,
	ConstantsLine,
	ExportLine,
	FunctionEndLine,
	FunctionLine,
	ImportLine,
	MemoryDeclarationLine,
	ModuleLine,
	PrototypeLine,
	RegionLine,
} from '@8f4e/compiler-spec';
import { DEFAULT_HOST_IMPORT_MODULE_NAME, isMemoryDeclarationLine } from '@8f4e/compiler-spec';
import { SyntaxErrorCode, SyntaxRulesError } from './syntax/syntaxError';

/** Accumulates module-specific lines while the tokenizer builds a validated AST. */
type ModuleASTBuilder = {
	type: 'module';
	id: string;
	moduleLine: ModuleLine;
	regionLine?: RegionLine;
	memoryDeclarationLines: MemoryDeclarationLine[];
};

/** Accumulates function-specific metadata while the tokenizer builds a validated AST. */
type FunctionASTBuilder = {
	type: 'function';
	id: string;
	functionLine: FunctionLine;
	functionEndLine?: FunctionEndLine;
	exportLine?: ExportLine;
	exportName?: string;
	importLine?: ImportLine;
	import?: {
		moduleName: string;
		fieldName: string;
	};
};

/** Accumulates constants-block metadata while the tokenizer builds a validated AST. */
type ConstantsASTBuilder = {
	type: 'constants';
	id: string;
	constantsLine: ConstantsLine;
};

/** Accumulates prototype memory declarations while the tokenizer builds a validated AST. */
type PrototypeASTBuilder = {
	type: 'prototype';
	id: string;
	prototypeLine: PrototypeLine;
	memoryDeclarationLines: MemoryDeclarationLine[];
};

/** Source block builder selected from the first valid source block in parsed input. */
export type SourceBlockASTBuilder = ModuleASTBuilder | FunctionASTBuilder | ConstantsASTBuilder | PrototypeASTBuilder;

/**
 * Creates the source-block builder represented by a parsed block-start line.
 *
 * @param line - Source AST line being processed.
 * @returns Source-block AST builder for the line, or `undefined` when the line is not a source-block opener.
 */
export function createSourceBlockASTBuilder(line: CompilerASTLine): SourceBlockASTBuilder | undefined {
	switch (line.instruction) {
		case 'module':
			return {
				type: 'module',
				id: line.arguments[0].value,
				moduleLine: line,
				memoryDeclarationLines: [],
			};
		case 'function':
			return {
				type: 'function',
				id: line.arguments[0].value,
				functionLine: line,
			};
		case 'constants':
			return {
				type: 'constants',
				id: line.arguments[0].value,
				constantsLine: line,
			};
		case 'prototype':
			return {
				type: 'prototype',
				id: line.arguments[0].value,
				prototypeLine: line,
				memoryDeclarationLines: [],
			};
		default:
			return undefined;
	}
}

/** Records module-only metadata while source lines are streamed into a module builder. */
function applyModuleASTLine(builder: ModuleASTBuilder, line: CompilerASTLine): void {
	switch (line.instruction) {
		case '#region':
			builder.regionLine = line;
			return;
		default:
			if (!isMemoryDeclarationLine(line)) {
				return;
			}
	}

	builder.memoryDeclarationLines.push(line);
}

/** Records function import, export, and end metadata for a function builder. */
function applyFunctionASTLine(builder: FunctionASTBuilder, line: CompilerASTLine): void {
	switch (line.instruction) {
		case 'functionEnd':
			builder.functionEndLine = line;
			return;
		case '#export':
			builder.exportLine = line;
			builder.exportName = builder.exportLine.arguments[0]?.value ?? builder.id;
			return;
		case '#import':
			builder.importLine = line;
			builder.import = {
				moduleName: DEFAULT_HOST_IMPORT_MODULE_NAME,
				fieldName: line.arguments[0].value,
			};
	}
}

/**
 * Routes a parsed line into the active source-block builder.
 *
 * @param builder - Source-block AST builder to update.
 * @param line - Source AST line being processed.
 * @returns Nothing.
 */
export function applySourceBlockASTLine(builder: SourceBlockASTBuilder, line: CompilerASTLine): void {
	switch (builder.type) {
		case 'module':
			applyModuleASTLine(builder, line);
			return;
		case 'function':
			applyFunctionASTLine(builder, line);
			return;
		case 'constants':
			return;
		case 'prototype':
			if (isMemoryDeclarationLine(line)) {
				builder.memoryDeclarationLines.push(line);
			}
			return;
	}
}

/**
 * Materializes the final validated AST from accumulated source-block metadata.
 *
 * @param lines - Parsed instruction stream for the source block.
 * @param builder - Source-block metadata collected during tokenization.
 * @returns The source-block AST represented by the builder.
 */
export function createASTFromBuilder(lines: CompilerASTLines, builder: SourceBlockASTBuilder): AST {
	switch (builder.type) {
		case 'module':
			return {
				type: 'module',
				id: builder.id,
				lines,
				moduleLine: builder.moduleLine,
				...(builder.regionLine ? { regionLine: builder.regionLine } : {}),
				memoryDeclarationLines: builder.memoryDeclarationLines,
			};
		case 'function':
			if (!builder.functionEndLine) {
				throw new SyntaxRulesError(SyntaxErrorCode.INVALID_BLOCK_STRUCTURE, 'Expected a matching functionEnd.', {
					lineNumber: builder.functionLine.lineNumber,
					instruction: builder.functionLine.instruction,
				});
			}

			return {
				type: 'function',
				id: builder.id,
				lines,
				functionLine: builder.functionLine,
				functionEndLine: builder.functionEndLine,
				...(builder.exportLine ? { exportLine: builder.exportLine, exportName: builder.exportName } : {}),
				...(builder.importLine ? { importLine: builder.importLine, import: builder.import } : {}),
			};
		case 'constants':
			return {
				type: 'constants',
				id: builder.id,
				lines,
				constantsLine: builder.constantsLine,
			};
		case 'prototype':
			return {
				type: 'prototype',
				id: builder.id,
				lines,
				prototypeLine: builder.prototypeLine,
				memoryDeclarationLines: builder.memoryDeclarationLines,
			};
	}
}
