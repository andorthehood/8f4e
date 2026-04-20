import { ErrorCode } from './internalTypes';

import type { CompileError, CompileErrorContext } from '@8f4e/compiler-errors';
import type { AST } from '@8f4e/tokenizer';

export function getError(
	code: ErrorCode,
	line: AST[number],
	context?: CompileErrorContext,
	details?: { identifier?: string }
): CompileError {
	const suffix = ` (${code})`;
	switch (code) {
		case ErrorCode.UNDECLARED_IDENTIFIER:
			return {
				stage: 'memory-layout',
				code,
				message: 'Undeclared identifier' + (details?.identifier ? `: ${details.identifier}` : '') + `.${suffix}`,
				line,
				context,
			};
		case ErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL:
			return { stage: 'memory-layout', code, message: `This instruction must be top-level.${suffix}`, line, context };
		case ErrorCode.MISSING_BLOCK_START_INSTRUCTION:
			return { stage: 'memory-layout', code, message: `Missing block start instruction.${suffix}`, line, context };
		case ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK:
			return {
				stage: 'memory-layout',
				code,
				message: `This instruction is not allowed in this block.${suffix}`,
				line,
				context,
			};
		case ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER:
			return {
				stage: 'memory-layout',
				code,
				message: `Constant-style names cannot be used as memory identifiers.${suffix}`,
				line,
				context,
			};
		case ErrorCode.RESERVED_MEMORY_IDENTIFIER:
			return {
				stage: 'memory-layout',
				code,
				message: `Reserved memory identifier${details?.identifier ? `: ${details.identifier}` : ''}.${suffix}`,
				line,
				context,
			};
		case ErrorCode.SPLIT_HEX_TOO_MANY_BYTES:
			return { stage: 'memory-layout', code, message: `Too many bytes in split-byte literal.${suffix}`, line, context };
		case ErrorCode.SPLIT_HEX_MIXED_TOKENS:
			return {
				stage: 'memory-layout',
				code,
				message: `Split-byte literals cannot mix token classes.${suffix}`,
				line,
				context,
			};
		case ErrorCode.SPLIT_BYTE_CONSTANT_OUT_OF_RANGE:
			return {
				stage: 'memory-layout',
				code,
				message: `Split-byte constant is outside byte range.${suffix}`,
				line,
				context,
			};
		default:
			return { stage: 'memory-layout', code, message: `Public memory layout error.${suffix}`, line, context };
	}
}
