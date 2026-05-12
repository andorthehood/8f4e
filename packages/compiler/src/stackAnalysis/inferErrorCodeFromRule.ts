import { ErrorCode, type ErrorCode as ErrorCodeType } from '@8f4e/compiler-spec';

import type { OperandRule } from '@8f4e/compiler-spec';

export function inferErrorCodeFromRule(rule: OperandRule | OperandRule[]): ErrorCodeType {
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
