import type { CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import call from './call';

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
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'float', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			call,
			{
				lineNumber: 1,
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
		context.stack.push({ kind: 'value', valueType: 'float64', isNonZero: false });

		analyzeAndCompileInstruction(
			call,
			{
				lineNumber: 1,
				instruction: 'call',
				arguments: [classifyIdentifier('foo64')],
				targetFunction,
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toHaveLength(1);
		expect(context.stack[0]).toMatchObject({ kind: 'value', valueType: 'float64' });
	});

	it('emits inline argument pushes before the call', () => {
		const context = createInstructionCompilerTestContext();
		const targetFunction = {
			id: 'foo',
			signature: { parameters: ['int', 'float'], returns: ['int'] },
			wasmIndex: 2,
		} as NonNullable<CompilationContext['namespace']['functions']>[string];
		context.namespace.functions = {
			foo: targetFunction,
		} as CompilationContext['namespace']['functions'];

		analyzeAndCompileInstruction(
			call,
			{
				lineNumber: 1,
				instruction: 'call',
				arguments: [
					classifyIdentifier('foo'),
					{ type: ArgumentType.LITERAL, value: 2, isInteger: true },
					{ type: ArgumentType.LITERAL, value: 1.3, isInteger: false },
				],
				targetFunction,
				inlineArgumentPushes: [
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.LITERAL, value: 2, isInteger: true }],
					},
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.LITERAL, value: 1.3, isInteger: false }],
					},
				],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
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
		context.stack.push({ kind: 'value', valueType: 'float', isNonZero: false });

		expect(() => {
			analyzeAndCompileInstruction(
				call,
				{
					lineNumber: 1,
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
				lineNumber: 1,
				instruction: 'call',
				arguments: [classifyIdentifier('addr')],
				targetFunction,
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toHaveLength(1);
		expect(context.stack[0]).toMatchObject({
			kind: 'address',
			valueType: 'int',
			pointsTo: { baseType: 'float' },
		});
	});
});
