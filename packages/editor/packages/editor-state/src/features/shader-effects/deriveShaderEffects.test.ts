import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import deriveShaderEffects from './deriveShaderEffects';

describe('deriveShaderEffects', () => {
	it('produces a post-process effect from a fragment shader note', () => {
		const blocks: CodeBlockGraphicData[] = [
			{
				id: 'a',
				code: ['note fragmentShaderPostprocess', 'void main() {}', 'noteEnd'],
				creationIndex: 0,
			} as CodeBlockGraphicData,
		];

		const { postProcessEffects, backgroundEffects, errors } = deriveShaderEffects(blocks);

		expect(postProcessEffects).toHaveLength(1);
		expect(postProcessEffects[0].fragmentShader).toBe('void main() {}');
		expect(postProcessEffects[0].vertexShader).toBeUndefined();
		expect(backgroundEffects).toHaveLength(0);
		expect(errors).toHaveLength(0);
	});

	it('produces a background effect from a fragment shader note', () => {
		const blocks: CodeBlockGraphicData[] = [
			{
				id: 'a',
				code: ['note fragmentShaderBackground', 'void main() {}', 'noteEnd'],
				creationIndex: 0,
			} as CodeBlockGraphicData,
		];

		const { postProcessEffects, backgroundEffects, errors } = deriveShaderEffects(blocks);

		expect(postProcessEffects).toHaveLength(0);
		expect(backgroundEffects).toHaveLength(1);
		expect(backgroundEffects[0].fragmentShader).toBe('void main() {}');
		expect(backgroundEffects[0].vertexShader).toBeUndefined();
		expect(errors).toHaveLength(0);
	});

	it('pairs vertex and fragment shaders per target', () => {
		const blocks: CodeBlockGraphicData[] = [
			{
				id: 'a',
				code: ['note vertexShaderPostprocess', 'post vertex', 'noteEnd'],
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				id: 'b',
				code: ['note fragmentShaderBackground', 'background fragment', 'noteEnd'],
				creationIndex: 1,
			} as CodeBlockGraphicData,
			{
				id: 'c',
				code: ['note fragmentShaderPostprocess', 'post fragment', 'noteEnd'],
				creationIndex: 2,
			} as CodeBlockGraphicData,
			{
				id: 'd',
				code: ['note vertexShaderBackground', 'background vertex', 'noteEnd'],
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
				code: ['note fragmentShaderPostprocess', 'first post', 'noteEnd'],
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				id: 'b',
				code: ['note fragmentShaderPostprocess', 'second post', 'noteEnd'],
				creationIndex: 1,
			} as CodeBlockGraphicData,
			{
				id: 'c',
				code: ['note fragmentShaderBackground', 'first bg', 'noteEnd'],
				creationIndex: 2,
			} as CodeBlockGraphicData,
			{
				id: 'd',
				code: ['note fragmentShaderBackground', 'second bg', 'noteEnd'],
				creationIndex: 3,
			} as CodeBlockGraphicData,
		];

		const { postProcessEffects, backgroundEffects } = deriveShaderEffects(blocks);

		expect(postProcessEffects).toHaveLength(1);
		expect(postProcessEffects[0].fragmentShader).toBe('first post');
		expect(backgroundEffects).toHaveLength(1);
		expect(backgroundEffects[0].fragmentShader).toBe('first bg');
	});

	it('skips notes without a recognized shader subtype', () => {
		const blocks: CodeBlockGraphicData[] = [
			{
				id: 'a',
				code: ['note', 'bare fragment', 'noteEnd'],
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				id: 'b',
				code: ['note todo', 'bare vertex', 'noteEnd'],
				creationIndex: 1,
			} as CodeBlockGraphicData,
			{
				id: 'c',
				code: ['note fragmentShaderPostprocess', 'targeted fragment', 'noteEnd'],
				creationIndex: 2,
			} as CodeBlockGraphicData,
		];

		const { postProcessEffects, backgroundEffects } = deriveShaderEffects(blocks);

		expect(postProcessEffects).toHaveLength(1);
		expect(postProcessEffects[0].fragmentShader).toBe('targeted fragment');
		expect(backgroundEffects).toHaveLength(0);
	});

	it('skips disabled shader notes', () => {
		const blocks: CodeBlockGraphicData[] = [
			{
				id: 'a',
				code: ['note fragmentShaderPostprocess', 'disabled fragment', 'noteEnd'],
				creationIndex: 0,
				disabled: true,
			} as CodeBlockGraphicData,
			{
				id: 'b',
				code: ['note fragmentShaderPostprocess', 'active fragment', 'noteEnd'],
				creationIndex: 1,
			} as CodeBlockGraphicData,
		];

		const { postProcessEffects } = deriveShaderEffects(blocks);

		expect(postProcessEffects).toHaveLength(1);
		expect(postProcessEffects[0].fragmentShader).toBe('active fragment');
	});

	it('produces no effect when only a vertex shader note exists', () => {
		const blocks: CodeBlockGraphicData[] = [
			{
				id: 'a',
				code: ['note vertexShaderPostprocess', 'vertex only', 'noteEnd'],
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
				code: ['note vertexShaderPostprocess', 'noteEnd'],
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				id: 'b',
				code: ['note fragmentShaderPostprocess', 'noteEnd'],
				creationIndex: 1,
			} as CodeBlockGraphicData,
			{
				id: 'c',
				code: ['note vertexShaderBackground', 'noteEnd'],
				creationIndex: 2,
			} as CodeBlockGraphicData,
			{
				id: 'd',
				code: ['note fragmentShaderBackground', 'noteEnd'],
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
