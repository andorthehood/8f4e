import { describe, it, expect } from 'vitest';

import { convertGraphicDataToProjectStructure, serializeToProject } from './projectSerializer';

import type { CodeBlockGraphicData, State } from '../types';

describe('projectSerializer', () => {
	describe('convertGraphicDataToProjectStructure', () => {
		it('converts graphic data to simplified project structure', () => {
			const graphicData: CodeBlockGraphicData[] = [
				{
					id: 'test-module',
					code: ['test code'],
					trimmedCode: ['test code'],
					x: 80, // 10 * vGrid
					y: 128, // 8 * hGrid
					gridX: 10,
					gridY: 8,
					width: 100,
					minGridWidth: 32,
					height: 50,
					codeColors: [],
					codeToRender: [],
					gaps: new Map(),
					cursor: { col: 0, row: 0, x: 0, y: 0 },
					offsetX: 0,
					offsetY: 0,
					padLength: 1,
					viewport: { x: 0, y: 0 },
					codeBlocks: new Set(),
					extras: {
						inputs: new Map(),
						outputs: new Map(),
						debuggers: new Map(),
						switches: new Map(),
						buttons: new Map(),
						pianoKeyboards: new Map(),
						bufferPlotters: new Map(),
						errorMessages: new Map(),
					},
					lastUpdated: Date.now(),
				},
			];

			const result = convertGraphicDataToProjectStructure(graphicData, 8, 16);

			expect(result).toEqual([
				{
					code: ['test code'],
					x: 10,
					y: 8,
					viewport: undefined,
					codeBlocks: undefined,
				},
			]);
		});

		it('includes viewport for code blocks with nested code blocks', () => {
			const nestedBlock: CodeBlockGraphicData = {
				id: 'nested-module',
				code: ['nested code'],
				trimmedCode: ['nested code'],
				x: 16,
				y: 32,
				gridX: 2,
				gridY: 2,
				width: 100,
				minGridWidth: 32,
				height: 50,
				codeColors: [],
				codeToRender: [],
				gaps: new Map(),
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				offsetX: 0,
				offsetY: 0,
				padLength: 1,
				viewport: { x: 0, y: 0 },
				codeBlocks: new Set(),
				extras: {
					inputs: new Map(),
					outputs: new Map(),
					debuggers: new Map(),
					switches: new Map(),
					buttons: new Map(),
					pianoKeyboards: new Map(),
					bufferPlotters: new Map(),
					errorMessages: new Map(),
				},
				lastUpdated: Date.now(),
			};

			const parentBlock: CodeBlockGraphicData = {
				id: 'parent-module',
				code: ['parent code'],
				trimmedCode: ['parent code'],
				x: 80,
				y: 128,
				gridX: 10,
				gridY: 8,
				width: 100,
				minGridWidth: 32,
				height: 50,
				codeColors: [],
				codeToRender: [],
				gaps: new Map(),
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				offsetX: 0,
				offsetY: 0,
				padLength: 1,
				viewport: { x: 40, y: 64 },
				codeBlocks: new Set([nestedBlock]),
				extras: {
					inputs: new Map(),
					outputs: new Map(),
					debuggers: new Map(),
					switches: new Map(),
					buttons: new Map(),
					pianoKeyboards: new Map(),
					bufferPlotters: new Map(),
					errorMessages: new Map(),
				},
				lastUpdated: Date.now(),
			};

			const result = convertGraphicDataToProjectStructure([parentBlock], 8, 16);

			expect(result).toEqual([
				{
					code: ['parent code'],
					x: 10,
					y: 8,
					viewport: {
						x: 5, // 40 / 8 (using viewport.x - the scroll position within the nested block container)
						y: 4, // 64 / 16 (using viewport.y - the scroll position within the nested block container)
					},
					codeBlocks: [
						{
							code: ['nested code'],
							x: 2,
							y: 2,
							viewport: undefined,
							codeBlocks: undefined,
						},
					],
				},
			]);
		});

		it('sorts code blocks by id', () => {
			const blockA: CodeBlockGraphicData = {
				id: 'module-b',
				code: ['code b'],
				trimmedCode: ['code b'],
				x: 0,
				y: 0,
				gridX: 0,
				gridY: 0,
				width: 100,
				minGridWidth: 32,
				height: 50,
				codeColors: [],
				codeToRender: [],
				gaps: new Map(),
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				offsetX: 0,
				offsetY: 0,
				padLength: 1,
				viewport: { x: 0, y: 0 },
				codeBlocks: new Set(),
				extras: {
					inputs: new Map(),
					outputs: new Map(),
					debuggers: new Map(),
					switches: new Map(),
					buttons: new Map(),
					pianoKeyboards: new Map(),
					bufferPlotters: new Map(),
					errorMessages: new Map(),
				},
				lastUpdated: Date.now(),
			};

			const blockB: CodeBlockGraphicData = {
				id: 'module-a',
				code: ['code a'],
				trimmedCode: ['code a'],
				x: 0,
				y: 0,
				gridX: 0,
				gridY: 0,
				width: 100,
				minGridWidth: 32,
				height: 50,
				codeColors: [],
				codeToRender: [],
				gaps: new Map(),
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				offsetX: 0,
				offsetY: 0,
				padLength: 1,
				viewport: { x: 0, y: 0 },
				codeBlocks: new Set(),
				extras: {
					inputs: new Map(),
					outputs: new Map(),
					debuggers: new Map(),
					switches: new Map(),
					buttons: new Map(),
					pianoKeyboards: new Map(),
					bufferPlotters: new Map(),
					errorMessages: new Map(),
				},
				lastUpdated: Date.now(),
			};

			const result = convertGraphicDataToProjectStructure([blockA, blockB], 8, 16);

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
					activeViewport: {
						codeBlocks: new Set(),
						viewport: { x: 0, y: 0 },
					},
					globalViewport: {
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

			expect(result).toEqual({
				title: 'Test Project',
				author: 'Test Author',
				description: 'Test Description',
				codeBlocks: [],
				viewport: { x: 0, y: 0 },
				selectedRuntime: 0,
				runtimeSettings: [{ runtime: 'WebWorkerLogicRuntime', sampleRate: 50 }],
				binaryAssets: [],
				compiledModules: {},
				memorySizeBytes: 1048576,
				postProcessEffects: [],
			});
		});
	});
});
