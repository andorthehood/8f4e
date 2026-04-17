import { describe, expect, it } from 'vitest';

import {
	isInstructionInsideFunction,
	isInstructionInsideModuleOrFunction,
	isInstructionIsInsideAModule,
	isInstructionIsInsideBlock,
} from './blockStack';

import { BLOCK_TYPE } from '../types';

import type { BlockStack } from '../types';

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
