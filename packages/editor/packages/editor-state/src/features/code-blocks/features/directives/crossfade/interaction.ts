import { StateManager } from '@8f4e/state-manager';

import findCrossfadeWidgetAtViewportCoordinates from './findWidgetAtViewportCoordinates';

import type { State, CodeBlockGraphicData, Crossfade, InternalMouseEvent } from '~/types';
import type { DataStructure } from '@8f4e/compiler';

import { EventDispatcher } from '~/types';

interface ActiveCrossfade {
	crossfade: Crossfade;
	codeBlock: CodeBlockGraphicData;
	leftMemory: Pick<DataStructure, 'wordAlignedAddress'>;
	rightMemory: Pick<DataStructure, 'wordAlignedAddress'>;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

export default function crossfade(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();
	let activeCrossfade: ActiveCrossfade | null = null;

	const updateCrossfadeValue = (x: number) => {
		if (!activeCrossfade) {
			return;
		}

		const { crossfade, codeBlock, leftMemory, rightMemory } = activeCrossfade;
		const relativeX = x - (codeBlock.x + codeBlock.offsetX + crossfade.x - state.viewport.x);
		const normalized = clamp((relativeX - crossfade.handleWidth / 2) / crossfade.trackWidth, 0, 1);
		const position = normalized * 2 - 1;
		const leftValue = (1 - position) / 2;
		const rightValue = (1 + position) / 2;

		state.callbacks?.setWordInMemory?.(leftMemory.wordAlignedAddress, leftValue, false);
		state.callbacks?.setWordInMemory?.(rightMemory.wordAlignedAddress, rightValue, false);
	};

	const onCodeBlockClick = function ({ x, y, codeBlock }: { x: number; y: number; codeBlock: CodeBlockGraphicData }) {
		const crossfade = findCrossfadeWidgetAtViewportCoordinates(state, codeBlock, x, y);

		if (!crossfade || !codeBlock.moduleId) {
			return;
		}

		const module = state.compiler.compiledModules[codeBlock.moduleId];
		const leftMemory = module?.memoryMap[crossfade.leftId];
		const rightMemory = module?.memoryMap[crossfade.rightId];

		if (!leftMemory || !rightMemory) {
			return;
		}

		activeCrossfade = { crossfade, codeBlock, leftMemory, rightMemory };
		state.graphicHelper.draggedCodeBlock = undefined;
		updateCrossfadeValue(x);
	};

	const onMouseMove = function (event: InternalMouseEvent) {
		if (!activeCrossfade) {
			return;
		}

		updateCrossfadeValue(event.x);
		event.stopPropagation = true;
	};

	const onMouseUp = function () {
		activeCrossfade = null;
	};

	events.on('codeBlockClick', onCodeBlockClick);
	events.on('mousemove', onMouseMove);
	events.on('mouseup', onMouseUp);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
		events.off('mousemove', onMouseMove);
		events.off('mouseup', onMouseUp);
	};
}
