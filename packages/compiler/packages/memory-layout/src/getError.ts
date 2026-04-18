import { ErrorCode } from './types';

import type { AST } from '@8f4e/tokenizer';

export type PublicMemoryLayoutError = {
	code: ErrorCode;
	message: string;
	line: AST[number];
	context?: PublicMemoryLayoutErrorContext;
};

export type PublicMemoryLayoutErrorContext = {
	codeBlockId?: string;
	codeBlockType?: 'module' | 'function' | 'constants';
};

export function getError(
	code: ErrorCode,
	line: AST[number],
	context?: PublicMemoryLayoutErrorContext,
	details?: { identifier?: string }
): PublicMemoryLayoutError {
	const suffix = ` (${code})`;
	switch (code) {
		case ErrorCode.UNDECLARED_IDENTIFIER:
			return {
				code,
				message: 'Undeclared identifier' + (details?.identifier ? `: ${details.identifier}` : '') + `.${suffix}`,
				line,
				context,
			};
		case ErrorCode.DUPLICATE_IDENTIFIER:
			return {
				code,
				message: `Duplicate identifier${details?.identifier ? `: ${details.identifier}` : ''}.${suffix}`,
				line,
				context,
			};
		case ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK:
			return {
				code,
				message: `This instruction can only be used within a block or a module.${suffix}`,
				line,
				context,
			};
		case ErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL:
			return { code, message: `This instruction must be top-level.${suffix}`, line, context };
		case ErrorCode.MISSING_BLOCK_START_INSTRUCTION:
			return { code, message: `Missing block start instruction.${suffix}`, line, context };
		case ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER:
			return { code, message: `Constant-style names cannot be used as memory identifiers.${suffix}`, line, context };
		case ErrorCode.RESERVED_MEMORY_IDENTIFIER:
			return {
				code,
				message: `Reserved memory identifier${details?.identifier ? `: ${details.identifier}` : ''}.${suffix}`,
				line,
				context,
			};
		case ErrorCode.SPLIT_HEX_TOO_MANY_BYTES:
			return { code, message: `Too many bytes in split-byte literal.${suffix}`, line, context };
		case ErrorCode.SPLIT_HEX_MIXED_TOKENS:
			return { code, message: `Split-byte literals cannot mix token classes.${suffix}`, line, context };
		case ErrorCode.SPLIT_BYTE_CONSTANT_OUT_OF_RANGE:
			return { code, message: `Split-byte constant is outside byte range.${suffix}`, line, context };
		default:
			return { code, message: `Compiler memory layout error.${suffix}`, line, context };
	}
}
