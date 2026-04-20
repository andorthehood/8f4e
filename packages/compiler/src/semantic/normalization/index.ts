import normalizeCall from './call';
import normalizeDefault from './default';
import normalizeLocalVariableAccess from './localVariable';
import normalizeMap from './map';
import normalizePush from './push';

import type { AST, CompilationContext, NormalizedLine } from '../../types';

const instructionNormalizers = {
	call: normalizeCall,
	default: normalizeDefault,
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

	return line as NormalizedLine<TLine>;
}
