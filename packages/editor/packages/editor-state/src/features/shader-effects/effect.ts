import type { EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { log } from '../logger/logger';
import deriveShaderEffects from './deriveShaderEffects';
import { isShaderNoteCode } from './getShaderNoteMetadata';

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
		const { postProcessEffects, backgroundEffects, errors } = deriveShaderEffects(state.codeBlockRendering.codeBlocks);

		log(state, 'Recomputed shader effects', 'Shaders');

		// Update the post-process effects
		state.postProcessEffects = postProcessEffects;
		state.backgroundEffects = backgroundEffects;

		// Clear any stale shader-related errors, then apply new ones
		state.codeErrors.shaderErrors = errors;

		// Dispatch event to load the new effect into the renderer
		events.dispatch('loadPostProcessEffect', postProcessEffects[0] ?? null);
		events.dispatch('loadBackgroundEffect', backgroundEffects[0] ?? null);
	}

	store.subscribe('codeBlockRendering.codeBlocks', () => {
		recomputeShaderEffects();
	});
	store.subscribe('codeBlockRendering.selectedCodeBlock.code', () => {
		if (isShaderNoteCode(state.codeBlockRendering.selectedCodeBlock?.code ?? [])) {
			recomputeShaderEffects();
		}
	});
	store.subscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code', () => {
		if (isShaderNoteCode(state.codeBlockRendering.selectedCodeBlockForProgrammaticEdit?.code ?? [])) {
			recomputeShaderEffects();
		}
	});
}
