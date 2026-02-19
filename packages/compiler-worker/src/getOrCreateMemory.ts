import { CompiledModuleLookup } from '@8f4e/compiler';

import didProgramOrMemoryStructureChange from './didProgramOrMemoryStructureChange';

import type { GetOrCreateMemoryResult, MemoryAction } from './types';

let memoryRefCache: WebAssembly.Memory | null = null;
let currentMemorySize = 0;
const WASM_PAGE_SIZE = 65536;

export default function getOrCreateMemory(
	memorySizeBytes: number,
	compiledModules: CompiledModuleLookup,
	previousCompiledModules?: CompiledModuleLookup
): GetOrCreateMemoryResult {
	const memoryStructureChanged = didProgramOrMemoryStructureChange(compiledModules, previousCompiledModules);
	const memorySizeChange = currentMemorySize !== memorySizeBytes;
	const shouldRecreate = !memoryRefCache || memoryStructureChanged || memorySizeChange;
	let memoryAction: MemoryAction;

	if (shouldRecreate) {
		const prevBytes = currentMemorySize;
		// Round up requested bytes to whole wasm pages (64 KiB); WebAssembly.Memory is page-granular.
		const pages = Math.ceil(memorySizeBytes / WASM_PAGE_SIZE);

		memoryRefCache = new WebAssembly.Memory({
			initial: pages,
			maximum: pages,
			shared: true,
		});
		currentMemorySize = memorySizeBytes;

		// Determine the reason for recreation
		if (prevBytes === 0) {
			memoryAction = { action: 'recreated', reason: { kind: 'no-instance' } };
		} else if (memorySizeChange) {
			memoryAction = {
				action: 'recreated',
				reason: { kind: 'memory-size-changed', prevBytes, nextBytes: memorySizeBytes },
			};
		} else {
			// memoryStructureChanged must be true
			memoryAction = { action: 'recreated', reason: { kind: 'memory-structure-changed' } };
		}
	} else {
		// Memory is being reused
		memoryAction = { action: 'reused' };
	}

	return { memoryRef: memoryRefCache!, memoryAction };
}
