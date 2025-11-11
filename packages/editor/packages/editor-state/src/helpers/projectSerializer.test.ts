import { describe, it, expect } from 'vitest';

import { convertGraphicDataToProjectStructure, serializeToProject } from './projectSerializer';
import { createMockCodeBlock } from './testUtils';

import type { State } from '../types';

describe('projectSerializer', () => {
	describe('convertGraphicDataToProjectStructure', () => {
		it('converts graphic data to simplified project structure', () => {
			const graphicData = [
				createMockCodeBlock({
					id: 'test-module',
					code: ['test code'],
					trimmedCode: ['test code'],
					x: 80,
					y: 128,
					gridX: 10,
					gridY: 8,
				}),
			];

			const result = convertGraphicDataToProjectStructure(graphicData);

			expect(result).toMatchSnapshot();
		});

		it('sorts code blocks by id', () => {
			const blockA = createMockCodeBlock({
				id: 'module-b',
				code: ['code b'],
				trimmedCode: ['code b'],
			});

			const blockB = createMockCodeBlock({
				id: 'module-a',
				code: ['code a'],
				trimmedCode: ['code a'],
			});

			const result = convertGraphicDataToProjectStructure([blockA, blockB]);

			expect(result[0].code).toEqual(['code a']);
			expect(result[1].code).toEqual(['code b']);
		});
	});

	describe('serializeToProject', () => {
		it('creates a valid Project object from state', () => {
			const mockState = {
				projectInfo: {
					title: 'Test Project',
					author: 'Test Author',
					description: 'Test Description',
				},
				graphicHelper: {
					codeBlocks: new Set(),
					viewport: {
						x: 0,
						y: 0,
						vGrid: 8,
						hGrid: 16,
					},
					postProcessEffects: [],
				},
				compiler: {
					compiledModules: {},
					compilerOptions: {
						memorySizeBytes: 1048576,
					},
					selectedRuntime: 0,
					runtimeSettings: [{ runtime: 'WebWorkerLogicRuntime' as const, sampleRate: 50 }],
					binaryAssets: [],
				},
			} as unknown as State;

			const result = serializeToProject(mockState);

			expect(result).toMatchSnapshot();
		});
	});
});
