import type { CompilerASTLine } from '@8f4e/language-spec';
import { BlockType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { compileInstructionForTest, createStackFacts } from '../testUtils';
import mapEnd from './mapEnd';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('mapEnd instruction compiler', () => {
	it('emits DROP + typed zero for zero rows', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultTypes: [],
				},
				{
					blockType: BlockType.MAP,
					expectedResultTypes: [],
					mapState: {
						inputIsInteger: true,
						inputIsFloat64: false,
						rows: [],
						defaultSet: false,
					},
				},
			],
		});

		compileInstructionForTest(
			mapEnd,
			{
				lineNumber: 1,
				instruction: 'mapEnd',
				arguments: [classifyIdentifier('int')],
			} as CompilerASTLine,
			context,
			createStackFacts({ map: { inputKind: 'int32', outputKind: 'int32' } })
		);

		expect({
			byteCode: context.byteCode,
			blockStack: context.blockStack,
		}).toMatchSnapshot();
	});
});
