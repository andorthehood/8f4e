import { type CompilationContext, ErrorCode, type NormalizedSemanticInstructionLine } from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
import semanticConst from './const';
import semanticConstants from './constants';
import semanticConstantsEnd from './constantsEnd';
import semanticModule from './module';
import semanticModuleEnd from './moduleEnd';
import semanticRegion from './region';
import semanticShape from './shape';
import semanticUse from './use';

export default function applySemanticInstruction(line: NormalizedSemanticInstructionLine, context: CompilationContext) {
	switch (line.instruction) {
		case 'const':
			semanticConst(line, context);
			return;
		case 'use':
			semanticUse(line, context);
			return;
		case 'module':
			semanticModule(line, context);
			return;
		case '#region':
			semanticRegion(line, context);
			return;
		case 'constants':
			semanticConstants(line, context);
			return;
		case 'moduleEnd':
			semanticModuleEnd(line, context);
			return;
		case 'constantsEnd':
			semanticConstantsEnd(line, context);
			return;
		case 'prototype':
		case 'prototypeEnd':
			throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, line, context);
		case 'shape':
			semanticShape(line, context);
			return;
	}
}
