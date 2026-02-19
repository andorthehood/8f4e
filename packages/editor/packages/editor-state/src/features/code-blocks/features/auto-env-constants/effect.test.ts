import { describe, test, expect, beforeEach } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import autoEnvConstants from './effect';

import type { State, Project, CodeBlockGraphicData } from '~/types';

import createDefaultState from '~/pureHelpers/state/createDefaultState';
import { EMPTY_DEFAULT_PROJECT } from '~/types';

describe('autoEnvConstants', () => {
	let store: ReturnType<typeof createStateManager<State>>;
	let state: State;

	beforeEach(() => {
		const baseState = {
			...createDefaultState(),
			compiledProjectConfig: {
				...createDefaultState().compiledProjectConfig,
				runtimeSettings: {
					runtime: 'WebWorkerLogicRuntime' as const,
					sampleRate: 48000,
				},
			},
			initialProjectState: {
				...EMPTY_DEFAULT_PROJECT,
			},
		};
		store = createStateManager<State>(baseState);
		state = store.getState();
	});

	test('should create env constants block when project is loaded', () => {
		autoEnvConstants(store);

		// Trigger project load
		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		expect(envBlock).toBeDefined();
		expect(envBlock?.code[0]).toBe('constants env');
	});

	test('should place env block at beginning of codeBlocks array', () => {
		const projectWithBlocks: Project = {
			...EMPTY_DEFAULT_PROJECT,
			codeBlocks: [{ code: ['module test', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } }],
		};

		store.set('initialProjectState', projectWithBlocks);
		autoEnvConstants(store);

		// Trigger another project load to add env block
		store.set('initialProjectState', { ...projectWithBlocks });

		expect(state.initialProjectState?.codeBlocks[0].code[0]).toBe('constants env');
		expect(state.initialProjectState?.codeBlocks[1].code[0]).toBe('module test');
	});

	test('should include SAMPLE_RATE from runtime config', () => {
		autoEnvConstants(store);
		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		const sampleRateLine = envBlock?.code.find(line => line.includes('SAMPLE_RATE'));
		expect(sampleRateLine).toBe('const SAMPLE_RATE 48000');
		const invSampleRateLine = envBlock?.code.find(line => line.includes('INV_SAMPLE_RATE'));
		expect(invSampleRateLine).toBe('const INV_SAMPLE_RATE 0.000020833333333333333');
	});

	test('should include standard environment constants', () => {
		autoEnvConstants(store);
		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		expect(envBlock?.code).toContain('const AUDIO_BUFFER_SIZE 128');
	});

	test('should include warning comment', () => {
		autoEnvConstants(store);
		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		const warningLine = envBlock?.code.find(line => line.includes('Auto-generated'));
		expect(warningLine).toBeDefined();
	});

	test('should update when runtime config changes', () => {
		autoEnvConstants(store);
		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		// Simulate graphicHelper populating codeBlocks from initialProjectState
		const envCodeBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		if (envCodeBlock) {
			const graphicBlock: Partial<CodeBlockGraphicData> = {
				id: 'env',
				code: envCodeBlock.code,
				creationIndex: 0,
				blockType: 'constants',
				width: 0,
				height: 0,
				codeColors: [],
				codeToRender: [],
				extras: {
					blockHighlights: [],
					inputs: [],
					outputs: [],
					debuggers: [],
					switches: [],
					buttons: [],
					pianoKeyboards: [],
					bufferPlotters: [],
					errorMessages: [],
				},
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				gaps: new Map(),
				gridX: 0,
				gridY: 0,
				x: 0,
				y: 0,
				lineNumberColumnWidth: 2,
				offsetX: 0,
				offsetY: 0,
				lastUpdated: Date.now(),
			};
			store.set('graphicHelper.codeBlocks', [graphicBlock as CodeBlockGraphicData]);
		}

		// Change sample rate
		store.set('compiledProjectConfig.runtimeSettings', {
			runtime: 'WebWorkerLogicRuntime' as const,
			sampleRate: 44100,
		});

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		const sampleRateLine = envBlock?.code.find(line => line.includes('SAMPLE_RATE'));
		expect(sampleRateLine).toBe('const SAMPLE_RATE 44100');
		const invSampleRateLine = envBlock?.code.find(line => line.includes('INV_SAMPLE_RATE'));
		expect(invSampleRateLine).toBe('const INV_SAMPLE_RATE 0.000022675736961451248');
	});

	test('should include binary asset sizes when available', () => {
		autoEnvConstants(store);

		// Add binary asset with size
		store.set('binaryAssets', [
			{
				url: 'https://example.com/test.wav',
				fileName: 'test.wav',
				assetByteLength: 44100,
				loadedIntoMemory: false,
			},
		]);

		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		const assetSizeLine = envBlock?.code.find(line => line.includes('ASSET_0_SIZE'));
		expect(assetSizeLine).toBe('const ASSET_0_SIZE 44100');
	});

	test('should update when binary assets change', () => {
		autoEnvConstants(store);
		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		// Simulate graphicHelper populating codeBlocks from initialProjectState
		const envCodeBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		if (envCodeBlock) {
			const graphicBlock: Partial<CodeBlockGraphicData> = {
				id: 'env',
				code: envCodeBlock.code,
				creationIndex: 0,
				blockType: 'constants',
				width: 0,
				height: 0,
				codeColors: [],
				codeToRender: [],
				extras: {
					blockHighlights: [],
					inputs: [],
					outputs: [],
					debuggers: [],
					switches: [],
					buttons: [],
					pianoKeyboards: [],
					bufferPlotters: [],
					errorMessages: [],
				},
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				gaps: new Map(),
				gridX: 0,
				gridY: 0,
				x: 0,
				y: 0,
				lineNumberColumnWidth: 2,
				offsetX: 0,
				offsetY: 0,
			};
			store.set('graphicHelper.codeBlocks', [graphicBlock as CodeBlockGraphicData]);
		}

		// Add binary asset
		store.set('binaryAssets', [
			{
				url: 'https://example.com/test.wav',
				fileName: 'test.wav',
				assetByteLength: 88200,
				loadedIntoMemory: false,
			},
		]);

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		const assetSizeLine = envBlock?.code.find(line => line.includes('ASSET_0_SIZE'));
		expect(assetSizeLine).toBe('const ASSET_0_SIZE 88200');
	});

	test('should preserve existing @pos when regenerating env block', () => {
		autoEnvConstants(store);
		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envCodeBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		if (envCodeBlock) {
			const codeWithCustomPos = [...envCodeBlock.code];
			codeWithCustomPos[1] = '; @pos 12 -7';
			const graphicBlock: Partial<CodeBlockGraphicData> = {
				id: 'env',
				code: codeWithCustomPos,
				creationIndex: 0,
				blockType: 'constants',
				width: 0,
				height: 0,
				codeColors: [],
				codeToRender: [],
				extras: {
					blockHighlights: [],
					inputs: [],
					outputs: [],
					debuggers: [],
					switches: [],
					buttons: [],
					pianoKeyboards: [],
					bufferPlotters: [],
					errorMessages: [],
				},
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				gaps: new Map(),
				gridX: 12,
				gridY: -7,
				x: 0,
				y: 0,
				lineNumberColumnWidth: 2,
				offsetX: 0,
				offsetY: 0,
			};
			store.set('graphicHelper.codeBlocks', [graphicBlock as CodeBlockGraphicData]);
		}

		store.set('compiledProjectConfig.runtimeSettings', {
			runtime: 'WebWorkerLogicRuntime' as const,
			sampleRate: 44100,
		});

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		expect(envBlock?.code).toContain('; @pos 12 -7');
	});

	test('should default @pos to 0,0 when existing env block has no @pos', () => {
		autoEnvConstants(store);
		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envCodeBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		if (envCodeBlock) {
			const codeWithoutPos = envCodeBlock.code.filter(line => !line.includes('@pos'));
			const graphicBlock: Partial<CodeBlockGraphicData> = {
				id: 'env',
				code: codeWithoutPos,
				creationIndex: 0,
				blockType: 'constants',
				width: 0,
				height: 0,
				codeColors: [],
				codeToRender: [],
				extras: {
					blockHighlights: [],
					inputs: [],
					outputs: [],
					debuggers: [],
					switches: [],
					buttons: [],
					pianoKeyboards: [],
					bufferPlotters: [],
					errorMessages: [],
				},
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				gaps: new Map(),
				gridX: 0,
				gridY: 0,
				x: 0,
				y: 0,
				lineNumberColumnWidth: 2,
				offsetX: 0,
				offsetY: 0,
			};
			store.set('graphicHelper.codeBlocks', [graphicBlock as CodeBlockGraphicData]);
		}

		store.set('compiledProjectConfig.runtimeSettings', {
			runtime: 'WebWorkerLogicRuntime' as const,
			sampleRate: 44100,
		});

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		expect(envBlock?.code).toContain('; @pos 0 0');
	});

	test('should not duplicate env block if already exists', () => {
		const projectWithEnv: Project = {
			...EMPTY_DEFAULT_PROJECT,
			codeBlocks: [
				{
					code: [
						'constants env',
						'const SAMPLE_RATE 48000',
						'const INV_SAMPLE_RATE 0.000020833333333333333',
						'constantsEnd',
					],
					gridCoordinates: { x: 0, y: 0 },
				},
			],
		};

		store.set('initialProjectState', projectWithEnv);
		autoEnvConstants(store);

		// Trigger another load
		store.set('initialProjectState', { ...projectWithEnv });

		const envBlocks = state.initialProjectState?.codeBlocks.filter(block => block.code[0]?.includes('constants env'));
		expect(envBlocks?.length).toBe(1);
	});

	test('should include file name comments for binary asset sizes', () => {
		autoEnvConstants(store);

		store.set('binaryAssets', [
			{
				url: 'https://example.com/test.wav',
				fileName: 'test.wav',
				assetByteLength: 1024,
				loadedIntoMemory: false,
			},
		]);

		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		const assetCommentLine = envBlock?.code.find(line => line.includes("; 'test.wav'"));
		const assetSizeLine = envBlock?.code.find(line => line.includes('ASSET_0_SIZE'));
		expect(assetCommentLine).toBe("; 'test.wav'");
		expect(assetSizeLine).toBe('const ASSET_0_SIZE 1024');
	});

	test('should skip binary assets without assetByteLength', () => {
		autoEnvConstants(store);

		store.set('binaryAssets', [
			{
				url: 'https://example.com/test.wav',
				fileName: 'test.wav',
				// no assetByteLength
				loadedIntoMemory: false,
			},
		]);

		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		const assetSizeLine = envBlock?.code.find(line => line.includes('ASSET_0_SIZE'));
		expect(assetSizeLine).toBeUndefined();
	});

	test('should skip binary assets without file metadata', () => {
		autoEnvConstants(store);

		store.set('binaryAssets', [
			{
				url: 'https://example.com/test.wav',
				loadedIntoMemory: false,
			},
		]);

		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		const binaryAssetSection = envBlock?.code.indexOf('// Binary asset sizes in bytes');
		expect(binaryAssetSection).toBe(-1);
	});
});
