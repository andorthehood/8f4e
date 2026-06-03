import type { StackItem } from '@8f4e/compiler-spec';

/** Derives known integer and non-zero metadata when both operands are compile-time known. */
export function deriveKnownIntegerValue(
	operand1: StackItem,
	operand2: StackItem,
	operation: (operand1: number, operand2: number) => number | undefined
): Partial<StackItem> {
	if (operand1.knownIntegerValue === undefined || operand2.knownIntegerValue === undefined) {
		return {};
	}

	const knownIntegerValue = operation(operand1.knownIntegerValue, operand2.knownIntegerValue);

	if (knownIntegerValue === undefined) {
		return {};
	}

	return {
		knownIntegerValue,
		isNonZero: knownIntegerValue !== 0,
	};
}
