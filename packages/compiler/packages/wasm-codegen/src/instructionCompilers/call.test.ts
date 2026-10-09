import type { SemanticCallLine } from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import createInstructionCompilerTestContext, { createStackFacts } from '../testUtils';
import call from './call';

const targetId = 'convert__float';

function createCallLine(): SemanticCallLine {
	return {
		lineNumber: 1,
		instruction: 'call',
		arguments: [{ type: ArgumentType.IDENTIFIER, value: 'convert', referenceKind: 'plain', scope: 'local' }],
	};
}

describe('call instruction compiler', () => {
	it('emits the call selected by stack analysis', () => {
		const context = createInstructionCompilerTestContext();
		context.functionLayout.functions = {
			[targetId]: { wasmIndex: 3, typeIndex: 1 },
			convert__int: { wasmIndex: 2, typeIndex: 2 },
		};
		call(createCallLine(), context, createStackFacts({ targetFunctionId: targetId }));
		expect(context.byteCode).toEqual([0x10, 3]);
	});

	it('emits resolved inline pushes before the selected call', () => {
		const context = createInstructionCompilerTestContext();
		context.functionLayout.functions[targetId] = { wasmIndex: 3, typeIndex: 1 };
		const line: SemanticCallLine = {
			...createCallLine(),
			inlineArgumentPushes: [
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.LITERAL, value: 1.5, isInteger: false }],
				},
			],
		};
		call(line, context, createStackFacts({ targetFunctionId: targetId }));
		expect(context.byteCode).toEqual([0x43, 0, 0, 0xc0, 0x3f, 0x10, 3]);
	});
});
