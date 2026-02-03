import { StateManager } from '@8f4e/state-manager';

import derivePostProcessEffects from './derivePostProcessEffects';

import { log } from '../logger/logger';

import type { EventDispatcher, State } from '~/types';

/**
 * Effect that keeps post-process effects in sync with shader code blocks.
 * Recomputes effects when:
 * - projectLoaded: When a project is loaded
 * - code changes: When shader block's code changes
 */
export default function shaderEffectsDeriver(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	/**
	 * Recompute post-process effects from all shader blocks
	 */
	function recomputeShaderEffects(): void {
		const { effects, errors } = derivePostProcessEffects(state.graphicHelper.codeBlocks);

		log(state, 'Recomputed shader effects', 'Shaders');

		// Update the post-process effects
		state.graphicHelper.postProcessEffects = effects;

		// Clear any stale shader-related errors, then apply new ones
		state.codeErrors.compilationErrors = errors;

		// Dispatch event to load the new effects into the renderer
		events.dispatch('loadPostProcessEffect', effects);
	}

	store.subscribe('graphicHelper.codeBlocks', () => {
		recomputeShaderEffects();
	});
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (
			state.graphicHelper.selectedCodeBlock?.blockType === 'fragmentShader' ||
			state.graphicHelper.selectedCodeBlock?.blockType === 'vertexShader'
		) {
			recomputeShaderEffects();
		}
	});
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', () => {
		if (
			state.graphicHelper.selectedCodeBlockForProgrammaticEdit?.blockType === 'fragmentShader' ||
			state.graphicHelper.selectedCodeBlockForProgrammaticEdit?.blockType === 'vertexShader'
		) {
			recomputeShaderEffects();
		}
	});
}
