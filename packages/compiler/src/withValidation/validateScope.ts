import { BLOCK_TYPE, type BlockStack, type CompilationContext, type InstructionCompiler } from '@8f4e/compiler-types';

import { ErrorCode, getError } from '../compilerError';
import {
	isInstructionInsideFunction,
	isInstructionInsideModuleOrFunction,
	isInstructionIsInsideAModule,
	isInstructionIsInsideBlock,
} from '../utils/blockStack';

import type { ScopeRule } from './types';

export function validateScope(
	blockStack: BlockStack,
	scope: ScopeRule,
	line: Parameters<InstructionCompiler>[0],
	context: CompilationContext,
	errorCode: ErrorCode
): void {
	let isValid = false;

	switch (scope) {
		case 'module':
			isValid = isInstructionIsInsideAModule(blockStack);
			break;
		case 'function':
			isValid = isInstructionInsideFunction(blockStack);
			break;
		case 'moduleOrFunction':
			isValid = isInstructionInsideModuleOrFunction(blockStack);
			break;
		case 'block':
			isValid = isInstructionIsInsideBlock(blockStack, BLOCK_TYPE.BLOCK);
			break;
		case 'constants':
			isValid = isInstructionIsInsideBlock(blockStack, BLOCK_TYPE.CONSTANTS);
			break;
		case 'map':
			isValid = isInstructionIsInsideBlock(blockStack, BLOCK_TYPE.MAP);
			break;
	}

	if (!isValid) {
		throw getError(errorCode, line, context);
	}
}
