import { AST, BlockStack, Error, Namespace, Stack } from './types';

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
	STACK_EXPECTED_ZERO_ELEMENTS,
	MISSING_BLOCK_START_INSTRUCTION,
}

export function getError(
	code: ErrorCode,
	line: AST[number],
	namespace: Namespace,
	stack: Stack,
	blockStack: BlockStack
): Error {
	switch (code) {
		case ErrorCode.INSUFFICIENT_OPERANDS:
			return {
				code,
				message: 'Insufficient number of elements in the stack for the operation to proceed.',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.UNMATCHING_OPERANDS:
			return {
				code,
				message: 'This instruction can only operate on operands of the same type.',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.ONLY_INTEGERS:
			return {
				code,
				message: 'The operation only accepts integer values as operands.',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.MISSING_ARGUMENT:
			return {
				code,
				message: 'Missing argument.',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.UNDECLARED_IDENTIFIER:
			return {
				code,
				message: 'Undeclared identifier.',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.EXPECTED_IDENTIFIER:
			return {
				code,
				message: 'Expected identifier, got a value.',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.EXPECTED_INTEGER_OPERAND:
			return {
				code,
				message: 'Expected one of the operands to be an integer value.',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.UNRECOGNISED_INSTRUCTION:
			return {
				code,
				message: 'Unrecognised instruction.',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.EXPECTED_VALUE:
			return {
				code,
				message: 'Expected value, got an identifier.',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.MISSING_MODULE_ID:
			return {
				code,
				message: 'Missing module ID.',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.EXPECTED_FLOAT_OPERAND:
			return {
				code,
				message: 'Expected one of the operands to be a floating point value.',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.STACK_EXPECTED_ZERO_ELEMENTS:
			return {
				code,
				message:
					line.lineNumber +
					': Expected 0 elements on the stack, found ' +
					stack.length +
					' [' +
					stack.map(({ isInteger }) => (isInteger ? 'int' : 'float')).join(', ') +
					']',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.MISSING_BLOCK_START_INSTRUCTION:
			return {
				code,
				message: 'Missing block start instruction.',
				line,
				namespace,
				stack,
				blockStack,
			};
		case ErrorCode.UNKNOWN_ERROR:
		default:
			return {
				message: 'Unknown error',
				code,
				line,
				namespace,
				stack,
				blockStack,
			};
	}
}
