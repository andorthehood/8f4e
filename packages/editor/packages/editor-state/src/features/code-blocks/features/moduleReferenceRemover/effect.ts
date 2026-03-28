import { getModuleId } from '@8f4e/tokenizer';
import { StateManager } from '@8f4e/state-manager';

import { removeInterModuleReferences } from '../../utils/removeInterModuleReferences';

import type { State } from '~/types';

function collectModuleIdsByCreationIndex(state: State): Map<number, string> {
	const moduleIds = new Map<number, string>();

	for (const codeBlock of state.graphicHelper.codeBlocks) {
		if (codeBlock.blockType !== 'module') {
			continue;
		}

		const moduleId = getModuleId(codeBlock.code);
		if (!moduleId) {
			continue;
		}

		moduleIds.set(codeBlock.creationIndex, moduleId);
	}

	return moduleIds;
}

export default function moduleReferenceRemover(store: StateManager<State>): void {
	const state = store.getState();
	let previousModuleIdsByCreationIndex = collectModuleIdsByCreationIndex(state);

	function onCodeBlocksChanged(): void {
		const nextModuleIdsByCreationIndex = collectModuleIdsByCreationIndex(state);
		const removedModuleIds = new Set<string>();

		for (const [creationIndex, moduleId] of previousModuleIdsByCreationIndex.entries()) {
			if (!nextModuleIdsByCreationIndex.has(creationIndex)) {
				removedModuleIds.add(moduleId);
			}
		}

		previousModuleIdsByCreationIndex = nextModuleIdsByCreationIndex;

		if (removedModuleIds.size === 0) {
			return;
		}

		for (const codeBlock of state.graphicHelper.codeBlocks) {
			const updatedCode = removeInterModuleReferences(codeBlock.code, removedModuleIds);
			const didChange = updatedCode.some((line, index) => line !== codeBlock.code[index]);
			if (!didChange) {
				continue;
			}

			state.graphicHelper.selectedCodeBlockForProgrammaticEdit = codeBlock;
			codeBlock.code = updatedCode;
			codeBlock.lastUpdated = Date.now();
			store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', codeBlock);
		}
	}

	store.subscribe('graphicHelper.codeBlocks', onCodeBlocksChanged);
}
