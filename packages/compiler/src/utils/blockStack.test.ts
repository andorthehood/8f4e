import type { BlockStack } from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';
import { popBlock, pushBlock } from './blockStack';
import createInstructionCompilerTestContext from './testUtils';

describe('blockStack utilities', () => {
	const mockModuleBlock: BlockStack[number] = {
		blockType: BlockType.MODULE,expectedResultTypes: [],
	};
	const mockFunctionBlock: BlockStack[number] = {
		blockType: BlockType.FUNCTION,expectedResultTypes: [],
	};
	const mockLoopBlock: BlockStack[number] = {
		blockType: BlockType.LOOP,expectedResultTypes: [],
		loopCounterLocalName: '__loopCounter1',
		loopCounterLocal: { kind: 'value', valueType: 'int', index: 0 },
	};
	const mockGenericBlock: BlockStack[number] = {
		blockType: BlockType.BLOCK,expectedResultTypes: [],
	};
	const mockConditionBlock: BlockStack[number] = {
		blockType: BlockType.CONDITION,expectedResultTypes: [],
	};
	const mockConstantsBlock: BlockStack[number] = {
		blockType: BlockType.CONSTANTS,expectedResultTypes: [],
	};
	const mockMapBlock: BlockStack[number] = {
		blockType: BlockType.MAP,expectedResultTypes: [],
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

		it.each([
			['module', mockModuleBlock, 'insideModuleBlock'],
			['function', mockFunctionBlock, 'insideFunctionBlock'],
			['generic', mockGenericBlock, 'insideGenericBlock'],
			['loop', mockLoopBlock, 'insideLoopBlock'],
			['condition', mockConditionBlock, 'insideConditionBlock'],
			['constants', mockConstantsBlock, 'insideConstantsBlock'],
			['map', mockMapBlock, 'insideMapBlock'],
		] as const)('keeps the %s block flag set until the last matching block is popped', (_name, block, flagName) => {
			const context = createInstructionCompilerTestContext({ blockStack: [] });

			pushBlock(context, block);
			pushBlock(context, block);

			expect(context.blockStack).toHaveLength(2);
			expect(context[flagName]).toBe(true);

			expect(popBlock(context)).toEqual(block);
			expect(context.blockStack).toHaveLength(1);
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
