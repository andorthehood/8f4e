import type {
	AnalyzedLine,
	CompilationContext,
	CompilerASTLine,
	FunctionMetadata,
	ResolvedCallLine,
} from '@8f4e/compiler-spec';
import { ArgumentType, createFunctionId, ErrorCode } from '@8f4e/compiler-spec';
import { analyzeInstruction } from '@8f4e/stack-analyzer/testing';
import { describe, expect, it } from 'vitest';
import createInstructionCompilerTestContext, {
	analyzeAndCompileInstruction,
	seedTestMemoryDeclarations,
} from '../utils/testUtils';
import call from './call';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

function registerFunction(context: CompilationContext, ...targetFunctions: FunctionMetadata[]): void {
	context.namespace.functions = {
		byId: Object.fromEntries(
			targetFunctions.map(targetFunction => [
				createFunctionId(targetFunction.name, targetFunction.signature.parameters),
				targetFunction,
			])
		),
		arityByName: Object.fromEntries(
			targetFunctions.map(targetFunction => [targetFunction.name, targetFunction.signature.parameters.length])
		),
	};
}

function analyzeAndCompileCall(line: CompilerASTLine, context: CompilationContext): AnalyzedLine<ResolvedCallLine> {
	const analyzedLine = analyzeInstruction(line, context) as AnalyzedLine<ResolvedCallLine>;
	call(analyzedLine, context);
	return analyzedLine;
}

describe('call instruction compiler', () => {
	it('emits call bytecode and pushes returns', () => {
		const context = createInstructionCompilerTestContext();
		const targetFunction = {
			id: 'foo',
			name: 'foo',
			signature: { parameters: ['int', 'float'], returns: ['int'] },
			wasmIndex: 2,
		} satisfies FunctionMetadata;
		registerFunction(context, targetFunction);
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
			name: 'foo64',
			signature: { parameters: ['float64'], returns: ['float64'] },
			wasmIndex: 2,
		} satisfies FunctionMetadata;
		registerFunction(context, targetFunction);
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

	it('resolves scalar overloads from stack operand types', () => {
		const context = createInstructionCompilerTestContext();
		const intOverload = {
			id: 'convert__int',
			name: 'convert',
			signature: { parameters: ['int'], returns: [] },
			wasmIndex: 2,
		} satisfies FunctionMetadata;
		const floatOverload = {
			id: 'convert__float',
			name: 'convert',
			signature: { parameters: ['float'], returns: [] },
			wasmIndex: 3,
		} satisfies FunctionMetadata;
		registerFunction(context, intOverload, floatOverload);
		context.stack.push({ kind: 'value', valueType: 'float', isNonZero: false });

		const analyzedLine = analyzeAndCompileCall(
			{
				lineNumber: 1,
				instruction: 'call',
				arguments: [classifyIdentifier('convert')],
			},
			context
		);

		expect(analyzedLine.targetFunction).toBe(floatOverload);
		expect(floatOverload.used).toBe(true);
		expect(intOverload.used).toBeUndefined();
		expect(context.byteCode).toEqual([0x10, floatOverload.wasmIndex]);
		expect(context.stack).toEqual([]);
	});

	it('resolves pointer overloads from pointee metadata', () => {
		const context = createInstructionCompilerTestContext();
		const intOverload = {
			id: 'wrap__int',
			name: 'wrap',
			signature: { parameters: ['int'], returns: [] },
			wasmIndex: 2,
		} satisfies FunctionMetadata;
		const pointerOverload = {
			id: 'wrap__float_p',
			name: 'wrap',
			signature: { parameters: ['float*'], returns: [] },
			wasmIndex: 3,
		} satisfies FunctionMetadata;
		registerFunction(context, intOverload, pointerOverload);
		context.stack.push({
			kind: 'address',
			valueType: 'int',
			address: { memoryIndex: 0 },
			pointsTo: { baseType: 'float', memoryIndex: 0, pointerDepth: 1 },
		});

		const analyzedLine = analyzeAndCompileCall(
			{
				lineNumber: 1,
				instruction: 'call',
				arguments: [classifyIdentifier('wrap')],
			},
			context
		);

		expect(analyzedLine.targetFunction).toBe(pointerOverload);
		expect(context.byteCode).toEqual([0x10, pointerOverload.wasmIndex]);
		expect(context.stack).toEqual([]);
	});

	it('resolves pointer overloads from known memory address literals', () => {
		const context = seedTestMemoryDeclarations(createInstructionCompilerTestContext(), {
			previousTrigger: {
				id: 'previousTrigger',
				numberOfElements: 1,
				elementWordSize: 4,
				memoryIndex: 0,
				wordAlignedAddress: 0,
				wordAlignedSize: 1,
				byteAddress: 0,
				default: 0,
				isInherited: false,
				isInteger: true,
				pointerDepth: 0,
				isUnsigned: false,
				type: 'int',
				lineNumber: 1,
			},
		});
		const targetFunction = {
			id: 'risingEdge__int__int_p',
			name: 'risingEdge',
			signature: { parameters: ['int', 'int*'], returns: [] },
			wasmIndex: 2,
		} satisfies FunctionMetadata;
		registerFunction(context, targetFunction);

		analyzeInstruction(
			{
				lineNumber: 1,
				instruction: 'push',
				arguments: [{ type: ArgumentType.LITERAL, value: 1, isInteger: true }],
			},
			context
		);
		analyzeInstruction(
			{
				lineNumber: 2,
				instruction: 'push',
				arguments: [
					{
						type: ArgumentType.LITERAL,
						value: 0,
						isInteger: true,
						address: {
							memoryIndex: 0,
							safeRange: {
								source: 'memory-start',
								memoryIndex: 0,
								byteAddress: 0,
								safeByteLength: 4,
								memoryId: 'previousTrigger',
							},
						},
					},
				],
			},
			context
		);

		const analyzedLine = analyzeAndCompileCall(
			{
				lineNumber: 3,
				instruction: 'call',
				arguments: [classifyIdentifier('risingEdge')],
			},
			context
		);

		expect(analyzedLine.targetFunction).toBe(targetFunction);
		expect(context.byteCode).toEqual([0x10, targetFunction.wasmIndex]);
		expect(context.stack).toEqual([]);
	});

	it('emits inline argument pushes before the call', () => {
		const context = createInstructionCompilerTestContext();
		const targetFunction = {
			id: 'foo',
			name: 'foo',
			signature: { parameters: ['int', 'float'], returns: ['int'] },
			wasmIndex: 2,
		} satisfies FunctionMetadata;
		registerFunction(context, targetFunction);

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
			name: 'foo64',
			signature: { parameters: ['float64'], returns: [] },
			wasmIndex: 2,
		} satisfies FunctionMetadata;
		registerFunction(context, targetFunction);
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

	it('throws when no overload matches the stack operands', () => {
		const context = createInstructionCompilerTestContext();
		const intOverload = {
			id: 'convert__int',
			name: 'convert',
			signature: { parameters: ['int'], returns: [] },
			wasmIndex: 2,
		} satisfies FunctionMetadata;
		const floatOverload = {
			id: 'convert__float',
			name: 'convert',
			signature: { parameters: ['float'], returns: [] },
			wasmIndex: 3,
		} satisfies FunctionMetadata;
		registerFunction(context, intOverload, floatOverload);
		context.stack.push({ kind: 'value', valueType: 'float64', isNonZero: false });

		try {
			analyzeInstruction(
				{
					lineNumber: 1,
					instruction: 'call',
					arguments: [classifyIdentifier('convert')],
				},
				context
			);
			throw new Error('Expected FUNCTION_OVERLOAD_NO_MATCH for convert(float64), but call succeeded');
		} catch (error) {
			const message = String((error as { message?: string })?.message ?? error);
			expect(message).toContain(`${ErrorCode.FUNCTION_OVERLOAD_NO_MATCH}`);
			expect(message).toContain('Inferred call: convert(float64)');
			expect(message).toContain('Available overloads:\n- convert(float)\n- convert(int)');
		}
	});

	it('throws no-match when raw integer operands do not match pointer overloads', () => {
		const context = createInstructionCompilerTestContext();
		const floatPointerOverload = {
			id: 'wrap__float_p',
			name: 'wrap',
			signature: { parameters: ['float*'], returns: [] },
			wasmIndex: 2,
		} satisfies FunctionMetadata;
		const intPointerOverload = {
			id: 'wrap__int_p',
			name: 'wrap',
			signature: { parameters: ['int*'], returns: [] },
			wasmIndex: 3,
		} satisfies FunctionMetadata;
		registerFunction(context, floatPointerOverload, intPointerOverload);
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		try {
			analyzeInstruction(
				{
					lineNumber: 1,
					instruction: 'call',
					arguments: [classifyIdentifier('wrap')],
				},
				context
			);
			throw new Error('Expected FUNCTION_OVERLOAD_NO_MATCH for wrap(int), but call succeeded');
		} catch (error) {
			const message = String((error as { message?: string })?.message ?? error);
			expect(message).toContain(`${ErrorCode.FUNCTION_OVERLOAD_NO_MATCH}`);
			expect(message).toContain('Inferred call: wrap(int)');
			expect(message).toContain('Available overloads:\n- wrap(float*)\n- wrap(int*)');
		}
	});

	it('tracks pointer return types on the stack', () => {
		const context = createInstructionCompilerTestContext();
		const targetFunction = {
			id: 'addr',
			name: 'addr',
			signature: { parameters: [], returns: ['float*'] },
			wasmIndex: 2,
		} satisfies FunctionMetadata;
		registerFunction(context, targetFunction);

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
