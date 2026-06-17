import type {
	AST,
	CompilerASTLine,
	CompilerASTLines,
	ConstantsLine,
	ExportLine,
	FunctionEndLine,
	FunctionLine,
	ImportLine,
	ModuleLine,
	PrototypeLine,
} from '@8f4e/language-spec';
import { SyntaxErrorCode, SyntaxRulesError } from './syntax/syntaxError';

/** Accumulates module-specific lines while the tokenizer builds a validated AST. */
type ModuleASTBuilder = {
	type: 'module';
	id: string;
	moduleLine: ModuleLine;
};

/** Accumulates function-specific metadata while the tokenizer builds a validated AST. */
type FunctionASTBuilder = {
	type: 'function';
	name: string;
	functionLine: FunctionLine;
	functionEndLine?: FunctionEndLine;
	exportLine?: ExportLine;
	importLine?: ImportLine;
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
			};
		case 'function':
			return {
				type: 'function',
				name: line.arguments[0].value,
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
			};
		default:
			return undefined;
	}
}

/** Records function import, export, and end metadata for a function builder. */
function applyFunctionASTLine(builder: FunctionASTBuilder, line: CompilerASTLine): void {
	switch (line.instruction) {
		case 'functionEnd':
			builder.functionEndLine = line;
			return;
		case '#export':
			builder.exportLine = line;
			return;
		case '#import':
			builder.importLine = line;
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
			return;
		case 'function':
			applyFunctionASTLine(builder, line);
			return;
		case 'constants':
			return;
		case 'prototype':
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
				name: builder.name,
				lines,
				functionLine: builder.functionLine,
				functionEndLine: builder.functionEndLine,
				...(builder.exportLine ? { exportLine: builder.exportLine } : {}),
				...(builder.importLine ? { importLine: builder.importLine } : {}),
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
			};
	}
}
