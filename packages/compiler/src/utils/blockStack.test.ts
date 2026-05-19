import { describe, expect, it } from 'vitest';
import { BlockType } from '@8f4e/compiler-spec';

import { popBlock, pushBlock } from './blockStack';
import createInstructionCompilerTestContext from './testUtils';

import type { BlockStack } from '@8f4e/compiler-spec';

describe('blockStack utilities', () => {
	const mockModuleBlock: BlockStack[number] = {
		blockType: BlockType.MODULE,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	};
	const mockFunctionBlock: BlockStack[number] = {
		blockType: BlockType.FUNCTION,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	};
	const mockLoopBlock: BlockStack[number] = {
		blockType: BlockType.LOOP,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	};
	const mockGenericBlock: BlockStack[number] = {
		blockType: BlockType.BLOCK,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	};
	const mockConditionBlock: BlockStack[number] = {
		blockType: BlockType.CONDITION,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	};
	const mockConstantsBlock: BlockStack[number] = {
		blockType: BlockType.CONSTANTS,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	};
	const mockMapBlock: BlockStack[number] = {
		blockType: BlockType.MAP,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
		mapState: {
			inputIsInteger: true,
			inputIsFloat64: false,
			rows: [],
			defaultSet: false,
		},
	};

	describe('pushBlock and popBlock', () => {
		it.each([
			['module', mockModuleBlock, 'insideModuleBlock'],
			['function', mockFunctionBlock, 'insideFunctionBlock'],
			['generic', mockGenericBlock, 'insideGenericBlock'],
			['loop', mockLoopBlock, 'insideLoopBlock'],
			['condition', mockConditionBlock, 'insideConditionBlock'],
			['constants', mockConstantsBlock, 'insideConstantsBlock'],
			['map', mockMapBlock, 'insideMapBlock'],
		] as const)('tracks %s block context with a simple boolean flag', (_name, block, flagName) => {
			const context = createInstructionCompilerTestContext({ blockStack: [] });

			pushBlock(context, block);

			expect(context.blockStack).toEqual([block]);
			expect(context[flagName]).toBe(true);

			expect(popBlock(context)).toEqual(block);
			expect(context.blockStack).toEqual([]);
			expect(context[flagName]).toBe(false);
		});

		it('leaves cached block-context flags unchanged for unrelated blocks', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [],
				insideConstantsBlock: true,
				insideMapBlock: true,
			});

			pushBlock(context, mockLoopBlock);
			popBlock(context);

			expect(context.insideConstantsBlock).toBe(true);
			expect(context.insideMapBlock).toBe(true);
		});
	});
});
