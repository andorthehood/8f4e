/**
 * Compiler (semantic) errors — raised after syntax is already valid.
 *
 * Use this module for errors that require semantic analysis or compiler state:
 *   - undeclared or duplicate identifiers
 *   - type mismatches
 *   - invalid instruction in the current scope
 *   - stack mismatches or overflows
 *   - illegal memory access in pure functions
 *   - constant resolution failures
 *   - any error that cannot be detected from token/argument shape alone
 *
 * Boundary rule:
 *   If detecting the error requires symbol resolution, scope validation, stack
 *   state, type checking, or runtime-model knowledge → it belongs here.
 *   If the error can be detected from the raw token or argument structure alone,
 *   before any semantic context is built → use SyntaxRulesError in syntaxError.ts.
 */

import type { AST, CompilationContext, CompilerStageError } from './types';

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
	DUPLICATE_MACRO_NAME,
	MISSING_MACRO_END,
	UNDEFINED_MACRO,
	NESTED_MACRO_DEFINITION,
	NESTED_MACRO_CALL,
	COMPILER_DIRECTIVE_INVALID_CONTEXT,
	MIXED_FLOAT_WIDTH,
	INSTRUCTION_NOT_ALLOWED_IN_BLOCK,
	SPLIT_HEX_TOO_MANY_BYTES,
	SPLIT_HEX_MIXED_TOKENS,
	CONSTANT_NAME_AS_MEMORY_IDENTIFIER,
	RESERVED_MEMORY_IDENTIFIER,
	SPLIT_BYTE_CONSTANT_OUT_OF_RANGE,
	POINTEE_WORD_SIZE_ON_NON_POINTER,
	POINTEE_ELEMENT_MAX_ON_NON_POINTER,
	RETURN_OUTSIDE_FUNCTION,
	LOCAL_NAME_COLLISION_WITH_MEMORY,
	DUPLICATE_IDENTIFIER,
}

interface ErrorDetails {
	identifier?: string;
}

export function getError(
	code: ErrorCode,
	line: AST[number],
	context?: CompilationContext,
	details?: ErrorDetails
): CompilerStageError {
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
				message: 'Undeclared identifier' + (details?.identifier ? `: ${details.identifier}` : '') + '. (' + code + ')',
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
					line.lineNumberBeforeMacroExpansion +
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
				message:
					'Invalid function signature. Parameters and returns must be "int", "float", or "float64". (' + code + ')',
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
		case ErrorCode.DUPLICATE_MACRO_NAME:
			return {
				code,
				message: 'Duplicate macro name. Each macro must have a unique name. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.MISSING_MACRO_END:
			return {
				code,
				message: 'Missing defineMacroEnd. Each defineMacro must be closed with defineMacroEnd. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.UNDEFINED_MACRO:
			return {
				code,
				message: 'Undefined macro. The macro referenced has not been defined. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.NESTED_MACRO_DEFINITION:
			return {
				code,
				message: 'Nested macro definitions are not allowed. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.NESTED_MACRO_CALL:
			return {
				code,
				message: 'Macro calls inside macro definitions are not allowed. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT:
			return {
				code,
				message: 'This compiler directive can only be used within a module block. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.MIXED_FLOAT_WIDTH:
			return {
				code,
				message:
					'Mixed float widths: arithmetic operations require all float operands to have the same width (float32 or float64). (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK:
			return {
				code,
				message: 'This instruction is not allowed inside this block type. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.SPLIT_HEX_TOO_MANY_BYTES:
			return {
				code,
				message: 'Too many split-byte values for this declaration type. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.SPLIT_HEX_MIXED_TOKENS:
			return {
				code,
				message:
					'Split-byte default values must consist entirely of byte-resolving tokens: integer literals (0–255), literal-only * or / expressions that fold to an integer in that range, or constant-style identifiers. Memory references and non-byte-resolving forms are not allowed in split-byte sequences. (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER:
			return {
				code,
				message:
					'Constant-style identifiers (all-uppercase) are reserved for constants and cannot be used as memory allocation names. (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.RESERVED_MEMORY_IDENTIFIER:
			return {
				code,
				message:
					'Reserved identifier cannot be used as a memory allocation name' +
					(details?.identifier ? `: ${details.identifier}` : '') +
					'. (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.SPLIT_BYTE_CONSTANT_OUT_OF_RANGE:
			return {
				code,
				message: 'Constants used in split-byte mode must resolve to an integer in the range 0–255. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.POINTEE_WORD_SIZE_ON_NON_POINTER:
			return {
				code,
				message:
					'%*name can only be used with pointer-typed memory identifiers. ' +
					(details?.identifier ? `"${details.identifier}" is not a pointer. ` : '') +
					'(' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.POINTEE_ELEMENT_MAX_ON_NON_POINTER:
			return {
				code,
				message:
					'^*name can only be used with pointer-typed memory identifiers. ' +
					(details?.identifier ? `"${details.identifier}" is not a pointer. ` : '') +
					'(' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.RETURN_OUTSIDE_FUNCTION:
			return {
				code,
				message: 'earlyReturn can only be used inside a function, not in a module. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.LOCAL_NAME_COLLISION_WITH_MEMORY:
			return {
				code,
				message:
					'Local variable name collides with a memory declaration' +
					(details?.identifier ? `: ${details.identifier}` : '') +
					'. Local names must be unique within the namespace. (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.DUPLICATE_IDENTIFIER:
			return {
				code,
				message:
					'Duplicate identifier' +
					(details?.identifier ? `: ${details.identifier}` : '') +
					'. Module and function IDs must be unique. (' +
					code +
					')',
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
