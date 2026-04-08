/**
 * Converts any compiler-pipeline error into the shared CompilerDiagnostic shape.
 *
 * Use this at serialization boundaries (e.g. compiler-worker postMessage) so that
 * consumers always receive the unified contract regardless of which compiler stage
 * (tokenizer/syntax or semantic/compiler) produced the error.
 */

import { SyntaxRulesError } from '@8f4e/tokenizer';

import type { CompilerDiagnostic, CompilerStageError } from './types';

const FALLBACK_LINE = {
	lineNumberBeforeMacroExpansion: 0,
	lineNumberAfterMacroExpansion: 0,
} as const;

const FALLBACK_CONTEXT = {} as const;

function isCompilerStageError(value: unknown): value is CompilerStageError {
	return (
		value !== null &&
		typeof value === 'object' &&
		'code' in value &&
		typeof (value as { code: unknown }).code === 'number' &&
		'message' in value &&
		typeof (value as { message: unknown }).message === 'string'
	);
}

export function serializeDiagnostic(error: unknown): CompilerDiagnostic {
	if (error instanceof SyntaxRulesError) {
		return {
			code: error.code,
			message: error.message,
			line: error.line ?? FALLBACK_LINE,
			context: FALLBACK_CONTEXT,
		};
	}

	if (isCompilerStageError(error)) {
		return {
			code: error.code,
			message: error.message,
			line: error.line
				? {
						lineNumberBeforeMacroExpansion: error.line.lineNumberBeforeMacroExpansion,
						lineNumberAfterMacroExpansion: error.line.lineNumberAfterMacroExpansion,
						instruction: error.line.instruction,
						arguments: error.line.arguments as unknown[],
					}
				: FALLBACK_LINE,
			context: error.context
				? {
						codeBlockId: error.context.codeBlockId,
						codeBlockType: error.context.codeBlockType,
					}
				: FALLBACK_CONTEXT,
		};
	}

	// Generic fallback for unexpected throw values
	const message = error instanceof Error ? error.message : String(error);
	return { code: -1, message, line: FALLBACK_LINE, context: FALLBACK_CONTEXT };
}
