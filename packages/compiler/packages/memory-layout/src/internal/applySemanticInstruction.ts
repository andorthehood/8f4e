import { semanticConst } from './semanticConst';
import { semanticConstants } from './semanticConstants';
import { semanticConstantsEnd } from './semanticConstantsEnd';
import { semanticInit } from './semanticInit';
import { semanticModule } from './semanticModule';
import { semanticModuleEnd } from './semanticModuleEnd';
import { semanticUse } from './semanticUse';

import type { PublicMemoryLayoutContext } from '../types';
import type {
	AST,
	ConstLine,
	ConstantsEndLine,
	ConstantsLine,
	InitLine,
	ModuleEndLine,
	ModuleLine,
	UseLine,
} from '@8f4e/tokenizer';

export function applySemanticInstruction(line: AST[number], context: PublicMemoryLayoutContext) {
	switch (line.instruction) {
		case 'const':
			semanticConst(line as ConstLine, context);
			return;
		case 'use':
			semanticUse(line as UseLine, context);
			return;
		case 'init':
			semanticInit(line as InitLine, context);
			return;
		case 'module':
			semanticModule(line as ModuleLine, context);
			return;
		case 'constants':
			semanticConstants(line as ConstantsLine, context);
			return;
		case 'moduleEnd':
			semanticModuleEnd(line as ModuleEndLine, context);
			return;
		case 'constantsEnd':
			semanticConstantsEnd(line as ConstantsEndLine, context);
	}
}
