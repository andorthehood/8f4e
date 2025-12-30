import type { AST, CompilationContext, Error } from './types';

export enum ErrorCode {
	INSUFFICIENT_OPERANDS,
	UNMATCHING_OPERANDS,
	ONLY_INTEGERS,
	ONLY_FLOATS,
	MISSING_ARGUMENT,
	UNDECLARED_IDENTIFIER,
	EXPECTED_IDENTIFIER,
	UNRECOGNISED_INSTRUCTION,
	EXPECTED_VALUE,
	MISSING_MODULE_ID,
	UNKNOWN_ERROR,
	STACK_EXPECTED_ZERO_ELEMENTS,
	MISSING_BLOCK_START_INSTRUCTION,
	INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	DIVISION_BY_ZERO,
	MISSING_FUNCTION_ID,
	INVALID_FUNCTION_SIGNATURE,
	FUNCTION_SIGNATURE_OVERFLOW,
	STACK_MISMATCH_FUNCTION_RETURN,
	TYPE_MISMATCH,
	MEMORY_ACCESS_IN_PURE_FUNCTION,
	UNDEFINED_FUNCTION,
	PARAM_AFTER_FUNCTION_BODY,
	DUPLICATE_PARAMETER_NAME,
	INSTRUCTION_MUST_BE_TOP_LEVEL,
}

export function getError(code: ErrorCode, line: AST[number], context?: CompilationContext): Error {
	switch (code) {
		case ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK:
			return {
				code,
				message: 'This instruction can only be used within a block or a module. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.INSUFFICIENT_OPERANDS:
			return {
				code,
				message: 'Insufficient number of elements in the stack for the operation to proceed. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.UNMATCHING_OPERANDS:
			return {
				code,
				message: 'This instruction can only operate on operands of the same type. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.ONLY_INTEGERS:
			return {
				code,
				message: 'The operation only accepts integer values as operands. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.ONLY_FLOATS:
			return {
				code,
				message: 'The operation only accepts float values as operands. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.MISSING_ARGUMENT:
			return {
				code,
				message: 'Missing argument. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.UNDECLARED_IDENTIFIER:
			return {
				code,
				message: 'Undeclared identifier. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.EXPECTED_IDENTIFIER:
			return {
				code,
				message: 'Expected identifier, got a value. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.UNRECOGNISED_INSTRUCTION:
			return {
				code,
				message: 'Unrecognised instruction. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.EXPECTED_VALUE:
			return {
				code,
				message: 'Expected value, got an identifier. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.MISSING_MODULE_ID:
			return {
				code,
				message: 'Missing module ID. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.STACK_EXPECTED_ZERO_ELEMENTS:
			return {
				code,
				message:
					line.lineNumber +
					': Expected 0 elements on the stack, found ' +
					context?.stack.length +
					' [' +
					context?.stack.map(({ isInteger }) => (isInteger ? 'int' : 'float')).join(', ') +
					'] (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.MISSING_BLOCK_START_INSTRUCTION:
			return {
				code,
				message: 'Missing block start instruction. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.DIVISION_BY_ZERO:
			return {
				code,
				message: 'Possible division by zero. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.MISSING_FUNCTION_ID:
			return {
				code,
				message: 'Missing function ID. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.INVALID_FUNCTION_SIGNATURE:
			return {
				code,
				message: 'Invalid function signature. Parameters and returns must be "int" or "float". (' + code + ')',
				line,
				context,
			};
		case ErrorCode.FUNCTION_SIGNATURE_OVERFLOW:
			return {
				code,
				message: 'Function signature overflow. Maximum 8 parameters and 8 return values. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.STACK_MISMATCH_FUNCTION_RETURN:
			return {
				code,
				message: 'Stack elements do not match function return signature. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.TYPE_MISMATCH:
			return {
				code,
				message: 'Type mismatch. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.MEMORY_ACCESS_IN_PURE_FUNCTION:
			return {
				code,
				message: 'Memory access is not allowed in pure functions. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.UNDEFINED_FUNCTION:
			return {
				code,
				message: 'Undefined function. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.PARAM_AFTER_FUNCTION_BODY:
			return {
				code,
				message:
					'Parameter declarations must come immediately after the function declaration, before any other instructions or local variable declarations. (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.DUPLICATE_PARAMETER_NAME:
			return {
				code,
				message: 'Duplicate parameter name. Each parameter must have a unique name. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL:
			return {
				code,
				message: 'This instruction must be used at the top level. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.UNKNOWN_ERROR:
		default:
			return {
				message: 'Unknown error (' + code + ')',
				code,
				line,
				context,
			};
	}
}
