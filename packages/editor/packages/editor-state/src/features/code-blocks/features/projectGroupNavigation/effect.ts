import type { CodeBlockGraphicData, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import centerViewportOnCodeBlock from '../../../viewport/centerViewportOnCodeBlock';
import updateViewport from '../../../viewport/updateViewport';

export interface OpenProjectGroupEvent {
	codeBlock: CodeBlockGraphicData;
}

export function findParentProjectSlice(
	rootCodeBlocks: CodeBlockGraphicData[],
	currentCodeBlocks: CodeBlockGraphicData[]
): CodeBlockGraphicData[] | undefined {
	for (const codeBlock of rootCodeBlocks) {
		const nestedProjectCodeBlocks = codeBlock.nestedProjectCodeBlocks;
		if (nestedProjectCodeBlocks === undefined) {
			continue;
		}

		if (nestedProjectCodeBlocks === currentCodeBlocks) {
			return rootCodeBlocks;
		}

		const parentCodeBlocks = findParentProjectSlice(nestedProjectCodeBlocks, currentCodeBlocks);
		if (parentCodeBlocks) {
			return parentCodeBlocks;
		}
	}
}

/** Moves the editor's rendered-slice pointer through the recursive project tree. */
export default function projectGroupNavigation(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function showProjectSlice(codeBlocks: CodeBlockGraphicData[]): void {
		store.set('codeBlockRendering.selectedCodeBlock', undefined);
		store.set('codeBlockRendering.selectedCodeBlockForProgrammaticEdit', undefined);
		store.set('codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger', undefined);
		state.codeBlockRendering.draggedCodeBlock = undefined;
		store.set('codeBlockRendering.codeBlocks', codeBlocks);

		const homeBlock = codeBlocks.find(block => block.isHome);
		if (homeBlock) {
			const { x, y } = centerViewportOnCodeBlock(state.viewport, homeBlock, {
				alignment: homeBlock.homeAlignment,
			});
			updateViewport(state, x, y, events);
			return;
		}

		updateViewport(state, 0, 0, events);
	}

	function onOpenProjectGroup({ codeBlock }: OpenProjectGroupEvent): void {
		if (codeBlock.nestedProjectCodeBlocks !== undefined) {
			showProjectSlice(codeBlock.nestedProjectCodeBlocks);
		}
	}

	function onGoToParentProjectGroup(): void {
		const parentCodeBlocks = findParentProjectSlice(
			state.codeBlockRendering.rootCodeBlocks,
			state.codeBlockRendering.codeBlocks
		);
		if (parentCodeBlocks) {
			showProjectSlice(parentCodeBlocks);
		}
	}

	events.on<OpenProjectGroupEvent>('openProjectGroup', onOpenProjectGroup);
	events.on('goToParentProjectGroup', onGoToParentProjectGroup);
}
