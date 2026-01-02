import { getVertexShaderId, getFragmentShaderId, getBlockType } from '@8f4e/compiler/syntax';

import type { PostProcessEffect } from 'glugglug';
import type { CodeBlockGraphicData, CodeError } from '../../types';

/**
 * Extracts shader source code from between shader markers.
 * For vertexShader blocks: extracts lines between 'vertexShader <id>' and 'vertexShaderEnd'
 * For fragmentShader blocks: extracts lines between 'fragmentShader <id>' and 'fragmentShaderEnd'
 */
function extractShaderSource(code: string[], blockType: 'vertexShader' | 'fragmentShader'): string {
	const startMarker = blockType;
	const endMarker = blockType + 'End';

	let startIndex = -1;
	let endIndex = -1;

	for (let i = 0; i < code.length; i++) {
		const trimmedLine = code[i].trim();
		// Check if line starts with the marker (allowing for whitespace before)
		if (trimmedLine.startsWith(startMarker + ' ') || trimmedLine === startMarker) {
			startIndex = i;
		} else if (trimmedLine === endMarker) {
			endIndex = i;
			break;
		}
	}

	if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
		return '';
	}

	// Extract lines between markers (excluding the markers themselves)
	const sourceLines = code.slice(startIndex + 1, endIndex);
	return sourceLines.join('\n');
}

/**
 * Derives post-process effects from shader code blocks.
 * Pairs vertex and fragment shaders with matching IDs using last-wins resolution.
 * Returns both the effects array and any pairing errors.
 */
export function derivePostProcessEffects(codeBlocks: CodeBlockGraphicData[]): {
	effects: PostProcessEffect[];
	errors: CodeError[];
} {
	const errors: CodeError[] = [];

	// Sort by creation index to ensure stable ordering
	const sortedBlocks = [...codeBlocks].sort((a, b) => a.creationIndex - b.creationIndex);

	// Collect shader blocks by ID, keeping only the last one for each ID
	const vertexShaders = new Map<string, { block: CodeBlockGraphicData; source: string }>();
	const fragmentShaders = new Map<string, { block: CodeBlockGraphicData; source: string }>();

	for (const block of sortedBlocks) {
		const blockType = getBlockType(block.code);

		if (blockType === 'vertexShader') {
			const id = getVertexShaderId(block.code);
			if (id) {
				const source = extractShaderSource(block.code, 'vertexShader');
				vertexShaders.set(id, { block, source });
			}
		} else if (blockType === 'fragmentShader') {
			const id = getFragmentShaderId(block.code);
			if (id) {
				const source = extractShaderSource(block.code, 'fragmentShader');
				fragmentShaders.set(id, { block, source });
			}
		}
	}

	// Build effects by pairing vertex and fragment shaders with matching IDs
	const effects: PostProcessEffect[] = [];
	const pairedIds = new Set<string>();

	// Check for vertex shaders with matching fragment shaders
	for (const [id, { block: vertexBlock, source: vertexSource }] of vertexShaders) {
		const fragmentData = fragmentShaders.get(id);

		if (fragmentData) {
			effects.push({
				name: id,
				vertexShader: vertexSource,
				fragmentShader: fragmentData.source,
				enabled: true,
			});
			pairedIds.add(id);
		} else {
			// Missing fragment shader
			errors.push({
				lineNumber: 1,
				message: `Vertex shader "${id}" has no matching fragment shader`,
				codeBlockId: vertexBlock.id,
			});
		}
	}

	// Check for fragment shaders without matching vertex shaders
	for (const [id, { block: fragmentBlock }] of fragmentShaders) {
		if (!pairedIds.has(id)) {
			errors.push({
				lineNumber: 1,
				message: `Fragment shader "${id}" has no matching vertex shader`,
				codeBlockId: fragmentBlock.id,
			});
		}
	}

	return { effects, errors };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractShaderSource', () => {
		it('extracts vertex shader source between markers', () => {
			const code = [
				'vertexShader test',
				'attribute vec2 a_position;',
				'void main() {',
				'  gl_Position = vec4(a_position, 0, 1);',
				'}',
				'vertexShaderEnd',
			];

			const source = extractShaderSource(code, 'vertexShader');
			expect(source).toBe('attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0, 1);\n}');
		});

		it('extracts fragment shader source between markers', () => {
			const code = [
				'fragmentShader test',
				'precision mediump float;',
				'void main() {',
				'  gl_FragColor = vec4(1.0);',
				'}',
				'fragmentShaderEnd',
			];

			const source = extractShaderSource(code, 'fragmentShader');
			expect(source).toBe('precision mediump float;\nvoid main() {\n  gl_FragColor = vec4(1.0);\n}');
		});

		it('returns empty string when markers are missing', () => {
			const code = ['some code', 'more code'];
			expect(extractShaderSource(code, 'vertexShader')).toBe('');
		});
	});

	describe('derivePostProcessEffects', () => {
		it('pairs vertex and fragment shaders with matching IDs', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'test',
					code: ['vertexShader test', 'void main() {}', 'vertexShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
				{
					id: 'test',
					code: ['fragmentShader test', 'void main() {}', 'fragmentShaderEnd'],
					creationIndex: 1,
				} as CodeBlockGraphicData,
			];

			const { effects, errors } = derivePostProcessEffects(blocks);

			expect(effects).toHaveLength(1);
			expect(effects[0].name).toBe('test');
			expect(effects[0].enabled).toBe(true);
			expect(errors).toHaveLength(0);
		});

		it('uses last-wins resolution for duplicate IDs', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'test',
					code: ['vertexShader test', 'first version', 'vertexShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
				{
					id: 'test',
					code: ['vertexShader test', 'second version', 'vertexShaderEnd'],
					creationIndex: 1,
				} as CodeBlockGraphicData,
				{
					id: 'test',
					code: ['fragmentShader test', 'fragment code', 'fragmentShaderEnd'],
					creationIndex: 2,
				} as CodeBlockGraphicData,
			];

			const { effects, errors } = derivePostProcessEffects(blocks);

			expect(effects).toHaveLength(1);
			expect(effects[0].vertexShader).toBe('second version');
			expect(errors).toHaveLength(0);
		});

		it('reports error for vertex shader without matching fragment', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'test',
					code: ['vertexShader test', 'void main() {}', 'vertexShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
			];

			const { effects, errors } = derivePostProcessEffects(blocks);

			expect(effects).toHaveLength(0);
			expect(errors).toHaveLength(1);
			expect(errors[0].message).toContain('no matching fragment shader');
		});

		it('reports error for fragment shader without matching vertex', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'test',
					code: ['fragmentShader test', 'void main() {}', 'fragmentShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
			];

			const { effects, errors } = derivePostProcessEffects(blocks);

			expect(effects).toHaveLength(0);
			expect(errors).toHaveLength(1);
			expect(errors[0].message).toContain('no matching vertex shader');
		});

		it('handles multiple shader pairs', () => {
			const blocks: CodeBlockGraphicData[] = [
				{
					id: 'effect1',
					code: ['vertexShader effect1', 'code1', 'vertexShaderEnd'],
					creationIndex: 0,
				} as CodeBlockGraphicData,
				{
					id: 'effect1',
					code: ['fragmentShader effect1', 'code1', 'fragmentShaderEnd'],
					creationIndex: 1,
				} as CodeBlockGraphicData,
				{
					id: 'effect2',
					code: ['vertexShader effect2', 'code2', 'vertexShaderEnd'],
					creationIndex: 2,
				} as CodeBlockGraphicData,
				{
					id: 'effect2',
					code: ['fragmentShader effect2', 'code2', 'fragmentShaderEnd'],
					creationIndex: 3,
				} as CodeBlockGraphicData,
			];

			const { effects, errors } = derivePostProcessEffects(blocks);

			expect(effects).toHaveLength(2);
			expect(effects[0].name).toBe('effect1');
			expect(effects[1].name).toBe('effect2');
			expect(errors).toHaveLength(0);
		});
	});
}
