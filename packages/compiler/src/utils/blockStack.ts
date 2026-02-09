import { BLOCK_TYPE } from '../types';

import type { BlockStack } from '../types';

export function isInstructionIsInsideAModule(blockStack: BlockStack) {
	for (let i = blockStack.length - 1; i >= 0; i--) {
		if (blockStack[i].blockType === BLOCK_TYPE.MODULE) {
			return true;
		}
	}
	return false;
}

export function isInstructionInsideFunction(blockStack: BlockStack) {
	for (let i = blockStack.length - 1; i >= 0; i--) {
		if (blockStack[i].blockType === BLOCK_TYPE.FUNCTION) {
			return true;
		}
	}
	return false;
}

export function isInstructionInsideModuleOrFunction(blockStack: BlockStack) {
	return isInstructionIsInsideAModule(blockStack) || isInstructionInsideFunction(blockStack);
}

export function isInstructionIsInsideBlock(blockStack: BlockStack, blockType: BLOCK_TYPE) {
	for (let i = blockStack.length - 1; i >= 0; i--) {
		if (blockStack[i].blockType === blockType) {
			return true;
		}
	}
	return false;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('blockStack utilities', () => {
		const mockModuleBlock: BlockStack[number] = {
			blockType: BLOCK_TYPE.MODULE,
			expectedResultIsInteger: false,
			hasExpectedResult: false,
		};
		const mockFunctionBlock: BlockStack[number] = {
			blockType: BLOCK_TYPE.FUNCTION,
			expectedResultIsInteger: false,
			hasExpectedResult: false,
		};
		const mockLoopBlock: BlockStack[number] = {
			blockType: BLOCK_TYPE.LOOP,
			expectedResultIsInteger: false,
			hasExpectedResult: false,
		};

		describe('isInstructionIsInsideAModule', () => {
			it('returns true when inside a module', () => {
				expect(isInstructionIsInsideAModule([mockModuleBlock])).toBe(true);
				expect(isInstructionIsInsideAModule([mockModuleBlock, mockLoopBlock])).toBe(true);
			});

			it('returns false when not inside a module', () => {
				expect(isInstructionIsInsideAModule([])).toBe(false);
				expect(isInstructionIsInsideAModule([mockFunctionBlock])).toBe(false);
				expect(isInstructionIsInsideAModule([mockLoopBlock])).toBe(false);
			});
		});

		describe('isInstructionInsideFunction', () => {
			it('returns true when inside a function', () => {
				expect(isInstructionInsideFunction([mockFunctionBlock])).toBe(true);
				expect(isInstructionInsideFunction([mockFunctionBlock, mockLoopBlock])).toBe(true);
			});

			it('returns false when not inside a function', () => {
				expect(isInstructionInsideFunction([])).toBe(false);
				expect(isInstructionInsideFunction([mockModuleBlock])).toBe(false);
				expect(isInstructionInsideFunction([mockLoopBlock])).toBe(false);
			});
		});

		describe('isInstructionInsideModuleOrFunction', () => {
			it('returns true when inside a module', () => {
				expect(isInstructionInsideModuleOrFunction([mockModuleBlock])).toBe(true);
			});

			it('returns true when inside a function', () => {
				expect(isInstructionInsideModuleOrFunction([mockFunctionBlock])).toBe(true);
			});

			it('returns false when inside neither', () => {
				expect(isInstructionInsideModuleOrFunction([])).toBe(false);
				expect(isInstructionInsideModuleOrFunction([mockLoopBlock])).toBe(false);
			});
		});

		describe('isInstructionIsInsideBlock', () => {
			it('returns true when inside specified block type', () => {
				expect(isInstructionIsInsideBlock([mockLoopBlock], BLOCK_TYPE.LOOP)).toBe(true);
				expect(isInstructionIsInsideBlock([mockModuleBlock], BLOCK_TYPE.MODULE)).toBe(true);
			});

			it('returns false when not inside specified block type', () => {
				expect(isInstructionIsInsideBlock([], BLOCK_TYPE.LOOP)).toBe(false);
				expect(isInstructionIsInsideBlock([mockModuleBlock], BLOCK_TYPE.LOOP)).toBe(false);
				expect(isInstructionIsInsideBlock([mockFunctionBlock], BLOCK_TYPE.LOOP)).toBe(false);
			});
		});
	});
}
