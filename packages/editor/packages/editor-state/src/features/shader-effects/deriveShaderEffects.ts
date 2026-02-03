import extractShaderSource from './extractShaderSource';
import { DEFAULT_VERTEX_SHADER } from './defaultVertexShader';

import getBlockType from '../code-blocks/utils/codeParsers/getBlockType';

import type { BackgroundEffect, PostProcessEffect } from 'glugglug';
import type { CodeBlockGraphicData, CodeError } from '~/types';

/**
 * Derives post-process and background effects from targeted shader code blocks.
 * Uses the first fragment/vertex shader per target (by creation order).
 */
export default function deriveShaderEffects(codeBlocks: CodeBlockGraphicData[]): {
	postProcessEffects: PostProcessEffect[];
	backgroundEffects: BackgroundEffect[];
	errors: CodeError[];
} {
	// Sort by creation index to ensure stable ordering
	const sortedBlocks = [...codeBlocks].sort((a, b) => a.creationIndex - b.creationIndex);

	let postProcessFragment: string | null = null;
	let postProcessVertex: string | null = null;
	let backgroundFragment: string | null = null;
	let backgroundVertex: string | null = null;

	for (const block of sortedBlocks) {
		const blockType = getBlockType(block.code);
		if (blockType !== 'fragmentShader' && blockType !== 'vertexShader') {
			continue;
		}

		const startMarker = block.code[0]?.trim() ?? '';
		const [, target] = startMarker.split(/\s+/);
		if (target !== 'postprocess' && target !== 'background') {
			continue;
		}

		const source = extractShaderSource(block.code, startMarker);

		if (target === 'postprocess') {
			if (blockType === 'fragmentShader' && postProcessFragment === null) {
				postProcessFragment = source;
			} else if (blockType === 'vertexShader' && postProcessVertex === null) {
				postProcessVertex = source;
			}
		} else if (target === 'background') {
			if (blockType === 'fragmentShader' && backgroundFragment === null) {
				backgroundFragment = source;
			} else if (blockType === 'vertexShader' && backgroundVertex === null) {
				backgroundVertex = source;
			}
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
			vertexShader: postProcessVertex ?? DEFAULT_VERTEX_SHADER,
			fragmentShader: postProcessFragment,
		});
	}

	if (backgroundFragment !== null) {
		backgroundEffects.push({
			vertexShader: backgroundVertex ?? DEFAULT_VERTEX_SHADER,
			fragmentShader: backgroundFragment,
		});
	}

	return {
		postProcessEffects,
		backgroundEffects,
		errors: [],
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('deriveShaderEffects', () => {
		it('produces a post-process effect from a fragment shader block', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['fragmentShader postprocess', 'void main() {}', 'fragmentShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
			];

			const { postProcessEffects, backgroundEffects, errors } = deriveShaderEffects(blocks);

			expect(postProcessEffects).toHaveLength(1);
			expect(postProcessEffects[0].fragmentShader).toBe('void main() {}');
			expect(postProcessEffects[0].vertexShader).toBe(DEFAULT_VERTEX_SHADER);
			expect(backgroundEffects).toHaveLength(0);
			expect(errors).toHaveLength(0);
		});

		it('produces a background effect from a fragment shader block', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['fragmentShader background', 'void main() {}', 'fragmentShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
			];

			const { postProcessEffects, backgroundEffects, errors } = deriveShaderEffects(blocks);

			expect(postProcessEffects).toHaveLength(0);
			expect(backgroundEffects).toHaveLength(1);
			expect(backgroundEffects[0].fragmentShader).toBe('void main() {}');
			expect(backgroundEffects[0].vertexShader).toBe(DEFAULT_VERTEX_SHADER);
			expect(errors).toHaveLength(0);
		});

		it('pairs vertex and fragment shaders per target', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['vertexShader postprocess', 'post vertex', 'vertexShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
				{
					id: 'b',
					code: ['fragmentShader background', 'background fragment', 'fragmentShaderEnd'],
					creationIndex: 1,
				} as CodeBlockGraphicData,
				{
					id: 'c',
					code: ['fragmentShader postprocess', 'post fragment', 'fragmentShaderEnd'],
					creationIndex: 2,
				} as CodeBlockGraphicData,
				{
					id: 'd',
					code: ['vertexShader background', 'background vertex', 'vertexShaderEnd'],
					creationIndex: 3,
				} as CodeBlockGraphicData,
			];

			const { postProcessEffects, backgroundEffects, errors } = deriveShaderEffects(blocks);

			expect(postProcessEffects).toHaveLength(1);
			expect(postProcessEffects[0].vertexShader).toBe('post vertex');
			expect(postProcessEffects[0].fragmentShader).toBe('post fragment');
			expect(backgroundEffects).toHaveLength(1);
			expect(backgroundEffects[0].vertexShader).toBe('background vertex');
			expect(backgroundEffects[0].fragmentShader).toBe('background fragment');
			expect(errors).toHaveLength(0);
		});

		it('uses the first fragment block per target when multiple exist', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['fragmentShader postprocess', 'first post', 'fragmentShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
				{
					id: 'b',
					code: ['fragmentShader postprocess', 'second post', 'fragmentShaderEnd'],
					creationIndex: 1,
				} as CodeBlockGraphicData,
				{
					id: 'c',
					code: ['fragmentShader background', 'first bg', 'fragmentShaderEnd'],
					creationIndex: 2,
				} as CodeBlockGraphicData,
				{
					id: 'd',
					code: ['fragmentShader background', 'second bg', 'fragmentShaderEnd'],
					creationIndex: 3,
				} as CodeBlockGraphicData,
			];

			const { postProcessEffects, backgroundEffects } = deriveShaderEffects(blocks);

			expect(postProcessEffects).toHaveLength(1);
			expect(postProcessEffects[0].fragmentShader).toBe('first post');
			expect(backgroundEffects).toHaveLength(1);
			expect(backgroundEffects[0].fragmentShader).toBe('first bg');
		});

		it('skips shader blocks without a target suffix', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['fragmentShader', 'bare fragment', 'fragmentShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
				{
					id: 'b',
					code: ['vertexShader', 'bare vertex', 'vertexShaderEnd'],
					creationIndex: 1,
				} as CodeBlockGraphicData,
				{
					id: 'c',
					code: ['fragmentShader postprocess', 'targeted fragment', 'fragmentShaderEnd'],
					creationIndex: 2,
				} as CodeBlockGraphicData,
			];

			const { postProcessEffects, backgroundEffects } = deriveShaderEffects(blocks);

			expect(postProcessEffects).toHaveLength(1);
			expect(postProcessEffects[0].fragmentShader).toBe('targeted fragment');
			expect(backgroundEffects).toHaveLength(0);
		});

		it('produces no effect when only a vertex shader block exists', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['vertexShader postprocess', 'vertex only', 'vertexShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
			];

			const { postProcessEffects, backgroundEffects, errors } = deriveShaderEffects(blocks);

			expect(postProcessEffects).toHaveLength(0);
			expect(backgroundEffects).toHaveLength(0);
			expect(errors).toHaveLength(0);
		});

		it('handles empty shader bodies for both targets', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['vertexShader postprocess', 'vertexShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
				{
					id: 'b',
					code: ['fragmentShader postprocess', 'fragmentShaderEnd'],
					creationIndex: 1,
				} as CodeBlockGraphicData,
				{
					id: 'c',
					code: ['vertexShader background', 'vertexShaderEnd'],
					creationIndex: 2,
				} as CodeBlockGraphicData,
				{
					id: 'd',
					code: ['fragmentShader background', 'fragmentShaderEnd'],
					creationIndex: 3,
				} as CodeBlockGraphicData,
			];

			const { postProcessEffects, backgroundEffects } = deriveShaderEffects(blocks);

			expect(postProcessEffects).toHaveLength(1);
			expect(postProcessEffects[0].vertexShader).toBe('');
			expect(postProcessEffects[0].fragmentShader).toBe('');
			expect(backgroundEffects).toHaveLength(1);
			expect(backgroundEffects[0].vertexShader).toBe('');
			expect(backgroundEffects[0].fragmentShader).toBe('');
		});
	});
}
