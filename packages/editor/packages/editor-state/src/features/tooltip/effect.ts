import { TOOLTIP_WRAP_WIDTH } from './constants';
import { getSelectedLineTooltipContent } from './content';
import { createEmptyTooltipState, getTooltipState } from './layout';
import { getMemoryDeclarationIdFromSourceLine } from './sourceLine';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { CompiledStackAnalysisLine } from '@8f4e/compiler-spec';

export { TOOLTIP_WRAP_WIDTH } from './constants';
export { getSelectedLineTooltipContent, getSelectedLineTooltipText } from './content';
export { getSelectedLineTooltipColors } from './colors';
export {
	getInstructionNameFromSourceLine,
	getInstructionSpecFromSourceLine,
	getMemoryDeclarationIdFromSourceLine,
	getStackSignatureFromSourceLine,
} from './sourceLine';
export { getStackAnalysisTooltipText } from './stackAnalysisTooltip';
export { wrapTooltipText } from './text';

/**
 * Finds stack analysis for the currently selected source line.
 */
function getSelectedCodeBlockStackAnalysisLine(
	state: State,
	selectedCodeBlock: CodeBlockGraphicData
): CompiledStackAnalysisLine | undefined {
	const moduleId = selectedCodeBlock.moduleId;

	if (!moduleId) {
		return undefined;
	}

	return state.compiler.compiledModules[moduleId]?.stackAnalysis?.find(
		line => line.lineNumberBeforeMacroExpansion === selectedCodeBlock.cursor.row
	);
}

/**
 * Resolves memory metadata for selected memory declaration tooltip rows.
 */
function getSelectedMemoryDeclaration(state: State, moduleId: string | undefined, memoryId: string | undefined) {
	if (!moduleId || !memoryId) {
		return undefined;
	}

	return state.compiler.compiledModules[moduleId]?.memoryMap[memoryId];
}

/**
 * Keeps central tooltip state synchronized with the selected code line.
 */
export default function tooltip(store: StateManager<State>): void {
	const state = store.getState();

	function syncSelectedLineTooltip(): void {
		const selectedCodeBlock = state.graphicHelper.selectedCodeBlock;

		if (!state.featureFlags.codeLineSelection || !selectedCodeBlock) {
			store.set('tooltip', createEmptyTooltipState());
			return;
		}

		const line = selectedCodeBlock.code[selectedCodeBlock.cursor.row];
		const memoryId = getMemoryDeclarationIdFromSourceLine(line);
		const content = getSelectedLineTooltipContent(
			line,
			TOOLTIP_WRAP_WIDTH,
			getSelectedCodeBlockStackAnalysisLine(state, selectedCodeBlock),
			state.graphicHelper.spriteLookups,
			selectedCodeBlock.moduleId,
			getSelectedMemoryDeclaration(state, selectedCodeBlock.moduleId, memoryId)
		);
		store.set('tooltip', getTooltipState(content, state, selectedCodeBlock));
	}

	store.subscribe('graphicHelper.selectedCodeBlock', syncSelectedLineTooltip);
	store.subscribe('graphicHelper.selectedCodeBlock.code', syncSelectedLineTooltip);
	store.subscribe('graphicHelper.selectedCodeBlock.cursor.row', syncSelectedLineTooltip);
	store.subscribe('graphicHelper.selectedCodeBlock.cursor.y', syncSelectedLineTooltip);
	store.subscribe('featureFlags.codeLineSelection', syncSelectedLineTooltip);
	store.subscribe('compiler.compiledModules', syncSelectedLineTooltip);
	store.subscribe('graphicHelper.spriteLookups', syncSelectedLineTooltip);
	store.subscribe('viewport.vGrid', syncSelectedLineTooltip);
	store.subscribe('viewport.hGrid', syncSelectedLineTooltip);

	syncSelectedLineTooltip();
}
