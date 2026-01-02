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

		// Update shader errors
		const existingErrors = state.codeErrors.compilationErrors.filter(
			err => !err.message.includes('matching fragment shader') && !err.message.includes('matching vertex shader')
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
