import { SymbolResolutionErrorCode } from './types';

import type { CompileError, CompileErrorContext } from '@8f4e/compiler-errors';
import type { AST } from '@8f4e/tokenizer';

export function getError(
	code: SymbolResolutionErrorCode,
	line: AST[number],
	context?: CompileErrorContext,
	details?: { identifier?: string }
): CompileError {
	const suffix = ` (${code})`;
	switch (code) {
		case SymbolResolutionErrorCode.UNDECLARED_IDENTIFIER:
			return {
				stage: 'symbols',
				code,
				message: 'Undeclared identifier' + (details?.identifier ? `: ${details.identifier}` : '') + `.${suffix}`,
				line,
				context,
			};
		case SymbolResolutionErrorCode.DUPLICATE_IDENTIFIER:
			return {
				stage: 'symbols',
				code,
				message: `Duplicate identifier${details?.identifier ? `: ${details.identifier}` : ''}.${suffix}`,
				line,
				context,
			};
		case SymbolResolutionErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK:
			return {
				stage: 'symbols',
				code,
				message: `This instruction can only be used within a block or a module.${suffix}`,
				line,
				context,
			};
		case SymbolResolutionErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL:
			return { stage: 'symbols', code, message: `This instruction must be top-level.${suffix}`, line, context };
		case SymbolResolutionErrorCode.MISSING_BLOCK_START_INSTRUCTION:
			return { stage: 'symbols', code, message: `Missing block start instruction.${suffix}`, line, context };
		case SymbolResolutionErrorCode.LAYOUT_DEPENDENT_CONSTANT:
			return {
				stage: 'symbols',
				code,
				message:
					`Constants cannot depend on memory layout or memory metadata` +
					(details?.identifier ? `: ${details.identifier}` : '') +
					`.${suffix}`,
				line,
				context,
			};
		default:
			return { stage: 'symbols', code, message: `Compiler symbol resolution error.${suffix}`, line, context };
	}
}
