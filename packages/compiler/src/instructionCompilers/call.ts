import { ErrorCode, getError } from '../errors';
import { ArgumentType } from '../types';
import { saveByteCode } from '../utils/compilation';
import wasmCall from '../wasmUtils/call/call';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, CompilationContext, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `call`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const call: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line, context) => {
		const functionNameArg = line.arguments[0];
		if (!functionNameArg || functionNameArg.type !== ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		const functionName = functionNameArg.value;
		const targetFunction = context.namespace.functions?.[functionName];

		if (!targetFunction) {
			throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context);
		}

		// Validate stack has the right arguments
		const { parameters, returns } = targetFunction.signature;
		if (context.stack.length < parameters.length) {
			throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
		}

		// Check parameter types match
		for (let i = 0; i < parameters.length; i++) {
			const stackIndex = context.stack.length - parameters.length + i;
			const stackItem = context.stack[stackIndex];
			const expectedInteger = parameters[i] === 'int';
			const expectedFloat64 = parameters[i] === 'float64';
			if (stackItem.isInteger !== expectedInteger || !!stackItem.isFloat64 !== expectedFloat64) {
				throw getError(ErrorCode.TYPE_MISMATCH, line, context);
			}
		}

		// Pop arguments from stack
		context.stack.splice(context.stack.length - parameters.length, parameters.length);

		// Push return values onto stack
		returns.forEach(returnType => {
			context.stack.push({
				isInteger: returnType === 'int',
				...(returnType === 'float64' ? { isFloat64: true } : {}),
			});
		});

		// Emit WASM call instruction
		if (targetFunction.wasmIndex !== undefined) {
			saveByteCode(context, wasmCall(targetFunction.wasmIndex));
		}

		return context;
	}
);

export default call;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

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
					lineNumber: 1,
					instruction: 'call',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'foo' }],
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
					lineNumber: 1,
					instruction: 'call',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'foo64' }],
				} as AST[number],
				context
			);

			expect(context.stack).toHaveLength(1);
			expect(context.stack[0]).toMatchObject({ isInteger: false, isFloat64: true });
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
						lineNumber: 1,
						instruction: 'call',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'foo64' }],
					} as AST[number],
					context
				);
			}).toThrowError();
		});

		it('throws on undefined function', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				call(
					{
						lineNumber: 1,
						instruction: 'call',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'missing' }],
					} as AST[number],
					context
				);
			}).toThrowError();
		});
	});
}
