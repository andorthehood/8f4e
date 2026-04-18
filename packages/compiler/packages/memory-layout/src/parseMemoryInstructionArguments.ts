import { SyntaxErrorCode, SyntaxRulesError, parseMemoryInstructionArgumentsShape, type AST } from '@8f4e/tokenizer';

import { getError, type PublicMemoryLayoutErrorContext } from './getError';
import { resolveIdFromShape } from './internal/resolveIdFromShape';
import { resolveMemoryDefaultValue } from './internal/resolveMemoryDefaultValue';
import { resolveSplitByteTokens } from './internal/resolveSplitByteTokens';
import { ErrorCode, type PublicMemoryLayoutContext } from './types';

const MAX_SPLIT_BYTE_WIDTH = 4;

export function parseMemoryInstructionArguments(
	line: AST[number],
	context: Pick<PublicMemoryLayoutContext, 'namespace' | 'startingByteAddress' | 'currentModuleWordAlignedSize'> &
		PublicMemoryLayoutErrorContext
): { id: string; defaultValue: number } {
	const { arguments: args, lineNumberAfterMacroExpansion } = line;
	const lineForError = line;

	if (args.length === 0) {
		return {
			id: '__anonymous__' + lineNumberAfterMacroExpansion,
			defaultValue: 0,
		};
	}

	let shape: ReturnType<typeof parseMemoryInstructionArgumentsShape>;
	try {
		shape = parseMemoryInstructionArgumentsShape(args);
	} catch (error) {
		if (error instanceof SyntaxRulesError && error.code === SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS) {
			throw getError(ErrorCode.SPLIT_HEX_MIXED_TOKENS, lineForError, context);
		}
		throw error;
	}

	const id = resolveIdFromShape(shape.firstArg, lineNumberAfterMacroExpansion, lineForError, context);

	if (shape.firstArg.type === 'split-byte-tokens') {
		return {
			id,
			defaultValue: resolveSplitByteTokens(shape.firstArg.tokens, MAX_SPLIT_BYTE_WIDTH, lineForError, context),
		};
	}

	if (!shape.secondArg) {
		return {
			id,
			defaultValue: shape.firstArg.type === 'literal' ? shape.firstArg.value : 0,
		};
	}

	if (shape.secondArg.type === 'split-byte-tokens') {
		return {
			id,
			defaultValue: resolveSplitByteTokens(shape.secondArg.tokens, MAX_SPLIT_BYTE_WIDTH, lineForError, context),
		};
	}

	return { id, defaultValue: resolveMemoryDefaultValue(shape.secondArg, lineForError, context) };
}
