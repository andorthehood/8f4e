import extractShaderSource from './extractShaderSource';
import { DEFAULT_VERTEX_SHADER } from './defaultVertexShader';

import getBlockType from '../code-blocks/utils/codeParsers/getBlockType';

import type { PostProcessEffect } from 'glugglug';
import type { CodeBlockGraphicData, CodeError } from '~/types';

/**
 * Derives a single post-process effect from shader code blocks.
 * Uses the first fragment shader block found (by creation order).
 * If a vertex shader block is present, uses the first one; otherwise falls back to the default.
 */
export default function derivePostProcessEffects(codeBlocks: CodeBlockGraphicData[]): {
	effects: PostProcessEffect[];
	errors: CodeError[];
} {
	// Sort by creation index to ensure stable ordering
	const sortedBlocks = [...codeBlocks].sort((a, b) => a.creationIndex - b.creationIndex);

	let firstFragmentSource: string | null = null;
	let firstVertexSource: string | null = null;

	for (const block of sortedBlocks) {
		const blockType = getBlockType(block.code);

		if (blockType === 'fragmentShader' && firstFragmentSource === null) {
			firstFragmentSource = extractShaderSource(block.code, 'fragmentShader');
		} else if (blockType === 'vertexShader' && firstVertexSource === null) {
			firstVertexSource = extractShaderSource(block.code, 'vertexShader');
		}
	}

	if (firstFragmentSource === null) {
		return { effects: [], errors: [] };
	}

	return {
		effects: [
			{
				vertexShader: firstVertexSource ?? DEFAULT_VERTEX_SHADER,
				fragmentShader: firstFragmentSource,
			},
		],
		errors: [],
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('derivePostProcessEffects', () => {
		it('produces an effect from a fragment shader block', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['fragmentShader', 'void main() {}', 'fragmentShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
			];

			const { effects, errors } = derivePostProcessEffects(blocks);

			expect(effects).toHaveLength(1);
			expect(effects[0].fragmentShader).toBe('void main() {}');
			expect(effects[0].vertexShader).toBe(DEFAULT_VERTEX_SHADER);
			expect(errors).toHaveLength(0);
		});

		it('pairs the first vertex shader with the first fragment shader', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['vertexShader', 'custom vertex', 'vertexShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
				{
					id: 'b',
					code: ['fragmentShader', 'custom fragment', 'fragmentShaderEnd'],
					creationIndex: 1,
				} as CodeBlockGraphicData,
			];

			const { effects, errors } = derivePostProcessEffects(blocks);

			expect(effects).toHaveLength(1);
			expect(effects[0].vertexShader).toBe('custom vertex');
			expect(effects[0].fragmentShader).toBe('custom fragment');
			expect(errors).toHaveLength(0);
		});

		it('uses the first fragment block when multiple exist', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['fragmentShader', 'first fragment', 'fragmentShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
				{
					id: 'b',
					code: ['fragmentShader', 'second fragment', 'fragmentShaderEnd'],
					creationIndex: 1,
				} as CodeBlockGraphicData,
			];

			const { effects, errors } = derivePostProcessEffects(blocks);

			expect(effects).toHaveLength(1);
			expect(effects[0].fragmentShader).toBe('first fragment');
			expect(errors).toHaveLength(0);
		});

		it('uses the first vertex block when multiple exist', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['vertexShader', 'first vertex', 'vertexShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
				{
					id: 'b',
					code: ['vertexShader', 'second vertex', 'vertexShaderEnd'],
					creationIndex: 1,
				} as CodeBlockGraphicData,
				{
					id: 'c',
					code: ['fragmentShader', 'fragment', 'fragmentShaderEnd'],
					creationIndex: 2,
				} as CodeBlockGraphicData,
			];

			const { effects, errors } = derivePostProcessEffects(blocks);

			expect(effects).toHaveLength(1);
			expect(effects[0].vertexShader).toBe('first vertex');
			expect(errors).toHaveLength(0);
		});

		it('returns no effect when no fragment shader block exists', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['vertexShader', 'some vertex', 'vertexShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
			];

			const { effects, errors } = derivePostProcessEffects(blocks);

			expect(effects).toHaveLength(0);
			expect(errors).toHaveLength(0);
		});

		it('returns no effect when there are no shader blocks', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'a',
					code: ['module foo', '', 'moduleEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
			];

			const { effects, errors } = derivePostProcessEffects(blocks);

			expect(effects).toHaveLength(0);
			expect(errors).toHaveLength(0);
		});
	});
}
