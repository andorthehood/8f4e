import { applyArrayDeclarationLine } from './applyArrayDeclarationLine';
import { applyScalarDeclarationLine } from './applyScalarDeclarationLine';

import type { AST } from '@8f4e/tokenizer';
import type { PublicMemoryLayoutContext } from '../internalTypes';

export function applyMemoryDeclarationLine(line: AST[number], context: PublicMemoryLayoutContext) {
	if (line.instruction.endsWith('[]')) {
		applyArrayDeclarationLine(line, context);
		return;
	}

	applyScalarDeclarationLine(line, context);
}
