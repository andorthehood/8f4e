import { BLOCK_TYPE, type BlockStack, type CompilationContext, type InstructionCompiler } from '../types';
import { ErrorCode, getError } from '../errors';
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

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const line: Parameters<InstructionCompiler>[0] = {
		lineNumber: 1,
		instruction: 'test' as never,
		arguments: [],
	};
	const context = { stack: [] } as unknown as CompilationContext;

	const moduleStack: BlockStack = [
		{ hasExpectedResult: false, expectedResultIsInteger: false, blockType: BLOCK_TYPE.MODULE },
	];
	const functionStack: BlockStack = [
		{ hasExpectedResult: false, expectedResultIsInteger: false, blockType: BLOCK_TYPE.FUNCTION },
	];

	describe('validateScope', () => {
		it('accepts valid scopes', () => {
			expect(() => validateScope(moduleStack, 'module', line, context, ErrorCode.UNKNOWN_ERROR)).not.toThrow();
			expect(() => validateScope(functionStack, 'function', line, context, ErrorCode.UNKNOWN_ERROR)).not.toThrow();
		});

		it('rejects invalid scopes', () => {
			expect(() => validateScope([], 'module', line, context, ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK)).toThrow(
				`${ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK}`
			);
		});
	});
}
