import type { CompilationContext, CompilerASTLine, FunctionValueType, Stack } from '@8f4e/compiler-spec';
import { ErrorCode, MAX_FUNCTION_RETURN_VALUES } from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
import { stackItemMatchesFunctionValueType } from '../../utils/functionValueType';
import { consume } from './stack';

/**
 * Consumes and validates function return values against the parsed function signature.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Stack-analysis result for the function end instruction.
 */
export function analyzeFunctionEnd(line: CompilerASTLine, context: CompilationContext): Stack {
	const returnTypes = line.arguments.map(arg => ('value' in arg ? (arg.value as FunctionValueType) : undefined));

	if (returnTypes.length > MAX_FUNCTION_RETURN_VALUES) {
		throw getError(ErrorCode.FUNCTION_SIGNATURE_OVERFLOW, line, context);
	}

	if (context.stack.length !== returnTypes.length) {
		throw getError(ErrorCode.STACK_MISMATCH_FUNCTION_RETURN, line, context);
	}

	for (let i = 0; i < returnTypes.length; i++) {
		const stackItem = context.stack[context.stack.length - returnTypes.length + i];
		const returnType = returnTypes[i];
		if (!returnType || !stackItemMatchesFunctionValueType(stackItem, returnType)) {
			throw getError(ErrorCode.STACK_MISMATCH_FUNCTION_RETURN, line, context);
		}
	}

	return consume(context, returnTypes.length);
}
