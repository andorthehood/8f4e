import { semanticInit } from './semanticInit';

import { BLOCK_TYPE, ErrorCode } from '../internalTypes';
import { getError } from '../getError';

import type { PublicMemoryLayoutContext } from '../internalTypes';
import type { AST, ConstantsEndLine, ConstantsLine, InitLine, ModuleEndLine, ModuleLine } from '@8f4e/tokenizer';

export function applySemanticInstruction(line: AST[number], context: PublicMemoryLayoutContext) {
	switch (line.instruction) {
		case 'init':
			semanticInit(line as InitLine, context);
			return;
		case 'module':
			context.blockStack.push({
				hasExpectedResult: false,
				expectedResultIsInteger: false,
				blockType: BLOCK_TYPE.MODULE,
			});
			context.namespace.moduleName = (line as ModuleLine).arguments[0].value;
			context.codeBlockId = context.namespace.moduleName;
			context.codeBlockType = 'module';
			return;
		case 'constants':
			if (context.blockStack.length > 0) {
				throw getError(ErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL, line, context);
			}
			context.blockStack.push({
				hasExpectedResult: false,
				expectedResultIsInteger: false,
				blockType: BLOCK_TYPE.CONSTANTS,
			});
			context.namespace.moduleName = (line as ConstantsLine).arguments[0].value;
			context.codeBlockId = context.namespace.moduleName;
			context.codeBlockType = 'constants';
			return;
		case 'moduleEnd':
			if (context.blockStack.at(-1)?.blockType !== BLOCK_TYPE.MODULE) {
				throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line as ModuleEndLine, context);
			}
			context.blockStack.pop();
			return;
		case 'constantsEnd':
			if (context.blockStack.at(-1)?.blockType !== BLOCK_TYPE.CONSTANTS) {
				throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line as ConstantsEndLine, context);
			}
			context.blockStack.pop();
	}
}
