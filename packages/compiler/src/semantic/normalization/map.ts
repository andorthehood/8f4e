import { normalizeMapLine } from './helpers';

import { type CompilationContext, type MapLine, type NormalizedMapLine } from '../../types';

export default function normalizeMap(line: MapLine, context: CompilationContext): NormalizedMapLine | MapLine {
	return normalizeMapLine(line, context);
}
