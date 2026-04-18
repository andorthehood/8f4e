import { ArgumentType, type AST } from '@8f4e/tokenizer';

import { collectNamespacesFromASTs } from './collectNamespacesFromASTs';
import { GLOBAL_ALIGNMENT_BOUNDARY, type CompiledFunctionLookup, type PublicMemoryLayout } from './types';

export function createPublicMemoryLayoutFromASTs(
	asts: AST[],
	options: {
		startingByteAddress?: number;
		compiledFunctions?: CompiledFunctionLookup;
		layoutAsts?: AST[];
	} = {}
): PublicMemoryLayout {
	const startingByteAddress = options.startingByteAddress ?? GLOBAL_ALIGNMENT_BOUNDARY;
	const layoutAsts = options.layoutAsts ?? asts;
	const namespaces = collectNamespacesFromASTs(asts, startingByteAddress, options.compiledFunctions, layoutAsts);
	const modules = Object.fromEntries(
		layoutAsts.flatMap((ast, index) => {
			const moduleLine = ast.find(line => line.instruction === 'module');
			if (!moduleLine || moduleLine.arguments[0]?.type !== ArgumentType.IDENTIFIER) {
				return [];
			}

			const id = moduleLine.arguments[0].value;
			const namespace = namespaces[id];
			if (!namespace || namespace.kind !== 'module') {
				return [];
			}

			return [
				[
					id,
					{
						index,
						id,
						byteAddress: namespace.byteAddress ?? startingByteAddress,
						wordAlignedAddress: (namespace.byteAddress ?? startingByteAddress) / GLOBAL_ALIGNMENT_BOUNDARY,
						wordAlignedSize: namespace.wordAlignedSize ?? 0,
						memoryMap: namespace.memory ?? {},
					},
				],
			];
		})
	);
	const requiredPublicMemoryBytes = Object.values(namespaces).reduce((max, namespace) => {
		const byteAddress = namespace.byteAddress ?? 0;
		const wordAlignedSize = namespace.wordAlignedSize ?? 0;
		return Math.max(max, byteAddress + wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY);
	}, 0);

	return {
		modules,
		namespaces,
		requiredPublicMemoryBytes,
	};
}
