import { AST, Error } from './types';

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
}

export function getError(code: ErrorCode, line: Partial<AST[number]> = { lineNumber: 0 }): Error {
	switch (code) {
		case ErrorCode.INSUFFICIENT_OPERANDS:
			return {
				code,
				message: 'Insufficient number of elements in the stack for the operation to proceed.',
				line,
			};
		case ErrorCode.UNMATCHING_OPERANDS:
			return {
				code,
				message: 'This instruction can only operate on operands of the same type.',
				line,
			};
		case ErrorCode.ONLY_INTEGERS:
			return {
				code,
				message: 'The operation only accepts integer values as operands.',
				line,
			};
		case ErrorCode.MISSING_ARGUMENT:
			return {
				code,
				message: 'Missing argument.',
				line,
			};
		case ErrorCode.UNDECLARED_IDENTIFIER:
			return {
				code,
				message: 'Undeclared identifier.',
				line,
			};
		case ErrorCode.EXPECTED_IDENTIFIER:
			return {
				code,
				message: 'Expected identifier, got a value.',
				line,
			};
		case ErrorCode.EXPECTED_INTEGER_OPERAND:
			return {
				code,
				message: 'Expected one of the operands to be an integer value.',
				line,
			};
		case ErrorCode.UNRECOGNISED_INSTRUCTION:
			return {
				code,
				message: 'Unrecognised instruction.',
				line,
			};
		case ErrorCode.EXPECTED_VALUE:
			return {
				code,
				message: 'Expected value, got an identifier.',
				line,
			};
		case ErrorCode.MISSING_MODULE_ID:
			return {
				code,
				message: 'Missing module ID.',
				line,
			};
		case ErrorCode.EXPECTED_FLOAT_OPERAND:
			return {
				code,
				message: 'Expected one of the operands to be a floating point value.',
				line,
			};
		default:
			return {
				message: 'Unknown error',
				code,
				line,
			};
	}
}
