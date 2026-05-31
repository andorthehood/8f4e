import type { CodeBlockGraphicData, CodeError } from '@8f4e/editor-state-types';
import type { BackgroundEffect, PostProcessEffect } from 'glugglug';
import extractShaderSource from './extractShaderSource';
import getShaderNoteMetadata from './getShaderNoteMetadata';

/**
 * Derives post-process and background effects from targeted shader notes.
 * Uses the first fragment/vertex shader per target (by creation order).
 */
export default function deriveShaderEffects(codeBlocks: CodeBlockGraphicData[]): {
	postProcessEffects: PostProcessEffect[];
	backgroundEffects: BackgroundEffect[];
	errors: CodeError[];
} {
	const sortedBlocks = [...codeBlocks].sort((a, b) => a.creationIndex - b.creationIndex);

	let postProcessFragment: string | null = null;
	let postProcessVertex: string | null = null;
	let backgroundFragment: string | null = null;
	let backgroundVertex: string | null = null;

	for (const block of sortedBlocks) {
		if (block.disabled) {
			continue;
		}

		const shaderNote = getShaderNoteMetadata(block.code);
		if (!shaderNote) {
			continue;
		}

		const source = extractShaderSource(block.code);

		if (shaderNote.target === 'postprocess') {
			if (shaderNote.shaderType === 'fragment' && postProcessFragment === null) {
				postProcessFragment = source;
			} else if (shaderNote.shaderType === 'vertex' && postProcessVertex === null) {
				postProcessVertex = source;
			}
		} else if (shaderNote.shaderType === 'fragment' && backgroundFragment === null) {
			backgroundFragment = source;
		} else if (shaderNote.shaderType === 'vertex' && backgroundVertex === null) {
			backgroundVertex = source;
		}

		if (
			postProcessFragment !== null &&
			postProcessVertex !== null &&
			backgroundFragment !== null &&
			backgroundVertex !== null
		) {
			break;
		}
	}

	const postProcessEffects: PostProcessEffect[] = [];
	const backgroundEffects: BackgroundEffect[] = [];

	if (postProcessFragment !== null) {
		postProcessEffects.push({
			...(postProcessVertex !== null ? { vertexShader: postProcessVertex } : {}),
			fragmentShader: postProcessFragment,
		});
	}

	if (backgroundFragment !== null) {
		backgroundEffects.push({
			...(backgroundVertex !== null ? { vertexShader: backgroundVertex } : {}),
			fragmentShader: backgroundFragment,
		});
	}

	return {
		postProcessEffects,
		backgroundEffects,
		errors: [],
	};
}
