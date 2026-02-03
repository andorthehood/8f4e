import { StateManager } from '@8f4e/state-manager';

import deriveShaderEffects from './deriveShaderEffects';

import { log } from '../logger/logger';

import type { EventDispatcher, State } from '~/types';

/**
 * Effect that keeps post-process and background effects in sync with shader code blocks.
 * Recomputes effects when:
 * - projectLoaded: When a project is loaded
 * - code changes: When shader block's code changes
 */
export default function shaderEffectsDeriver(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	/**
	 * Recompute shader effects from all shader blocks
	 */
	function recomputeShaderEffects(): void {
		const { postProcessEffects, backgroundEffects, errors } = deriveShaderEffects(state.graphicHelper.codeBlocks);

		log(state, 'Recomputed shader effects', 'Shaders');

		// Update the post-process effects
		state.graphicHelper.postProcessEffects = postProcessEffects;
		state.graphicHelper.backgroundEffects = backgroundEffects;

		// Clear any stale shader-related errors, then apply new ones
		state.codeErrors.shaderErrors = errors;

		// Dispatch event to load the new effect into the renderer
		events.dispatch('loadPostProcessEffect', postProcessEffects[0] ?? null);
		events.dispatch('loadBackgroundEffect', backgroundEffects[0] ?? null);
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
