import {
	createPublicMemoryPassResultFromASTs,
	type CreatePublicMemoryPassResultFromASTsOptions,
} from './createPublicMemoryPassResultFromASTs';
import { GLOBAL_ALIGNMENT_BOUNDARY, type MemoryMap, type PublicMemoryLayout } from './types';

import type { AST } from '@8f4e/tokenizer';

export function createPublicMemoryLayoutFromASTs(
	asts: AST[],
	options: CreatePublicMemoryPassResultFromASTsOptions = {}
): PublicMemoryLayout {
	const publicMemoryPassResult = createPublicMemoryPassResultFromASTs(asts, options);
	const modules = Object.fromEntries(
		Object.entries(publicMemoryPassResult.modules).map(([id, module], index) => [
			id,
			{
				index,
				id,
				byteAddress: module.byteAddress,
				wordAlignedAddress: module.byteAddress / GLOBAL_ALIGNMENT_BOUNDARY,
				wordAlignedSize: module.wordAlignedSize,
				memoryMap: module.memory as MemoryMap,
			},
		])
	);
	return {
		modules,
		requiredPublicMemoryBytes: publicMemoryPassResult.requiredPublicMemoryBytes,
	};
}
