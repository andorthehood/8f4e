import normalizeCall from './call';
import normalizeConst from './const';
import normalizeDefault from './default';
import normalizeInit from './init';
import normalizeLocalVariableAccess from './localVariable';
import normalizeMap from './map';
import normalizeMemoryDeclaration from './memoryDeclaration';
import normalizePush from './push';

import type { AST, CompilationContext, NormalizedLine } from '../../types';

const instructionNormalizers = {
	call: normalizeCall,
	const: normalizeConst,
	default: normalizeDefault,
	init: normalizeInit,
	localSet: normalizeLocalVariableAccess,
	map: normalizeMap,
	push: normalizePush,
} as const;

export default function dispatchNormalization<TLine extends AST[number]>(
	line: TLine,
	context: CompilationContext
): NormalizedLine<TLine> {
	const normalizer = instructionNormalizers[line.instruction as keyof typeof instructionNormalizers];
	if (normalizer) {
		return normalizer(line as never, context) as NormalizedLine<TLine>;
	}

	if (line.isMemoryDeclaration) {
		return normalizeMemoryDeclaration(line as never, context) as NormalizedLine<TLine>;
	}

	return line as NormalizedLine<TLine>;
}
