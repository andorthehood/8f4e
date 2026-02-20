import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `param`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const param: InstructionCompiler = withValidation(
	{
		scope: 'function',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line, context) => {
		// Validate param comes immediately after function (before any non-param locals or bytecode)
		//
		// Parameters must be declared before any other function body code:
		// - Parameters are registered as locals at indices 0, 1, 2, etc. in order
		// - The 'local' instruction also registers locals but should come after all params
		// - Other instructions generate bytecode in byteCode
		//
		// We validate this by checking:
		// 1. localCount > paramCount: means a non-param local was declared (via 'local' instruction)
		// 2. byteCode.length > 0: means other instructions have already run
		//
		// If either is true, we're past the param declaration phase and should error.
		const paramCount = context.currentFunctionSignature?.parameters.length || 0;
		const localCount = Object.keys(context.namespace.locals).length;

		if (localCount > paramCount || context.byteCode.length > 0) {
			throw getError(ErrorCode.PARAM_AFTER_FUNCTION_BODY, line, context);
		}

		if (!line.arguments[0] || !line.arguments[1]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type !== ArgumentType.IDENTIFIER || line.arguments[1].type !== ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}

		const paramType = line.arguments[0].value;
		const paramName = line.arguments[1].value;

		if (paramType !== 'int' && paramType !== 'float' && paramType !== 'float64') {
			throw getError(ErrorCode.INVALID_FUNCTION_SIGNATURE, line, context);
		}

		// Check for duplicate parameter names
		if (context.namespace.locals[paramName] !== undefined) {
			throw getError(ErrorCode.DUPLICATE_PARAMETER_NAME, line, context);
		}

		// Register parameter as a local variable with the given name
		// Parameters get local indices starting from 0
		const paramIndex = Object.keys(context.namespace.locals).length;

		context.namespace.locals[paramName] = {
			isInteger: paramType === 'int',
			...(paramType === 'float64' ? { isFloat64: true } : {}),
			index: paramIndex,
		};

		// Add parameter type to the function signature being built
		context.currentFunctionSignature!.parameters.push(paramType);

		if (context.currentFunctionSignature!.parameters.length > 8) {
			throw getError(ErrorCode.FUNCTION_SIGNATURE_OVERFLOW, line, context);
		}

		return context;
	}
);

export default param;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('param instruction compiler', () => {
		it('registers a function parameter', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					...createInstructionCompilerTestContext().blockStack,
					{
						blockType: BLOCK_TYPE.FUNCTION,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
				currentFunctionSignature: { parameters: [], returns: [] },
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					locals: {},
				},
			});

			param(
				{
					lineNumber: 1,
					instruction: 'param',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'int' },
						{ type: ArgumentType.IDENTIFIER, value: 'value' },
					],
				} as AST[number],
				context
			);

			expect({
				locals: context.namespace.locals,
				currentFunctionSignature: context.currentFunctionSignature,
			}).toMatchSnapshot();
		});

		it('registers a float64 function parameter', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					...createInstructionCompilerTestContext().blockStack,
					{
						blockType: BLOCK_TYPE.FUNCTION,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
				currentFunctionSignature: { parameters: [], returns: [] },
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					locals: {},
				},
			});

			param(
				{
					lineNumber: 1,
					instruction: 'param',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'float64' },
						{ type: ArgumentType.IDENTIFIER, value: 'x' },
					],
				} as AST[number],
				context
			);

			expect({
				locals: context.namespace.locals,
				currentFunctionSignature: context.currentFunctionSignature,
			}).toMatchSnapshot();
		});

		it('throws when declared after locals', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					...createInstructionCompilerTestContext().blockStack,
					{
						blockType: BLOCK_TYPE.FUNCTION,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
				currentFunctionSignature: { parameters: [], returns: [] },
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					locals: { existing: { isInteger: true, index: 0 } },
				},
			});

			expect(() => {
				param(
					{
						lineNumber: 1,
						instruction: 'param',
						arguments: [
							{ type: ArgumentType.IDENTIFIER, value: 'int' },
							{ type: ArgumentType.IDENTIFIER, value: 'late' },
						],
					} as AST[number],
					context
				);
			}).toThrowError();
		});
	});
}
