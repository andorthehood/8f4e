import type { FunctionMetadata, SemanticCallLine } from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import createInstructionCompilerTestContext, { createStackFacts } from '../testUtils';
import call from './call';

const target: FunctionMetadata = {
	id: 'convert__float',
	name: 'convert',
	signature: { parameters: ['float'], returns: ['int'] },
	wasmIndex: 3,
};

function createCallLine(): SemanticCallLine {
	return {
		lineNumber: 1,
		instruction: 'call',
		arguments: [{ type: ArgumentType.IDENTIFIER, value: 'convert', referenceKind: 'plain', scope: 'local' }],
	};
}

describe('call instruction compiler', () => {
	it('emits the call selected by stack analysis', () => {
		const other: FunctionMetadata = {
			id: 'convert__int',
			name: 'convert',
			signature: { parameters: ['int'], returns: ['int'] },
			wasmIndex: 2,
		};
		const context = createInstructionCompilerTestContext({
			functions: {
				byId: { [target.id]: target, [other.id]: other },
				arityByName: { convert: 1 },
			},
		});
		call(createCallLine(), context, createStackFacts({ targetFunctionId: target.id }));
		expect(context.byteCode).toEqual([0x10, target.wasmIndex]);
		expect('used' in target).toBe(false);
		expect('used' in other).toBe(false);
	});

	it('emits resolved inline pushes before the selected call', () => {
		const context = createInstructionCompilerTestContext({
			functions: {
				byId: { [target.id]: target },
				arityByName: { convert: 1 },
			},
		});
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
		call(line, context, createStackFacts({ targetFunctionId: target.id }));
		expect(context.byteCode).toEqual([0x43, 0, 0, 0xc0, 0x3f, 0x10, target.wasmIndex]);
	});
});
