import { getModuleId } from '@8f4e/ast-parser';
import { StateManager } from '@8f4e/state-manager';

import { renameInterModuleReferences } from '../../utils/renameInterModuleReferences';

import type { CodeBlockGraphicData, State } from '~/types';

export default function moduleReferenceRenamer(store: StateManager<State>): void {
	const state = store.getState();
	let previousCreationIndex: number | undefined;
	let previousCode: string[] | undefined;

	function snapshotSelectedCodeBlock(block: CodeBlockGraphicData | undefined): void {
		previousCreationIndex = block?.creationIndex;
		previousCode = block ? [...block.code] : undefined;
	}

	function renameReferencesToModule(): void {
		const selectedCodeBlock = state.graphicHelper.selectedCodeBlock;

		if (!selectedCodeBlock || previousCreationIndex !== selectedCodeBlock.creationIndex || !previousCode) {
			snapshotSelectedCodeBlock(selectedCodeBlock);
			return;
		}

		const previousModuleId = getModuleId(previousCode);
		const nextModuleId = getModuleId(selectedCodeBlock.code);

		if (!previousModuleId || !nextModuleId || previousModuleId === nextModuleId) {
			snapshotSelectedCodeBlock(selectedCodeBlock);
			return;
		}

		for (const codeBlock of state.graphicHelper.codeBlocks) {
			if (codeBlock.creationIndex === selectedCodeBlock.creationIndex) {
				continue;
			}

			const updatedCode = renameInterModuleReferences(codeBlock.code, previousModuleId, nextModuleId);
			const didChange = updatedCode.some((line, index) => line !== codeBlock.code[index]);
			if (!didChange) {
				continue;
			}

			state.graphicHelper.selectedCodeBlockForProgrammaticEdit = codeBlock;
			codeBlock.code = updatedCode;
			codeBlock.lastUpdated = Date.now();
			store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', codeBlock);
		}

		snapshotSelectedCodeBlock(selectedCodeBlock);
	}

	store.subscribe('graphicHelper.selectedCodeBlock', () => {
		const selectedCodeBlock = state.graphicHelper.selectedCodeBlock;
		if (!selectedCodeBlock) {
			snapshotSelectedCodeBlock(undefined);
			return;
		}

		if (previousCreationIndex === selectedCodeBlock.creationIndex) {
			return;
		}

		snapshotSelectedCodeBlock(selectedCodeBlock);
	});
	store.subscribe('graphicHelper.selectedCodeBlock.code', renameReferencesToModule);
}
