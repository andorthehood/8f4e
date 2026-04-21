import semanticConst from './const';
import semanticUse from './use';
import semanticInit from './init';
import semanticFollow from './follow';
import semanticModule from './module';
import semanticConstants from './constants';
import semanticModuleEnd from './moduleEnd';
import semanticConstantsEnd from './constantsEnd';

import type { CompilationContext, NormalizedSemanticInstructionLine } from '../../types';

export default function applySemanticInstruction(line: NormalizedSemanticInstructionLine, context: CompilationContext) {
	switch (line.instruction) {
		case 'const':
			semanticConst(line, context);
			return;
		case 'use':
			semanticUse(line, context);
			return;
		case 'init':
			semanticInit(line, context);
			return;
		case '#follow':
			semanticFollow(line, context);
			return;
		case 'module':
			semanticModule(line, context);
			return;
		case 'constants':
			semanticConstants(line, context);
			return;
		case 'moduleEnd':
			semanticModuleEnd(line, context);
			return;
		case 'constantsEnd':
			semanticConstantsEnd(line, context);
	}
}
