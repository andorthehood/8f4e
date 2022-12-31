import { AST, MemoryMap } from '../types';

export default function (line: AST[number], locals, memory: MemoryMap, consts: Record<string, number>) {
	if (!line.arguments[0] || !line.arguments[1]) {
		throw '1002: Missing argument';
	}

	return [];
}
