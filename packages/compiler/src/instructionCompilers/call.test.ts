import { describe, expect, it } from 'vitest';

import call from './call';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { CompilerASTLine, CompilationContext } from '@8f4e/compiler-spec';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('call instruction compiler', () => {
	it('emits call bytecode and pushes returns', () => {
		const context = createInstructionCompilerTestContext();
		const targetFunction = {
			id: 'foo',
			signature: { parameters: ['int', 'float'], returns: ['int'] },
			wasmIndex: 2,
		} as NonNullable<CompilationContext['namespace']['functions']>[string];
		context.namespace.functions = {
			foo: targetFunction,
		} as CompilationContext['namespace']['functions'];
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: false, isNonZero: false });

		analyzeAndCompileInstruction(
			call,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'call',
				arguments: [classifyIdentifier('foo')],
				targetFunction,
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('tracks float64 parameter and return types on stack', () => {
		const context = createInstructionCompilerTestContext();
		const targetFunction = {
			id: 'foo64',
			signature: { parameters: ['float64'], returns: ['float64'] },
			wasmIndex: 2,
		} as NonNullable<CompilationContext['namespace']['functions']>[string];
		context.namespace.functions = {
			foo64: targetFunction,
		} as CompilationContext['namespace']['functions'];
		context.stack.push({ isInteger: false, isFloat64: true, isNonZero: false });

		analyzeAndCompileInstruction(
			call,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'call',
				arguments: [classifyIdentifier('foo64')],
				targetFunction,
			} as CompilerASTLine,
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
		const targetFunction = {
			id: 'foo64',
			signature: { parameters: ['float64'], returns: [] },
			wasmIndex: 2,
		} as NonNullable<CompilationContext['namespace']['functions']>[string];
		context.namespace.functions = {
			foo64: targetFunction,
		} as CompilationContext['namespace']['functions'];
		context.stack.push({ isInteger: false, isNonZero: false });

		expect(() => {
			analyzeAndCompileInstruction(
				call,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'call',
					arguments: [classifyIdentifier('foo64')],
					targetFunction,
				} as CompilerASTLine,
				context
			);
		}).toThrowError();
	});

	it('tracks pointer return types on the stack', () => {
		const context = createInstructionCompilerTestContext();
		const targetFunction = {
			id: 'addr',
			signature: { parameters: [], returns: ['float*'] },
			wasmIndex: 2,
		} as NonNullable<CompilationContext['namespace']['functions']>[string];
		context.namespace.functions = {
			addr: targetFunction,
		} as CompilationContext['namespace']['functions'];

		analyzeAndCompileInstruction(
			call,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'call',
				arguments: [classifyIdentifier('addr')],
				targetFunction,
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toHaveLength(1);
		expect(context.stack[0]).toMatchObject({
			isInteger: true,
			pointeeBaseType: 'float',
		});
	});
});
