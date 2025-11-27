import { describe, it, expect } from 'vitest';

import type { Project } from './types';

describe('Project postProcessEffects', () => {
	it('should accept projects with postProcessEffects defined', () => {
		const projectWithEffects: Project = {
			title: 'Test Project',
			author: 'Test Author',
			description: 'Test Description',
			codeBlocks: [],
			viewport: { x: 0, y: 0 },
			selectedRuntime: 0,
			runtimeSettings: [
				{
					runtime: 'WebWorkerLogicRuntime',
					sampleRate: 50,
				},
			],
			postProcessEffects: [
				{
					name: 'test-effect',
					vertexShader: 'vertex shader code',
					fragmentShader: 'fragment shader code',
					enabled: true,
				},
			],
			memorySizeBytes: 1048576,
		};

		expect(projectWithEffects.postProcessEffects).toBeDefined();
		expect(projectWithEffects.postProcessEffects!.length).toBe(1);
		expect(projectWithEffects.postProcessEffects![0].name).toBe('test-effect');
	});

	it('should accept projects without postProcessEffects defined', () => {
		const projectWithoutEffects: Project = {
			title: 'Test Project',
			author: 'Test Author',
			description: 'Test Description',
			codeBlocks: [],
			viewport: { x: 0, y: 0 },
			selectedRuntime: 0,
			runtimeSettings: [
				{
					runtime: 'WebWorkerLogicRuntime',
					sampleRate: 50,
				},
			],
			memorySizeBytes: 1048576,
		};

		expect(projectWithoutEffects.postProcessEffects).toBeUndefined();
	});

	it('should accept projects with multiple postProcessEffects', () => {
		const projectWithMultipleEffects: Project = {
			title: 'Test Project',
			author: 'Test Author',
			description: 'Test Description',
			codeBlocks: [],
			viewport: { x: 0, y: 0 },
			selectedRuntime: 0,
			runtimeSettings: [
				{
					runtime: 'WebWorkerLogicRuntime',
					sampleRate: 50,
				},
			],
			postProcessEffects: [
				{
					name: 'crt',
					vertexShader: 'crt vertex shader',
					fragmentShader: 'crt fragment shader',
					enabled: true,
				},
				{
					name: 'bloom',
					vertexShader: 'bloom vertex shader',
					fragmentShader: 'bloom fragment shader',
					enabled: false,
				},
			],
			memorySizeBytes: 1048576,
		};

		expect(projectWithMultipleEffects.postProcessEffects).toBeDefined();
		expect(projectWithMultipleEffects.postProcessEffects!.length).toBe(2);
		expect(projectWithMultipleEffects.postProcessEffects![0].name).toBe('crt');
		expect(projectWithMultipleEffects.postProcessEffects![1].name).toBe('bloom');
		expect(projectWithMultipleEffects.postProcessEffects![0].enabled).toBe(true);
		expect(projectWithMultipleEffects.postProcessEffects![1].enabled).toBe(false);
	});
});
