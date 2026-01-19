import { describe, test, expect, beforeEach } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import autoEnvConstants from './effect';

import type { State, CodeBlockGraphicData } from '~/types';

import createDefaultState from '~/pureHelpers/state/createDefaultState';

describe('autoEnvConstants', () => {
	let store: ReturnType<typeof createStateManager<State>>;
	let state: State;

	beforeEach(() => {
		const baseState = {
			...createDefaultState(),
			compiledConfig: {
				...createDefaultState().compiledConfig,
				runtimeSettings: [
					{
						runtime: 'WebWorkerLogicRuntime' as const,
						sampleRate: 48000,
					},
				],
				selectedRuntime: 0,
			},
		};
		store = createStateManager<State>(baseState);
		state = store.getState();
	});

	test('should create env constants block on initialization', () => {
		autoEnvConstants(store);

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		expect(envBlock).toBeDefined();
		expect(envBlock?.blockType).toBe('constants');
	});

	test('should set creationIndex to 0 for env block', () => {
		autoEnvConstants(store);

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		expect(envBlock?.creationIndex).toBe(0);
	});

	test('should include SAMPLE_RATE from runtime config', () => {
		autoEnvConstants(store);

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		const sampleRateLine = envBlock?.code.find(line => line.includes('SAMPLE_RATE'));
		expect(sampleRateLine).toBe('const SAMPLE_RATE 48000');
	});

	test('should include standard environment constants', () => {
		autoEnvConstants(store);

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		expect(envBlock?.code).toContain('const AUDIO_BUFFER_SIZE 128');
		expect(envBlock?.code).toContain('const LEFT_CHANNEL 0');
		expect(envBlock?.code).toContain('const RIGHT_CHANNEL 1');
	});

	test('should include warning comment', () => {
		autoEnvConstants(store);

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		const warningLine = envBlock?.code.find(line => line.includes('Auto-generated'));
		expect(warningLine).toBeDefined();
	});

	test('should update when runtime config changes', () => {
		autoEnvConstants(store);

		// Change sample rate
		store.set('compiledConfig.runtimeSettings', [
			{
				runtime: 'WebWorkerLogicRuntime' as const,
				sampleRate: 44100,
			},
		]);

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		const sampleRateLine = envBlock?.code.find(line => line.includes('SAMPLE_RATE'));
		expect(sampleRateLine).toBe('const SAMPLE_RATE 44100');
	});

	test('should include binary asset sizes when available', () => {
		// Add binary asset with size
		store.set('binaryAssets', [
			{
				fileName: 'test.wav',
				memoryId: 'audioData',
				sizeBytes: 44100,
			},
		]);

		autoEnvConstants(store);

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		const assetSizeLine = envBlock?.code.find(line => line.includes('AUDIODATA_SIZE'));
		expect(assetSizeLine).toBe('const AUDIODATA_SIZE 44100');
	});

	test('should update when binary assets change', () => {
		autoEnvConstants(store);

		// Add binary asset
		store.set('binaryAssets', [
			{
				fileName: 'test.wav',
				memoryId: 'audioData',
				sizeBytes: 88200,
			},
		]);

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		const assetSizeLine = envBlock?.code.find(line => line.includes('AUDIODATA_SIZE'));
		expect(assetSizeLine).toBe('const AUDIODATA_SIZE 88200');
	});

	test('should handle existing env block without duplicating', () => {
		// Create env block first
		autoEnvConstants(store);
		const initialBlockCount = state.graphicHelper.codeBlocks.length;

		// Run again
		autoEnvConstants(store);

		expect(state.graphicHelper.codeBlocks.length).toBe(initialBlockCount);
	});

	test('should increment creationIndex of existing blocks', () => {
		// Add a block first
		const testBlock: CodeBlockGraphicData = {
			width: 0,
			minGridWidth: 32,
			height: 0,
			code: ['module test', 'moduleEnd'],
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
			id: 'test',
			gaps: new Map(),
			gridX: 0,
			gridY: 0,
			x: 0,
			y: 0,
			lineNumberColumnWidth: 2,
			offsetX: 0,
			lastUpdated: Date.now(),
			offsetY: 0,
			creationIndex: 0,
			blockType: 'module',
		};
		store.set('graphicHelper.codeBlocks', [testBlock]);

		autoEnvConstants(store);

		const foundTestBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'test');
		expect(foundTestBlock?.creationIndex).toBe(1);
	});

	test('should properly format memoryId with special characters', () => {
		store.set('binaryAssets', [
			{
				fileName: 'test.wav',
				memoryId: 'audio-data-1',
				sizeBytes: 1024,
			},
		]);

		autoEnvConstants(store);

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		const assetSizeLine = envBlock?.code.find(line => line.includes('AUDIO_DATA_1_SIZE'));
		expect(assetSizeLine).toBe('const AUDIO_DATA_1_SIZE 1024');
	});

	test('should skip binary assets without sizeBytes', () => {
		store.set('binaryAssets', [
			{
				fileName: 'test.wav',
				memoryId: 'audioData',
				// no sizeBytes
			},
		]);

		autoEnvConstants(store);

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		const assetSizeLine = envBlock?.code.find(line => line.includes('AUDIODATA_SIZE'));
		expect(assetSizeLine).toBeUndefined();
	});

	test('should skip binary assets without memoryId', () => {
		store.set('binaryAssets', [
			{
				fileName: 'test.wav',
				sizeBytes: 1024,
				// no memoryId
			},
		]);

		autoEnvConstants(store);

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === 'env');
		// Should not have any binary asset size constants (after the comment line)
		const binaryAssetSection = envBlock?.code.indexOf('// Binary asset sizes in bytes');
		expect(binaryAssetSection).toBe(-1);
	});
});
