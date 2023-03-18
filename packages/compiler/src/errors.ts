import { AST, Error, Namespace, Stack } from './types';

export enum ErrorCode {
	INSUFFICIENT_OPERANDS,
	UNMATCHING_OPERANDS,
	ONLY_INTEGERS,
	MISSING_ARGUMENT,
	UNDECLARED_IDENTIFIER,
	EXPECTED_IDENTIFIER,
	EXPECTED_INTEGER_OPERAND,
	UNRECOGNISED_INSTRUCTION,
	EXPECTED_VALUE,
	MISSING_MODULE_ID,
	EXPECTED_FLOAT_OPERAND,
	UNKNOWN_ERROR,
}

export function getError(code: ErrorCode, line: AST[number], namespace: Namespace, stack: Stack): Error {
	switch (code) {
		case ErrorCode.INSUFFICIENT_OPERANDS:
			return {
				code,
				message: 'Insufficient number of elements in the stack for the operation to proceed.',
				line,
				namespace,
				stack,
			};
		case ErrorCode.UNMATCHING_OPERANDS:
			return {
				code,
				message: 'This instruction can only operate on operands of the same type.',
				line,
				namespace,
				stack,
			};
		case ErrorCode.ONLY_INTEGERS:
			return {
				code,
				message: 'The operation only accepts integer values as operands.',
				line,
				namespace,
				stack,
			};
		case ErrorCode.MISSING_ARGUMENT:
			return {
				code,
				message: 'Missing argument.',
				line,
				namespace,
				stack,
			};
		case ErrorCode.UNDECLARED_IDENTIFIER:
			return {
				code,
				message: 'Undeclared identifier.',
				line,
				namespace,
				stack,
			};
		case ErrorCode.EXPECTED_IDENTIFIER:
			return {
				code,
				message: 'Expected identifier, got a value.',
				line,
				namespace,
				stack,
			};
		case ErrorCode.EXPECTED_INTEGER_OPERAND:
			return {
				code,
				message: 'Expected one of the operands to be an integer value.',
				line,
				namespace,
				stack,
			};
		case ErrorCode.UNRECOGNISED_INSTRUCTION:
			return {
				code,
				message: 'Unrecognised instruction.',
				line,
				namespace,
				stack,
			};
		case ErrorCode.EXPECTED_VALUE:
			return {
				code,
				message: 'Expected value, got an identifier.',
				line,
				namespace,
				stack,
			};
		case ErrorCode.MISSING_MODULE_ID:
			return {
				code,
				message: 'Missing module ID.',
				line,
				namespace,
				stack,
			};
		case ErrorCode.EXPECTED_FLOAT_OPERAND:
			return {
				code,
				message: 'Expected one of the operands to be a floating point value.',
				line,
				namespace,
				stack,
			};
		case ErrorCode.UNKNOWN_ERROR:
		default:
			return {
				message: 'Unknown error',
				code,
				line,
				namespace,
				stack,
			};
	}
}
