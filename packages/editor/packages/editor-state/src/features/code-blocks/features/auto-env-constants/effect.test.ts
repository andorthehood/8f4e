import { describe, test, expect, beforeEach } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import autoEnvConstants from './effect';

import type { State, Project, CodeBlockGraphicData } from '~/types';

import createDefaultState from '~/pureHelpers/state/createDefaultState';
import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { EMPTY_DEFAULT_PROJECT } from '~/types';

const AUTO_ENV_BLOCK_ID = 'constants_env';
const PROJECT_WITH_SAMPLE_RATE_DIRECTIVE: Project = {
	...EMPTY_DEFAULT_PROJECT,
	codeBlocks: [{ code: ['module rate', '; ~sampleRate 48000', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } }],
};

function resolveSampleRateFromDirectives(
	codeBlocks: Array<{
		parsedDirectives: Array<{ prefix: '@' | '~'; name: string; args: string[]; rawRow: number; isTrailing: boolean }>;
		id?: string | number;
	}>
) {
	let sampleRate = 50;
	for (const block of codeBlocks) {
		for (const directive of block.parsedDirectives) {
			if (directive.prefix === '~' && directive.name === 'sampleRate' && directive.args[0]) {
				sampleRate = Number(directive.args[0]);
			}
		}
	}

	return { sampleRate, errors: [] };
}

function getRuntimeEnvConstants(
	codeBlocks: Array<{
		parsedDirectives: Array<{ prefix: '@' | '~'; name: string; args: string[]; rawRow: number; isTrailing: boolean }>;
		id?: string | number;
	}>
) {
	const { sampleRate } = resolveSampleRateFromDirectives(codeBlocks);

	return [`const SAMPLE_RATE ${sampleRate}`, `const INV_SAMPLE_RATE ${1 / sampleRate}`];
}

function createGraphicEnvBlock(code: string[], overrides: Partial<CodeBlockGraphicData> = {}): CodeBlockGraphicData {
	return createMockCodeBlock({
		id: AUTO_ENV_BLOCK_ID,
		code,
		creationIndex: 0,
		blockType: 'constants',
		width: 0,
		height: 0,
		gridX: 0,
		gridY: 0,
		lineNumberColumnWidth: 2,
		...overrides,
	});
}

describe('autoEnvConstants', () => {
	let store: ReturnType<typeof createStateManager<State>>;
	let state: State;

	beforeEach(() => {
		const baseState = {
			...createDefaultState(),
			runtimeRegistry: {
				WebWorkerLogicRuntime: {
					id: 'WebWorkerLogicRuntime',
					defaults: { sampleRate: 50 },
					schema: { type: 'object', properties: {} },
					resolveRuntimeDirectives: codeBlocks => resolveSampleRateFromDirectives(codeBlocks),
					getEnvConstants: codeBlocks => getRuntimeEnvConstants(codeBlocks),
					factory: () => () => {},
				},
			},
			defaultRuntimeId: 'WebWorkerLogicRuntime',
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
		store.set('initialProjectState', { ...PROJECT_WITH_SAMPLE_RATE_DIRECTIVE });

		const envBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		const sampleRateLine = envBlock?.code.find(line => line.includes('SAMPLE_RATE'));
		expect(sampleRateLine).toBe('const SAMPLE_RATE 48000');
		const invSampleRateLine = envBlock?.code.find(line => line.includes('INV_SAMPLE_RATE'));
		expect(invSampleRateLine).toBe('const INV_SAMPLE_RATE 0.000020833333333333333');
	});

	test('should only include AUDIO_BUFFER_SIZE when the selected runtime contributes it', () => {
		autoEnvConstants(store);
		store.set('initialProjectState', { ...PROJECT_WITH_SAMPLE_RATE_DIRECTIVE });

		const envBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		expect(envBlock?.code).not.toContain('const AUDIO_BUFFER_SIZE 128');

		store.set('runtimeRegistry', {
			AudioWorkletRuntime: {
				id: 'AudioWorkletRuntime',
				defaults: { sampleRate: 44100 },
				schema: { type: 'object', properties: {} },
				resolveRuntimeDirectives: codeBlocks => resolveSampleRateFromDirectives(codeBlocks),
				getEnvConstants: codeBlocks => [...getRuntimeEnvConstants(codeBlocks), 'const AUDIO_BUFFER_SIZE 128'],
				factory: () => () => {},
			},
		});
		store.set('defaultRuntimeId', 'AudioWorkletRuntime');
		store.set('editorConfig.runtime', 'AudioWorkletRuntime');
		store.set('initialProjectState', { ...PROJECT_WITH_SAMPLE_RATE_DIRECTIVE });

		const audioWorkletEnvBlock = state.initialProjectState?.codeBlocks.find(block =>
			block.code[0]?.includes('constants env')
		);
		expect(audioWorkletEnvBlock?.code).toContain('const AUDIO_BUFFER_SIZE 128');
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
			store.set('graphicHelper.codeBlocks', [createGraphicEnvBlock(envCodeBlock.code)]);
		}

		store.set('graphicHelper.codeBlocks', [
			...(state.graphicHelper.codeBlocks.filter(block => block.id !== AUTO_ENV_BLOCK_ID) ?? []),
			createMockCodeBlock({
				id: 'module_rate',
				code: ['module rate', '; ~sampleRate 44100', 'moduleEnd'],
				parsedDirectives: [{ prefix: '~', name: 'sampleRate', args: ['44100'], rawRow: 1, isTrailing: false }],
				moduleId: 'rate',
				blockType: 'module',
			}),
			createGraphicEnvBlock(envCodeBlock?.code ?? []),
		]);
		store.set('editorConfig.runtime', 'WebWorkerLogicRuntime');

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === AUTO_ENV_BLOCK_ID);
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

	test('should use binary asset id in generated size constants when present', () => {
		autoEnvConstants(store);

		store.set('binaryAssets', [
			{
				id: 'snare',
				url: 'https://example.com/snare.wav',
				fileName: 'snare.wav',
				assetByteLength: 22050,
				loadedIntoMemory: false,
			},
		]);

		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		const assetSizeLine = envBlock?.code.find(line => line.includes('ASSET_SNARE_SIZE'));
		expect(assetSizeLine).toBe('const ASSET_SNARE_SIZE 22050');
	});

	test('should update when binary assets change', () => {
		autoEnvConstants(store);
		store.set('initialProjectState', { ...PROJECT_WITH_SAMPLE_RATE_DIRECTIVE });

		// Simulate graphicHelper populating codeBlocks from initialProjectState
		const envCodeBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		if (envCodeBlock) {
			store.set('graphicHelper.codeBlocks', [createGraphicEnvBlock(envCodeBlock.code)]);
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

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === AUTO_ENV_BLOCK_ID);
		const assetSizeLine = envBlock?.code.find(line => line.includes('ASSET_0_SIZE'));
		expect(assetSizeLine).toBe('const ASSET_0_SIZE 88200');
	});

	test('should preserve existing @pos when regenerating env block', () => {
		autoEnvConstants(store);
		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envCodeBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		let codeWithCustomPos: string[] = [];
		if (envCodeBlock) {
			codeWithCustomPos = [...envCodeBlock.code];
			codeWithCustomPos[1] = '; @pos 12 -7';
			store.set('graphicHelper.codeBlocks', [createGraphicEnvBlock(codeWithCustomPos, { gridX: 12, gridY: -7 })]);
		}

		store.set('graphicHelper.codeBlocks', [
			createGraphicEnvBlock(codeWithCustomPos, { gridX: 12, gridY: -7 }),
			createMockCodeBlock({
				id: 'module_rate',
				code: ['module rate', '; ~sampleRate 44100', 'moduleEnd'],
				parsedDirectives: [{ prefix: '~', name: 'sampleRate', args: ['44100'], rawRow: 1, isTrailing: false }],
				moduleId: 'rate',
				blockType: 'module',
			}),
		]);
		store.set('editorConfig.runtime', 'WebWorkerLogicRuntime');

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === AUTO_ENV_BLOCK_ID);
		expect(envBlock?.code).toContain('; @pos 12 -7');
	});

	test('should default @pos to 0,0 when existing env block has no @pos', () => {
		autoEnvConstants(store);
		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envCodeBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		let codeWithoutPos: string[] = [];
		if (envCodeBlock) {
			codeWithoutPos = envCodeBlock.code.filter(line => !line.includes('@pos'));
			store.set('graphicHelper.codeBlocks', [createGraphicEnvBlock(codeWithoutPos)]);
		}

		store.set('graphicHelper.codeBlocks', [
			createGraphicEnvBlock(codeWithoutPos),
			createMockCodeBlock({
				id: 'module_rate',
				code: ['module rate', '; ~sampleRate 44100', 'moduleEnd'],
				parsedDirectives: [{ prefix: '~', name: 'sampleRate', args: ['44100'], rawRow: 1, isTrailing: false }],
				moduleId: 'rate',
				blockType: 'module',
			}),
		]);
		store.set('editorConfig.runtime', 'WebWorkerLogicRuntime');

		const envBlock = state.graphicHelper.codeBlocks.find(block => block.id === AUTO_ENV_BLOCK_ID);
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

	test('should emit each asset size constant only once for duplicate asset ids', () => {
		autoEnvConstants(store);

		store.set('binaryAssets', [
			{
				id: 'amen',
				url: 'https://example.com/amen.pcm',
				fileName: 'amen.pcm',
				assetByteLength: 1024,
				loadedIntoMemory: true,
				memoryId: 'playerA.buffer',
			},
			{
				id: 'amen',
				url: 'https://example.com/amen.pcm',
				fileName: 'amen.pcm',
				assetByteLength: 1024,
				loadedIntoMemory: true,
				memoryId: 'playerB.buffer',
			},
		]);

		store.set('initialProjectState', { ...EMPTY_DEFAULT_PROJECT });

		const envBlock = state.initialProjectState?.codeBlocks.find(block => block.code[0]?.includes('constants env'));
		const sizeLines = envBlock?.code.filter(line => line.includes('const ASSET_AMEN_SIZE'));
		expect(sizeLines).toEqual(['const ASSET_AMEN_SIZE 1024']);
	});
});
