import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { ArgumentType, BlockType, ErrorCode } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext from '../utils/testUtils';
import { validateInstruction } from './validateInstruction';

const pushLine: CompilerASTLine = {
	lineNumber: 1,
	instruction: 'push',
	arguments: [{ type: ArgumentType.LITERAL, value: 1, isInteger: true }],
};

const mapLine: CompilerASTLine = {
	lineNumber: 1,
	instruction: 'map',
	arguments: [
		{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
		{ type: ArgumentType.LITERAL, value: 2, isInteger: true },
	],
};

describe('validateInstruction', () => {
	it('rejects instructions inside constants blocks from the cached context flag', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [],
			insideConstantsBlock: true,
		});

		expect(() => validateInstruction(pushLine, context)).toThrow(`${ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK}`);
	});

	it('rejects instructions inside map blocks from the cached context flag', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [],
			insideMapBlock: true,
		});

		expect(() => validateInstruction(pushLine, context)).toThrow(`${ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK}`);
	});

	it('still allows map instructions inside map blocks', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
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
			insideMapBlock: true,
		});

		expect(() => validateInstruction(mapLine, context)).not.toThrow();
	});
});
