import type { CompilerASTLine, FunctionTypeRegistry } from '@8f4e/language-spec';
import { createFunctionId } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import _function from './function';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('function instruction compiler', () => {
	it('starts a new function block', () => {
		const functionId = createFunctionId('doThing', []);
		const context = createInstructionCompilerTestContext({
			blockStack: [],
			currentFunctionId: functionId,
			currentFunctionName: 'doThing',
			currentFunctionMetadata: {
				id: functionId,
				name: 'doThing',
				signature: { parameters: [], returns: [] },
				wasmIndex: 0,
			},
			currentFunctionParameterCount: 0,
			functionTypeRegistry: {
				baseTypeIndex: 0,
				signatures: [],
				types: [],
			} as FunctionTypeRegistry,
		});

		analyzeAndCompileInstruction(
			_function,
			{
				lineNumber: 1,
				instruction: 'function',
				arguments: [classifyIdentifier('doThing')],
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			currentFunctionId: context.currentFunctionId,
			currentFunctionName: context.currentFunctionName,
			currentFunctionParameterCount: context.currentFunctionParameterCount,
			mode: context.mode,
			locals: context.locals,
		}).toMatchSnapshot();
	});
});
