import type { OperandRule } from '@8f4e/compiler-spec';
import { ErrorCode, type ErrorCodeValue } from '@8f4e/compiler-spec';

/** Maps an operand rule from the compiler spec to the semantic error emitted when it fails. */
export function inferErrorCodeFromRule(rule: OperandRule | OperandRule[]): ErrorCodeValue {
	if (Array.isArray(rule)) {
		return ErrorCode.TYPE_MISMATCH;
	} else if (rule === 'int') {
		return ErrorCode.ONLY_INTEGERS;
	} else if (rule === 'float') {
		return ErrorCode.ONLY_FLOATS;
	} else if (rule === 'matching') {
		return ErrorCode.UNMATCHING_OPERANDS;
	}
	throw new Error(`Unexpected operand rule: ${rule}`);
}
