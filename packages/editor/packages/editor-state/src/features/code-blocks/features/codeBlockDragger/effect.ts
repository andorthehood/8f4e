import findCodeBlockAtViewportCoordinates from '../../utils/finders/findCodeBlockAtViewportCoordinates';
import { getGroupBlocks } from '../group/getGroupBlocks';
import upsertPos from '../position/upsertPos';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, InternalMouseEvent, EventDispatcher } from '~/types';

export interface CodeBlockClickEvent {
	x: number;
	y: number;
	relativeX: number;
	relativeY: number;
	codeBlock: CodeBlockGraphicData;
}

export default function codeBlockDragger(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();
	// dragSet holds the blocks being dragged together. It's computed fresh on each mousedown
	// and cleared on mouseup, so concurrent drags are not a concern (only one drag at a time).
	let dragSet: CodeBlockGraphicData[] = [];

	function onMouseDown(event: InternalMouseEvent) {
		const { x, y, altKey } = event;
		if (!state.featureFlags.moduleDragging) {
			return;
		}

		state.graphicHelper.draggedCodeBlock = findCodeBlockAtViewportCoordinates(state, x, y);
		const draggedCodeBlock = state.graphicHelper.draggedCodeBlock;

		if (!draggedCodeBlock) {
			return;
		}
		state.graphicHelper.selectedCodeBlock = state.graphicHelper.draggedCodeBlock;

		// Compute drag set based on nonstick flag and modifier
		// 1. If block is in a nonstick group and modifier is NOT held: single-block drag
		// 2. Else if block is in a nonstick group and modifier IS held: group-drag override
		// 3. Else if block is in a regular group (default) and modifier is NOT held: group drag
		// 4. Else if block is in a regular group and modifier IS held: single-block override
		// 5. Else: normal single-block drag
		if (draggedCodeBlock.groupName) {
			if (draggedCodeBlock.groupNonstick) {
				// Nonstick group: single-block by default, Alt for group drag
				if (altKey) {
					dragSet = getGroupBlocks(state.graphicHelper.codeBlocks, draggedCodeBlock.groupName);
				} else {
					dragSet = [draggedCodeBlock];
				}
			} else {
				// Regular group: group drag by default, Alt for single-block
				if (altKey) {
					dragSet = [draggedCodeBlock];
				} else {
					dragSet = getGroupBlocks(state.graphicHelper.codeBlocks, draggedCodeBlock.groupName);
				}
			}
		} else {
			// Single block drag (no group)
			dragSet = [draggedCodeBlock];
		}

		const relativeX = Math.abs(x - (draggedCodeBlock.x + draggedCodeBlock.offsetX - state.viewport.x));
		const relativeY = Math.abs(y - (draggedCodeBlock.y + draggedCodeBlock.offsetY - state.viewport.y));

		events.dispatch<CodeBlockClickEvent>('codeBlockClick', {
			x,
			y,
			relativeX,
			relativeY,
			codeBlock: draggedCodeBlock,
		});

		// Bring dragged module forward.
		state.graphicHelper.codeBlocks = [
			...state.graphicHelper.codeBlocks.filter(block => block !== draggedCodeBlock),
			draggedCodeBlock,
		];
	}

	function onMouseMove(event: InternalMouseEvent) {
		const { movementX, movementY } = event;
		if (state.graphicHelper.draggedCodeBlock && dragSet.length > 0) {
			// Apply movement to all blocks in drag set
			for (const block of dragSet) {
				block.x += movementX;
				block.y += movementY;
			}
			event.stopPropagation = true;
		}
	}

	function onMouseUp() {
		if (!state.graphicHelper.draggedCodeBlock || dragSet.length === 0) {
			return;
		}

		const primaryBlock = state.graphicHelper.draggedCodeBlock;
		const vGrid = state.viewport.vGrid;
		const hGrid = state.viewport.hGrid;

		// Compute a single snap delta based on the primary dragged block
		const snapGridX = Math.round(primaryBlock.x / vGrid);
		const snapGridY = Math.round(primaryBlock.y / hGrid);
		const snapX = snapGridX * vGrid;
		const snapY = snapGridY * hGrid;
		const deltaX = snapX - primaryBlock.x;
		const deltaY = snapY - primaryBlock.y;

		// Snap all blocks in drag set to grid using the same pixel delta
		for (const block of dragSet) {
			block.x += deltaX;
			block.y += deltaY;

			const gridX = Math.round(block.x / vGrid);
			const gridY = Math.round(block.y / hGrid);
			block.gridX = gridX;
			block.gridY = gridY;
			block.x = gridX * vGrid;
			block.y = gridY * hGrid;

			// Update @pos directive in code for this block
			// Use selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger to save without triggering compilation
			store.set('graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger', block);
			block.code = upsertPos(block.code, gridX, gridY);
			store.set('graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger', undefined);
		}

		state.graphicHelper.draggedCodeBlock = undefined;
		dragSet = [];
	}

	events.on('mousedown', onMouseDown);
	events.on('mousemove', onMouseMove);
	events.on('mouseup', onMouseUp);

	return () => {
		events.off('mousedown', onMouseDown);
		events.off('mousemove', onMouseMove);
		events.off('mouseup', onMouseUp);
	};
}
