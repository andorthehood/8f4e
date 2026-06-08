/**
 * Compiler (semantic) errors — raised after syntax is already valid.
 *
 * Use this module for errors that require semantic analysis or compiler state:
 *  - undeclared or duplicate identifiers
 *  - type mismatches
 *  - invalid instruction in the current scope
 *  - stack mismatches or overflows
 *  - function memory declarations or memory IO without the required directive
 *  - constant resolution failures
 *  - any error that cannot be detected from token/argument shape alone
 *
 * Boundary rule:
 *  If detecting the error requires symbol resolution, scope validation, stack
 *  state, type checking, or runtime-model knowledge → it belongs here.
 *  If the error can be detected from the raw token or argument structure alone,
 *  before any semantic context is built → use SyntaxRulesError in syntaxError.ts.
 */

import type {
	CodegenContext,
	CompilationContext,
	CompilerASTLine,
	CompilerDiagnosticContext,
	CompilerStageError,
	ErrorCodeValue,
} from '@8f4e/compiler-spec';
import {
	ErrorCode,
	MAX_FUNCTION_PARAMETERS,
	MAX_FUNCTION_RETURN_VALUES,
	SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS,
} from '@8f4e/compiler-spec';

export { ErrorCode };

interface ErrorDetails {
	identifier?: string;
}

/**
 * Creates a compiler-stage diagnostic for a semantic or code-generation error.
 *
 * @param code - Compiler error code to materialize.
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @param details - Optional dynamic details to include in the diagnostic.
 * @returns The compiler error instance.
 */
export function getError(
	code: ErrorCodeValue,
	line: CompilerASTLine,
	context?: CodegenContext | CompilationContext | CompilerDiagnosticContext,
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
		case ErrorCode.INSTRUCTION_INVALID_OUTSIDE_LOOP:
			return {
				code,
				message: 'This instruction can only be used within a loop. (' + code + ')',
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
		case ErrorCode.EXPECTED_VALUE:
			return {
				code,
				message: 'Expected value, got an identifier. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.ADDRESS_RANGE_REQUIRED:
			return {
				code,
				message: 'This instruction requires address range metadata. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.INVALID_ACCESS_WIDTH:
			return {
				code,
				message: `Access width must be ${SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS.join(', ')} bytes. (${code})`,
				line,
				context,
			};
		case ErrorCode.ADDRESS_RANGE_TOO_SMALL:
			return {
				code,
				message: 'Access width is larger than the address range. (' + code + ')',
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
		case ErrorCode.STACK_EXPECTED_ZERO_ELEMENTS: {
			const stack = context && 'stack' in context && Array.isArray(context.stack) ? context.stack : [];
			return {
				code,
				message:
					line.lineNumber +
					': Expected 0 elements on the stack, found ' +
					stack.length +
					' [' +
					stack.map(item => (item.kind === 'address' ? 'address' : item.valueType)).join(', ') +
					'] (' +
					code +
					')',
				line,
				context,
			};
		}
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
		case ErrorCode.MISSING_PROTOTYPE_ID:
			return {
				code,
				message: 'Missing prototype ID. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.PARAM_SHAPE_UNSUPPORTED_POINTER_DEPTH:
			return {
				code,
				message:
					'paramShape cannot expand this prototype declaration because the resulting pointer parameter type is unsupported. (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.PUSH_SHAPE_REQUIRES_MODULE_SHAPE:
			return {
				code,
				message: 'pushShape requires the current module to declare the requested shape. (' + code + ')',
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
				message:
					'Function signature overflow. Maximum ' +
					MAX_FUNCTION_PARAMETERS +
					' parameters and ' +
					MAX_FUNCTION_RETURN_VALUES +
					' return values. (' +
					code +
					')',
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
				message: 'Memory declarations are not allowed in functions. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.IMPURE_DIRECTIVE_REQUIRED_FOR_MEMORY_IO:
			return {
				code,
				message: 'Memory IO in functions requires #impure. (' + code + ')',
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
		case ErrorCode.IMPURE_DIRECTIVE_INVALID_CONTEXT:
			return {
				code,
				message: '#impure can only be used within a function block. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.EXPORT_DIRECTIVE_INVALID_CONTEXT:
			return {
				code,
				message: '#export can only be used within a function block. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.IMPORT_DIRECTIVE_INVALID_CONTEXT:
			return {
				code,
				message: '#import can only be used within a function block. (' + code + ')',
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
		case ErrorCode.EXIT_IF_TRUE_OUTSIDE_MODULE:
			return {
				code,
				message: 'exitIfTrue can only be used inside a module, not in a function. (' + code + ')',
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
					'. Module and function names must be unique. (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.DUPLICATE_EXPORT_NAME:
			return {
				code,
				message:
					'Duplicate function export name' +
					(details?.identifier ? `: ${details.identifier}` : '') +
					'. Exported function names must be unique and must not reuse built-in export names. (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.DUPLICATE_FUNCTION_IMPORT:
			return {
				code,
				message: 'Duplicate function import directive. Imported functions can only declare one #import. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.IMPORT_EXPORT_CONFLICT:
			return {
				code,
				message: 'Imported functions cannot also be exported. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.IMPORTED_FUNCTION_BODY:
			return {
				code,
				message:
					'Imported functions cannot have a function body. Only function directives, param declarations, and functionEnd are allowed. (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.INVALID_MEMORY_REGION_NAME:
			return {
				code,
				message:
					'Invalid memory region name' +
					(details?.identifier ? `: ${details.identifier}` : '') +
					'. Custom memory region names must be unique non-numeric identifiers and cannot be "default" or "memory". (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.DUPLICATE_MEMORY_REGION_NAME:
			return {
				code,
				message:
					'Duplicate memory region name' + (details?.identifier ? `: ${details.identifier}` : '') + '. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.UNKNOWN_MEMORY_REGION:
			return {
				code,
				message: 'Unknown memory region' + (details?.identifier ? `: ${details.identifier}` : '') + '. (' + code + ')',
				line,
				context,
			};
		case ErrorCode.MEMORY_REGION_INDEX_OUT_OF_BOUNDS:
			return {
				code,
				message:
					'Memory region index is out of bounds' +
					(details?.identifier ? `: ${details.identifier}` : '') +
					'. (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.POINTER_DEREFERENCE_DEPTH_EXCEEDED:
			return {
				code,
				message:
					'Pointer dereference depth exceeds the declared pointer depth' +
					(details?.identifier ? `: ${details.identifier}` : '') +
					'. (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.POINTEE_ELEMENT_COUNT_UNKNOWN:
			return {
				code,
				message:
					'Pointee element count is unknown' +
					(details?.identifier ? `: ${details.identifier}` : '') +
					'. Pass the length explicitly or use count() on a named memory declaration. (' +
					code +
					')',
				line,
				context,
			};
		case ErrorCode.ARRAY_INITIALIZER_TOO_LONG:
			return {
				code,
				message: 'Array initializer contains more values than the declared element count. (' + code + ')',
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
