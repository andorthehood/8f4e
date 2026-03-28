import normalizeConst from './const';
import normalizeDefault from './default';
import normalizeInit from './init';
import normalizeLocalVariableAccess from './localVariable';
import normalizeMap from './map';
import normalizeMemoryDeclaration from './memoryDeclaration';
import normalizePush from './push';

import { isMemoryDeclarationInstruction } from '../declarations';

import type { AST, CompilationContext } from '../../types';

const instructionNormalizers = {
	const: normalizeConst,
	default: normalizeDefault,
	init: normalizeInit,
	localGet: normalizeLocalVariableAccess,
	localSet: normalizeLocalVariableAccess,
	map: normalizeMap,
	push: normalizePush,
} as const;

export default function dispatchNormalization(line: AST[number], context: CompilationContext): AST[number] {
	const normalizer = instructionNormalizers[line.instruction as keyof typeof instructionNormalizers];
	if (normalizer) {
		return normalizer(line, context);
	}

	if (isMemoryDeclarationInstruction(line.instruction)) {
		return normalizeMemoryDeclaration(line, context);
	}

	return line;
}
