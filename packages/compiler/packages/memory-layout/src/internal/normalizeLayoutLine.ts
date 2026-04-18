import { normalizeConst } from './normalizeConst';
import { normalizeInit } from './normalizeInit';
import { normalizeMemoryDeclaration } from './normalizeMemoryDeclaration';

import type { PublicMemoryLayoutContext } from '../types';
import type { AST, ConstLine, InitLine } from '@8f4e/tokenizer';

export function normalizeLayoutLine(line: AST[number], context: PublicMemoryLayoutContext): AST[number] {
	if (line.instruction === 'const') {
		return normalizeConst(line as ConstLine, context);
	}
	if (line.instruction === 'init') {
		return normalizeInit(line as InitLine, context);
	}
	if (line.isMemoryDeclaration) {
		return normalizeMemoryDeclaration(line, context);
	}
	return line;
}
