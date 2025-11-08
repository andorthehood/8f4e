import { vi, type MockInstance } from 'vitest';

import compiler from './compiler';
import save from './save';

import { EventDispatcher } from '../types';
import { encodeUint8ArrayToBase64 } from '../helpers/base64Encoder';

import type { State } from '../types';

// Mock the decodeBase64ToUint8Array function
vi.mock('../helpers/base64Decoder', () => {
	const decodeBase64ToUint8Array = vi.fn((base64: string) => {
		// Simple mock implementation for testing
		const binaryString = atob(base64);
		return new Uint8Array(binaryString.split('').map(char => char.charCodeAt(0)));
	});

	const createTypedArray = <T extends Int32Array | Float32Array>(
		ctor: new (buffer: ArrayBuffer, byteOffset: number, length: number) => T,
		errorMessage: string
	) => {
		return vi.fn((base64: string) => {
			const uint8Array = decodeBase64ToUint8Array(base64);

			if (uint8Array.byteLength % 4 !== 0) {
				throw new Error(errorMessage);
			}

			return new ctor(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength / 4);
		});
	};

	return {
		decodeBase64ToUint8Array,
		decodeBase64ToInt32Array: createTypedArray(
			Int32Array,
			'Invalid base64 data: byte length must be a multiple of 4 to decode as Int32Array'
		),
		decodeBase64ToFloat32Array: createTypedArray(
			Float32Array,
			'Invalid base64 data: byte length must be a multiple of 4 to decode as Float32Array'
		),
	};
});

describe('Runtime-ready project functionality', () => {
	let mockState: State;
	let mockEvents: EventDispatcher;
	let mockExportFile: MockInstance;

	beforeEach(() => {
		mockExportFile = vi.fn().mockResolvedValue(undefined);

		mockState = {
			projectInfo: {
				title: 'Test Project',
				author: '',
				description: '',
			},
			compiler: {
				codeBuffer: new Uint8Array([1, 2, 3, 4, 5]), // Mock compiled WASM
				isCompiling: false,
				buildErrors: [],
				compilationTime: 0,
				lastCompilationStart: 0,
				allocatedMemorySize: 0,
				memoryBuffer: new Int32Array(0),
				memoryBufferFloat: new Float32Array(0),
				compiledModules: new Map(),
				compilerOptions: {
					startingMemoryWordAddress: 0,
					memorySizeBytes: 1048576, // 1MB
					environmentExtensions: {
						constants: {},
						ignoredKeywords: [],
					},
				},
				cycleTime: 0,
				timerAccuracy: 0,
				binaryAssets: [],
				runtimeSettings: [
					{
						runtime: 'WebWorkerLogicRuntime',
						sampleRate: 50,
					},
				],
				selectedRuntime: 0,
			},
			callbacks: {
				exportFile: mockExportFile,
				requestRuntime: vi.fn(),
				getListOfModules: vi.fn(),
				getModule: vi.fn(),
				getListOfProjects: vi.fn(),
				getProject: vi.fn(),
				compileProject: vi.fn(),
				loadProjectFromStorage: vi.fn(),
				loadColorSchemes: vi.fn().mockResolvedValue({
					default: { text: {}, fill: {}, icons: {} },
					hackerman: { text: {}, fill: {}, icons: {} },
					redalert: { text: {}, fill: {}, icons: {} },
				}),
			},
			graphicHelper: {
				activeViewport: {
					codeBlocks: new Set(),
					viewport: { x: 0, y: 0 },
				},
				outputsByWordAddress: new Map(),
				globalViewport: {
					width: 1024,
					height: 768,
					roundedWidth: 1024,
					roundedHeight: 768,
					vGrid: 8,
					hGrid: 16,
					borderLineCoordinates: {
						top: { startX: 0, startY: 0, endX: 0, endY: 0 },
						right: { startX: 0, startY: 0, endX: 0, endY: 0 },
						bottom: { startX: 0, startY: 0, endX: 0, endY: 0 },
						left: { startX: 0, startY: 0, endX: 0, endY: 0 },
					},
					center: { x: 0, y: 0 },
				},
				contextMenu: {
					highlightedItem: 0,
					itemWidth: 200,
					items: [],
					open: false,
					x: 0,
					y: 0,
					menuStack: [],
				},
				dialog: {
					show: false,
					text: '',
					title: '',
					buttons: [],
				},
				postProcessEffects: [],
			},
			midi: {
				outputs: [],
				inputs: [],
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
			compilationTime: 0,
			colorSchemes: {},
		} as unknown as State;

		mockEvents = {
			on: vi.fn(),
			off: vi.fn(),
			dispatch: vi.fn(),
		} as EventDispatcher;
	});

	describe('Runtime-ready export', () => {
		it('should export project with compiled WASM as base64', async () => {
			// Set up save functionality
			save(mockState, mockEvents);

			// Get the saveRuntimeReady callback
			const onCalls = (mockEvents.on as MockInstance).mock.calls;
			const saveRuntimeReadyCall = onCalls.find(call => call[0] === 'saveRuntimeReady');
			expect(saveRuntimeReadyCall).toBeDefined();

			const saveRuntimeReadyCallback = saveRuntimeReadyCall[1];

			// Trigger the saveRuntimeReady action
			await saveRuntimeReadyCallback();

			// Verify exportFile was called with the right parameters
			expect(mockExportFile).toHaveBeenCalledTimes(1);
			const [exportedJson, filename, mimeType] = mockExportFile.mock.calls[0];

			expect(filename).toBe('Test Project-runtime-ready.json');
			expect(mimeType).toBe('application/json');

			// Parse the exported JSON and verify it contains compiledWasm
			const exportedProject = JSON.parse(exportedJson);
			expect(exportedProject.compiledWasm).toBeDefined();
			expect(typeof exportedProject.compiledWasm).toBe('string');

			// Verify the base64 encoding is correct using the same encoder as the implementation
			const expectedBase64 = encodeUint8ArrayToBase64(mockState.compiler.codeBuffer!);
			expect(exportedProject.compiledWasm).toBe(expectedBase64);
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
			save(mockState, mockEvents);

			// Get the saveRuntimeReady callback
			const onCalls = (mockEvents.on as MockInstance).mock.calls;
			const saveRuntimeReadyCall = onCalls.find(call => call[0] === 'saveRuntimeReady');
			expect(saveRuntimeReadyCall).toBeDefined();

			const saveRuntimeReadyCallback = saveRuntimeReadyCall[1];

			// Trigger the saveRuntimeReady action
			await saveRuntimeReadyCallback();

			expect(mockExportFile).toHaveBeenCalledTimes(1);

			const [exportedJson] = mockExportFile.mock.calls[0];
			const exportedProject = JSON.parse(exportedJson);
			const expectedBase64 = encodeUint8ArrayToBase64(new Uint8Array(backingBuffer, 0, 8));

			expect(exportedProject.memorySnapshot).toBe(expectedBase64);
		});

		it('should warn when no compiled WASM is available', async () => {
			// Remove compiled WASM by setting it to an empty array
			mockState.compiler.codeBuffer = new Uint8Array(0);

			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

			// Set up save functionality
			save(mockState, mockEvents);

			// Get the saveRuntimeReady callback
			const onCalls = (mockEvents.on as MockInstance).mock.calls;
			const saveRuntimeReadyCall = onCalls.find(call => call[0] === 'saveRuntimeReady');
			const saveRuntimeReadyCallback = saveRuntimeReadyCall[1];

			// Trigger the saveRuntimeReady action
			await saveRuntimeReadyCallback();

			// Verify warning was logged and export was not called
			expect(consoleSpy).toHaveBeenCalledWith(
				'No compiled WebAssembly code available. Please compile your project first.'
			);
			expect(mockExportFile).not.toHaveBeenCalled();

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
			// No compileProject callback for runtime-only projects
			mockState.callbacks.compileProject = undefined;

			const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

			// Set up compiler functionality
			compiler(mockState, mockEvents);

			// Get the onRecompile callback
			const onCalls = (mockEvents.on as MockInstance).mock.calls;
			const recompileCall = onCalls.find(
				call =>
					call[0] === 'createConnection' ||
					call[0] === 'codeBlockAdded' ||
					call[0] === 'deleteCodeBlock' ||
					call[0] === 'projectLoaded' ||
					call[0] === 'codeChange'
			);
			expect(recompileCall).toBeDefined();

			const onRecompileCallback = recompileCall[1];

			// Trigger recompilation
			await onRecompileCallback();

			// Verify pre-compiled WASM was recognized
			expect(consoleSpy).toHaveBeenCalledWith('[Compiler] Using pre-compiled WASM from runtime-ready project');

			// Verify buildFinished was dispatched
			expect(mockEvents.dispatch).toHaveBeenCalledWith('buildFinished');

			// Verify compiler state is still correct
			expect(mockState.compiler.codeBuffer).toEqual(mockWasmBytecode);
			expect(mockState.compiler.memoryBuffer).toEqual(expectedIntMemory);
			expect(mockState.compiler.memoryBufferFloat).toEqual(expectedFloatMemory);
			expect(mockState.compiler.isCompiling).toBe(false);
			expect(mockState.compiler.buildErrors).toEqual([]);
			expect(mockState.compiler.compilationTime).toBe(0);

			consoleSpy.mockRestore();
		});

		it('should compile normally when no pre-compiled WASM is available', async () => {
			// Set up a project without pre-compiled WASM (normal project)
			mockState.compiler.codeBuffer = new Uint8Array(0); // No pre-compiled data

			// Mock the compileProject function
			const mockCompileProject = vi.fn().mockResolvedValue({
				compiledModules: new Map(),
				codeBuffer: new Uint8Array([100, 200]),
				allocatedMemorySize: 1024,
			});
			mockState.callbacks.compileProject = mockCompileProject;

			// Set up compiler functionality
			compiler(mockState, mockEvents);

			// Get the onRecompile callback
			const onCalls = (mockEvents.on as MockInstance).mock.calls;
			const recompileCall = onCalls.find(
				call =>
					call[0] === 'createConnection' ||
					call[0] === 'codeBlockAdded' ||
					call[0] === 'deleteCodeBlock' ||
					call[0] === 'projectLoaded' ||
					call[0] === 'codeChange'
			);
			const onRecompileCallback = recompileCall[1];

			// Trigger recompilation
			await onRecompileCallback();

			// Verify regular compilation was attempted
			expect(mockCompileProject).toHaveBeenCalled();
		});
	});

	describe('Project-specific memory configuration', () => {
		it('should export memory configuration when saving project', async () => {
			// Set custom memory settings in compiler options
			mockState.compiler.compilerOptions.memorySizeBytes = 500 * 65536;

			// Set up save functionality
			save(mockState, mockEvents);

			// Get the save callback
			const onCalls = (mockEvents.on as MockInstance).mock.calls;
			const saveCall = onCalls.find(call => call[0] === 'save');
			expect(saveCall).toBeDefined();

			const saveCallback = saveCall[1];

			// Trigger the save action
			await saveCallback();

			// Verify exportFile was called
			expect(mockExportFile).toHaveBeenCalledTimes(1);
			const [exportedJson] = mockExportFile.mock.calls[0];

			// Parse the exported JSON and verify it contains memory configuration
			const exportedProject = JSON.parse(exportedJson);
			expect(exportedProject.memorySizeBytes).toBeDefined();
			expect(exportedProject.memorySizeBytes).toBe(500 * 65536);
		});

		it('should export memory configuration in runtime-ready project', async () => {
			// Set custom memory settings
			mockState.compiler.compilerOptions.memorySizeBytes = 2000 * 65536;

			// Set up save functionality
			save(mockState, mockEvents);

			// Get the saveRuntimeReady callback
			const onCalls = (mockEvents.on as MockInstance).mock.calls;
			const saveRuntimeReadyCall = onCalls.find(call => call[0] === 'saveRuntimeReady');
			expect(saveRuntimeReadyCall).toBeDefined();

			const saveRuntimeReadyCallback = saveRuntimeReadyCall[1];

			// Trigger the saveRuntimeReady action
			await saveRuntimeReadyCallback();

			// Verify exportFile was called
			expect(mockExportFile).toHaveBeenCalledTimes(1);
			const [exportedJson] = mockExportFile.mock.calls[0];

			// Parse the exported JSON and verify memory configuration
			const exportedProject = JSON.parse(exportedJson);
			expect(exportedProject.memorySizeBytes).toBeDefined();
			expect(exportedProject.memorySizeBytes).toBe(2000 * 65536);
		});
	});
});
