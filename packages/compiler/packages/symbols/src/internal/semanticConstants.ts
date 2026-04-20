import { getError } from '../getError';
import { BLOCK_TYPE, SymbolResolutionErrorCode, type SymbolResolutionContext } from '../types';

import type { ConstantsLine } from '@8f4e/tokenizer';

export function semanticConstants(line: ConstantsLine, context: SymbolResolutionContext) {
	if (context.blockStack.length > 0) {
		throw getError(SymbolResolutionErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL, line, context);
	}

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.CONSTANTS,
	});

	const moduleId = line.arguments[0].value;
	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = 'constants';
}
