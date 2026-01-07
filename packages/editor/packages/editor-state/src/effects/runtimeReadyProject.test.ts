import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import compiler from './compiler';
import projectExport from './projectExport';

import { createMockState, createMockCodeBlock } from '../pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../pureHelpers/testingUtils/vitestTestUtils';
import encodeUint8ArrayToBase64 from '../pureHelpers/base64/base64Encoder';

import type { State } from '../types';

const { decodeBase64ToUint8ArrayMock, createTypedArrayMock } = vi.hoisted(() => {
	const decodeBase64ToUint8ArrayMock = vi.fn((base64: string) => {
		const binaryString = atob(base64);
		return new Uint8Array(binaryString.split('').map(char => char.charCodeAt(0)));
	});

	const createTypedArrayMock = <T extends Int32Array | Float32Array>(
		ctor: new (buffer: ArrayBuffer, byteOffset: number, length: number) => T,
		errorMessage: string
	) => {
		return vi.fn((base64: string) => {
			const uint8Array = decodeBase64ToUint8ArrayMock(base64);

			if (uint8Array.byteLength % 4 !== 0) {
				throw new Error(errorMessage);
			}

			return new ctor(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength / 4);
		});
	};

	return { decodeBase64ToUint8ArrayMock, createTypedArrayMock };
});

vi.mock('../pureHelpers/base64/decodeBase64ToUint8Array', () => ({
	default: decodeBase64ToUint8ArrayMock,
}));

vi.mock('../pureHelpers/base64/decodeBase64ToInt32Array', () => ({
	default: createTypedArrayMock(
		Int32Array,
		'Invalid base64 data: byte length must be a multiple of 4 to decode as Int32Array'
	),
}));

vi.mock('../pureHelpers/base64/decodeBase64ToFloat32Array', () => ({
	default: createTypedArrayMock(
		Float32Array,
		'Invalid base64 data: byte length must be a multiple of 4 to decode as Float32Array'
	),
}));

describe('Runtime-ready project functionality', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let mockExportProject: MockInstance;
	let mockCompileConfig: MockInstance;

	beforeEach(() => {
		mockExportProject = vi.fn().mockResolvedValue(undefined);
		mockCompileConfig = vi.fn().mockResolvedValue({
			config: { memorySizeBytes: 1048576 },
			errors: [],
		});

		// Create a config block for testing
		const configBlock = createMockCodeBlock({
			id: 'config-block',
			code: ['config', 'scope "memorySizeBytes"', 'push 1048576', 'set', 'popScope', 'configEnd'],
			creationIndex: 0,
			blockType: 'config',
		});

		mockState = createMockState({
			compiler: {
				codeBuffer: new Uint8Array([1, 2, 3, 4, 5]), // Mock compiled WASM
				compiledModules: {},
			},
			callbacks: {
				exportProject: mockExportProject,
				compileConfig: mockCompileConfig,
				requestRuntime: vi.fn(),
				getListOfModules: vi.fn(),
				getModule: vi.fn(),
				getListOfProjects: vi.fn(),
				getProject: vi.fn(),
				compileCode: vi.fn(),
				loadSession: vi.fn(),
			},
			editorSettings: {
				colorScheme: 'default',
				font: '6x10',
			},
			featureFlags: {
				contextMenu: true,
				infoOverlay: true,
				moduleDragging: true,
				viewportDragging: true,
				persistentStorage: true,
				editing: true,
				demoMode: false,
				viewportAnimations: true,
			},
		});

		// Add the config block to the state
		mockState.graphicHelper.codeBlocks.push(configBlock);

		mockEvents = createMockEventDispatcherWithVitest();
		store = createStateManager(mockState);
	});

	describe('Runtime-ready export', () => {
		it('should export project with compiled WASM as base64', async () => {
			// Set up save functionality
			projectExport(store, mockEvents);

			// Get the exportRuntimeReadyProject callback
			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportRuntimeReadyProjectCall = onCalls.find(call => call[0] === 'exportRuntimeReadyProject');
			expect(exportRuntimeReadyProjectCall).toBeDefined();

			const exportRuntimeReadyProjectCallback = exportRuntimeReadyProjectCall![1];

			// Trigger the exportRuntimeReadyProject action
			await exportRuntimeReadyProjectCallback();

			// Verify exportProject was called with the right parameters
			expect(mockExportProject).toHaveBeenCalledTimes(1);
			const [exportedJson, fileName] = mockExportProject.mock.calls[0];

			expect(fileName).toBe('project-runtime-ready.json');

			// Parse the exported JSON and verify it contains compiledWasm
			const exportedProject = JSON.parse(exportedJson);
			expect(exportedProject.compiledWasm).toBeDefined();
			expect(typeof exportedProject.compiledWasm).toBe('string');

			// Verify the base64 encoding is correct using the same encoder as the implementation
			const expectedBase64 = encodeUint8ArrayToBase64(mockState.compiler.codeBuffer!);
			expect(exportedProject.compiledWasm).toBe(expectedBase64);
		});

		it('should include compiledConfig in runtime-ready export', async () => {
			// Set up save functionality
			projectExport(store, mockEvents);

			// Get the exportRuntimeReadyProject callback
			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportRuntimeReadyProjectCall = onCalls.find(call => call[0] === 'exportRuntimeReadyProject');
			expect(exportRuntimeReadyProjectCall).toBeDefined();

			const exportRuntimeReadyProjectCallback = exportRuntimeReadyProjectCall![1];

			// Trigger the exportRuntimeReadyProject action
			await exportRuntimeReadyProjectCallback();

			// Verify exportProject was called with the right parameters
			expect(mockExportProject).toHaveBeenCalledTimes(1);
			const [exportedJson] = mockExportProject.mock.calls[0];

			// Parse the exported JSON and verify it contains compiledConfig
			const exportedProject = JSON.parse(exportedJson);
			expect(exportedProject.compiledConfig).toBeDefined();
			expect(exportedProject.compiledConfig.memorySizeBytes).toBe(1048576);
		});

		it('should trim memory snapshot to the allocated memory size', async () => {
			const backingBuffer = new ArrayBuffer(16);
			const bytes = new Uint8Array(backingBuffer);
			for (let i = 0; i < bytes.length; i += 1) {
				bytes[i] = i + 1;
			}

			mockState.compiler.memoryBuffer = new Int32Array(backingBuffer);
			mockState.compiler.memoryBufferFloat = new Float32Array(backingBuffer);
			mockState.compiler.allocatedMemorySize = 8;

			// Set up save functionality
			projectExport(store, mockEvents);

			// Get the exportRuntimeReadyProject callback
			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportRuntimeReadyProjectCall = onCalls.find(call => call[0] === 'exportRuntimeReadyProject');
			expect(exportRuntimeReadyProjectCall).toBeDefined();

			const exportRuntimeReadyProjectCallback = exportRuntimeReadyProjectCall![1];

			// Trigger the exportRuntimeReadyProject action
			await exportRuntimeReadyProjectCallback();

			expect(mockExportProject).toHaveBeenCalledTimes(1);

			const [exportedJson] = mockExportProject.mock.calls[0];
			const exportedProject = JSON.parse(exportedJson);
			const expectedBase64 = encodeUint8ArrayToBase64(new Uint8Array(backingBuffer, 0, 8));

			expect(exportedProject.memorySnapshot).toBe(expectedBase64);
		});

		it('should warn when no compiled WASM is available', async () => {
			// Remove compiled WASM by setting it to an empty array
			mockState.compiler.codeBuffer = new Uint8Array(0);

			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			// Set up save functionality
			projectExport(store, mockEvents);

			// Get the exportRuntimeReadyProject callback
			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportRuntimeReadyProjectCall = onCalls.find(call => call[0] === 'exportRuntimeReadyProject');
			const exportRuntimeReadyProjectCallback = exportRuntimeReadyProjectCall![1];

			// Trigger the exportRuntimeReadyProject action
			await exportRuntimeReadyProjectCallback();

			// Verify warning was logged and export was not called
			expect(consoleSpy).toHaveBeenCalledWith(
				'No compiled WebAssembly code available. Please compile your project first.'
			);
			expect(mockExportProject).not.toHaveBeenCalled();

			consoleSpy.mockRestore();
		});
	});

	describe('Pre-compiled WASM loading', () => {
		it('should use pre-compiled WASM bytecode when available', async () => {
			// Set up a project with pre-compiled WASM already decoded (as done by loader)
			const mockWasmBytecode = new Uint8Array([10, 20, 30, 40, 50]);
			const memoryFloats = new Float32Array([1.5, -2.25, 0.5, 2.75]);
			const memoryBufferCopy = memoryFloats.buffer.slice(0);
			const expectedIntMemory = new Int32Array(memoryBufferCopy);
			const expectedFloatMemory = new Float32Array(memoryBufferCopy);

			// Simulate loader having already decoded the pre-compiled data
			mockState.compiler.codeBuffer = mockWasmBytecode;
			mockState.compiler.memoryBuffer = expectedIntMemory;
			mockState.compiler.memoryBufferFloat = expectedFloatMemory;
			mockState.compiler.allocatedMemorySize = expectedIntMemory.byteLength;
			// No compileCode callback for runtime-only projects
			mockState.callbacks.compileCode = undefined;
			mockState.initialProjectState = {
				...mockState.initialProjectState,
				compiledWasm: encodeUint8ArrayToBase64(mockWasmBytecode),
				compiledModules: {},
			};

			// Set up compiler functionality
			compiler(store, mockEvents);

			store.set('compiledConfig', { ...mockState.compiledConfig });
			await new Promise(resolve => setTimeout(resolve, 0));

			// Verify pre-compiled WASM was recognized via internal logger
			expect(
				mockState.console.logs.some(
					log =>
						log.message.includes('Pre-compiled WASM loaded and decoded successfully') && log.category === '[Loader]'
				)
			).toBe(true);

			// Verify compiler state is still correct
			expect(mockState.compiler.codeBuffer).toEqual(mockWasmBytecode);
			expect(mockState.compiler.memoryBuffer).toEqual(expectedIntMemory);
			expect(mockState.compiler.memoryBufferFloat).toEqual(expectedFloatMemory);
			expect(mockState.compiler.isCompiling).toBe(false);
			expect(mockState.codeErrors.compilationErrors).toEqual([]);
			expect(mockState.compiler.compilationTime).toBe(0);
		});

		it('should compile normally when no pre-compiled WASM is available', async () => {
			// Set up a project without pre-compiled WASM (normal project)
			mockState.compiler.codeBuffer = new Uint8Array(0); // No pre-compiled data

			// Mock the compileCode function
			const mockCompileCode = vi.fn().mockResolvedValue({
				compiledModules: {},
				codeBuffer: new Uint8Array([100, 200]),
				allocatedMemorySize: 1024,
				memoryAction: { action: 'reused' },
			});
			mockState.callbacks.compileCode = mockCompileCode;

			// Set up compiler functionality
			compiler(store, mockEvents);

			store.set('compiledConfig', { ...mockState.compiledConfig });
			await new Promise(resolve => setTimeout(resolve, 0));

			// Verify regular compilation was attempted
			expect(mockCompileCode).toHaveBeenCalled();
		});
	});

	describe('Project-specific memory configuration', () => {
		it('should export project structure when saving project', async () => {
			// Set up save functionality
			projectExport(store, mockEvents);

			// Get the save callback
			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const saveCall = onCalls.find(call => call[0] === 'exportProject');
			expect(saveCall).toBeDefined();

			const saveCallback = saveCall![1];

			// Trigger the save action
			await saveCallback();

			// Verify exportProject was called
			expect(mockExportProject).toHaveBeenCalledTimes(1);
			const [exportedJson] = mockExportProject.mock.calls[0];

			// Parse the exported JSON and verify project structure
			const exportedProject = JSON.parse(exportedJson);
			// memorySizeBytes is no longer in Project - config blocks are the source of truth
			expect(exportedProject.codeBlocks).toBeDefined();
			expect(exportedProject.viewport).toBeDefined();
		});

		it('should export project structure in runtime-ready project', async () => {
			// Set up save functionality
			projectExport(store, mockEvents);

			// Get the exportRuntimeReadyProject callback
			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportRuntimeReadyProjectCall = onCalls.find(call => call[0] === 'exportRuntimeReadyProject');
			expect(exportRuntimeReadyProjectCall).toBeDefined();

			const exportRuntimeReadyProjectCallback = exportRuntimeReadyProjectCall![1];

			// Trigger the exportRuntimeReadyProject action
			await exportRuntimeReadyProjectCallback();

			// Verify exportProject was called
			expect(mockExportProject).toHaveBeenCalledTimes(1);
			const [exportedJson] = mockExportProject.mock.calls[0];

			// Parse the exported JSON and verify project structure
			const exportedProject = JSON.parse(exportedJson);
			// memorySizeBytes is no longer in Project - config blocks are the source of truth
			expect(exportedProject.codeBlocks).toBeDefined();
			expect(exportedProject.viewport).toBeDefined();
		});
	});
});
