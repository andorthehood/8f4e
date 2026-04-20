import { normalizeInit } from './normalizeInit';
import { normalizeMemoryDeclaration } from './normalizeMemoryDeclaration';

import type { AST, InitLine } from '@8f4e/tokenizer';
import type { PublicMemoryLayoutContext } from '../internalTypes';

export function normalizeLayoutLine(line: AST[number], context: PublicMemoryLayoutContext): AST[number] {
	if (line.instruction === 'init') {
		return normalizeInit(line as InitLine, context);
	}
	if (line.isMemoryDeclaration) {
		return normalizeMemoryDeclaration(line, context);
	}
	return line;
}
