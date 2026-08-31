import type { Stack, StackItem } from '@8f4e/language-spec';

function formatStackItem(item: StackItem): string {
	if (item.knownIntegerValue !== undefined) {
		return String(item.knownIntegerValue);
	}

	return item.kind === 'address' ? 'ptr' : item.valueType;
}

/** Formats compiler stack facts for the inside of the debugger widget's brackets. */
export function formatDebugStack(stack: Stack): string {
	return stack.map(formatStackItem).join(', ');
}
