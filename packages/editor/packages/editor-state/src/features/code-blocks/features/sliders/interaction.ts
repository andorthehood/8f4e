import { StateManager } from '@8f4e/state-manager';

import findSliderAtViewportCoordinates from './findSliderAtViewportCoordinates';

import type { State, CodeBlockGraphicData, InternalMouseEvent, Slider } from '~/types';
import type { DataStructure } from '@8f4e/compiler';

import { EventDispatcher } from '~/types';

interface ActiveSlider {
	slider: Slider;
	codeBlock: CodeBlockGraphicData;
	memory: Pick<DataStructure, 'wordAlignedAddress' | 'isInteger'>;
}

export default function slider(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();
	let activeSlider: ActiveSlider | null = null;

	const updateSliderValue = (x: number) => {
		if (!activeSlider) return;

		const { slider, codeBlock, memory } = activeSlider;

		// Calculate relative x position within the slider
		const relativeX = x - (codeBlock.x + codeBlock.offsetX + slider.x - state.viewport.x);
		const normalizedValue = Math.max(0, Math.min(1, relativeX / slider.width));

		// Map to slider range
		let value = slider.min + normalizedValue * (slider.max - slider.min);

		// Apply step if provided (must be positive)
		if (slider.step !== undefined && slider.step > 0) {
			value = slider.min + Math.round((value - slider.min) / slider.step) * slider.step;
		}

		// Clamp to min/max
		value = Math.max(slider.min, Math.min(slider.max, value));

		const hasFloatRange =
			!Number.isInteger(slider.min) ||
			!Number.isInteger(slider.max) ||
			(slider.step !== undefined && !Number.isInteger(slider.step));
		const shouldWriteInteger = memory.isInteger && !hasFloatRange;

		state.callbacks?.setWordInMemory?.(memory.wordAlignedAddress, value, shouldWriteInteger);
	};

	const onCodeBlockClick = function ({ x, y, codeBlock }: { x: number; y: number; codeBlock: CodeBlockGraphicData }) {
		const slider = findSliderAtViewportCoordinates(state, codeBlock, x, y);

		if (!slider) {
			return;
		}

		if (!codeBlock.moduleId) {
			return;
		}

		const memory = state.compiler.compiledModules[codeBlock.moduleId]?.memoryMap[slider.id];

		if (!memory) {
			return;
		}

		// Set active slider for drag handling
		activeSlider = { slider, codeBlock, memory };
		state.graphicHelper.draggedCodeBlock = undefined;

		// Update value on click
		updateSliderValue(x);
	};

	const onMouseMove = function (event: InternalMouseEvent) {
		if (!activeSlider) {
			return;
		}

		// Update value during drag
		updateSliderValue(event.x);
		event.stopPropagation = true;
	};

	const onMouseUp = function () {
		// Clear active slider when mouse is released
		activeSlider = null;
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
