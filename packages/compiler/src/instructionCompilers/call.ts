import { call as wasmCall } from '@8f4e/compiler-wasm-utils';

import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { functionValueTypeToStackItem, stackItemMatchesFunctionValueType } from '../utils/functionValueType';
import { withValidation } from '../withValidation';

import type { CallLine, InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `call`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const call: InstructionCompiler<CallLine> = withValidation<CallLine>(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line: CallLine, context) => {
		// Normalization (normalizeCall) guarantees the function exists before codegen runs.
		const targetFunction = context.namespace.functions![line.arguments[0].value]!;

		// Validate stack has the right arguments
		const { parameters, returns } = targetFunction.signature;
		if (context.stack.length < parameters.length) {
			throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
		}

		// Check parameter types match
		for (let i = 0; i < parameters.length; i++) {
			const stackIndex = context.stack.length - parameters.length + i;
			const stackItem = context.stack[stackIndex];
			if (!stackItemMatchesFunctionValueType(stackItem, parameters[i])) {
				throw getError(ErrorCode.TYPE_MISMATCH, line, context);
			}
		}

		// Pop arguments from stack
		context.stack.splice(context.stack.length - parameters.length, parameters.length);

		// Push return values onto stack
		returns.forEach(returnType => {
			context.stack.push(functionValueTypeToStackItem(returnType));
		});

		// Emit WASM call instruction
		if (targetFunction.wasmIndex !== undefined) {
			saveByteCode(context, wasmCall(targetFunction.wasmIndex));
		}

		return context;
	}
);

export default call;
