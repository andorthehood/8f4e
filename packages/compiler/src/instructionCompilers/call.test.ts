import { describe, expect, it } from 'vitest';

import call from './call';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, CompilationContext } from '@8f4e/compiler-types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('call instruction compiler', () => {
	it('emits call bytecode and pushes returns', () => {
		const context = createInstructionCompilerTestContext();
		context.namespace.functions = {
			foo: {
				id: 'foo',
				signature: { parameters: ['int', 'float'], returns: ['int'] },
				body: [],
				locals: [],
				wasmIndex: 2,
			},
		} as CompilationContext['namespace']['functions'];
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: false, isNonZero: false });

		call(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'call',
				arguments: [classifyIdentifier('foo')],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('tracks float64 parameter and return types on stack', () => {
		const context = createInstructionCompilerTestContext();
		context.namespace.functions = {
			foo64: {
				id: 'foo64',
				signature: { parameters: ['float64'], returns: ['float64'] },
				body: [],
				locals: [],
				wasmIndex: 2,
			},
		} as CompilationContext['namespace']['functions'];
		context.stack.push({ isInteger: false, isFloat64: true, isNonZero: false });

		call(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'call',
				arguments: [classifyIdentifier('foo64')],
			} as AST[number],
			context
		);

		expect(context.stack).toHaveLength(1);
		expect(context.stack[0]).toMatchObject({
			isInteger: false,
			isFloat64: true,
		});
	});

	it('throws on float32 argument passed to float64 parameter', () => {
		const context = createInstructionCompilerTestContext();
		context.namespace.functions = {
			foo64: {
				id: 'foo64',
				signature: { parameters: ['float64'], returns: [] },
				body: [],
				locals: [],
				wasmIndex: 2,
			},
		} as CompilationContext['namespace']['functions'];
		context.stack.push({ isInteger: false, isNonZero: false });

		expect(() => {
			call(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'call',
					arguments: [classifyIdentifier('foo64')],
				} as AST[number],
				context
			);
		}).toThrowError();
	});

	it('tracks pointer return types on the stack', () => {
		const context = createInstructionCompilerTestContext();
		context.namespace.functions = {
			addr: {
				id: 'addr',
				signature: { parameters: [], returns: ['float*'] },
				body: [],
				locals: [],
				wasmIndex: 2,
			},
		} as CompilationContext['namespace']['functions'];

		call(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'call',
				arguments: [classifyIdentifier('addr')],
			} as AST[number],
			context
		);

		expect(context.stack).toHaveLength(1);
		expect(context.stack[0]).toMatchObject({
			isInteger: true,
			pointeeBaseType: 'float',
		});
	});
});
