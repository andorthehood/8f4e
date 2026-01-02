import { StateManager } from '@8f4e/state-manager';

import { log } from '../../impureHelpers/logger/logger';
import derivePostProcessEffects from '../../pureHelpers/shaderEffects/derivePostProcessEffects';

import type { EventDispatcher, State } from '../../types';

/**
 * Effect that keeps post-process effects in sync with shader code blocks.
 * Recomputes effects when:
 * - projectLoaded: When a project is loaded
 * - codeBlockAdded: When a new shader block is added
 * - code changes: When shader block's code changes
 * - deleteCodeBlock: When a shader block is deleted
 */
export default function shaderEffectsDeriver(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	/**
	 * Recompute post-process effects from all shader blocks
	 */
	function recomputeShaderEffects(): void {
		const codeBlocksArray = Array.from(state.graphicHelper.codeBlocks);
		const { effects, errors } = derivePostProcessEffects(codeBlocksArray);

		log(state, 'Recomputed shader effects', 'Shaders');

		// Update the post-process effects
		state.graphicHelper.postProcessEffects = effects;

		// Update shader errors - filter out previous shader-related errors
		// We identify shader errors by checking for specific shader-related error messages
		const SHADER_ERROR_MARKERS = [
			'matching fragment shader',
			'matching vertex shader',
			'shader block is missing an ID',
		];
		const existingErrors = state.codeErrors.compilationErrors.filter(
			err => !SHADER_ERROR_MARKERS.some(marker => err.message.includes(marker))
		);
		state.codeErrors.compilationErrors = [...existingErrors, ...errors];

		// Dispatch event to load the new effects into the renderer
		events.dispatch('loadPostProcessEffects', effects);
	}

	// Recompute on project load
	events.on('projectLoaded', recomputeShaderEffects);

	// Recompute when a code block is added
	events.on('codeBlockAdded', recomputeShaderEffects);

	// Recompute when a code block is deleted
	events.on('deleteCodeBlock', recomputeShaderEffects);

	// Recompute when shader block's code changes
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (
			state.graphicHelper.selectedCodeBlock?.blockType === 'fragmentShader' ||
			state.graphicHelper.selectedCodeBlock?.blockType === 'vertexShader'
		) {
			recomputeShaderEffects();
		}
	});
}
