import { SyntaxErrorCode, SyntaxRulesError } from '../syntaxError';

/** Reads the target memory id and dereference depth from a memory-pointer identifier token. */
export function getMemoryPointerTarget(value: string): { targetMemoryId: string; dereferenceDepth: number } {
	const dereferenceDepth = getLeadingPointerDepth(value);
	if (dereferenceDepth > 2) {
		throw new SyntaxRulesError(SyntaxErrorCode.INVALID_POINTER_DEPTH);
	}

	const targetMemoryId = value.slice(dereferenceDepth);
	if (targetMemoryId.trim().length === 0) {
		throw new SyntaxRulesError(SyntaxErrorCode.INVALID_IDENTIFIER, `Memory pointer target is missing: ${value}`);
	}

	return { targetMemoryId, dereferenceDepth };
}

function getLeadingPointerDepth(value: string): number {
	let pointerDepth = 0;
	while (value[pointerDepth] === '*') {
		pointerDepth++;
	}
	return pointerDepth;
}
