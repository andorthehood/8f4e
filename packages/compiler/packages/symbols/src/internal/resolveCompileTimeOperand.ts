import { ArgumentType, type CompileTimeOperand } from '@8f4e/tokenizer';

import type { Const, SymbolResolutionContext } from '../types';

export function resolveCompileTimeOperand(
	operand: CompileTimeOperand,
	context: SymbolResolutionContext
): Const | undefined {
	const { namespace } = context;
	if (operand.type === ArgumentType.LITERAL) {
		return {
			value: operand.value,
			isInteger: operand.isInteger,
			...(operand.isFloat64 ? { isFloat64: true } : {}),
		};
	}

	if (operand.referenceKind === 'constant' || operand.referenceKind === 'plain') {
		return namespace.consts[operand.value];
	}

	return undefined;
}
