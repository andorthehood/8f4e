import { State, Project, EMPTY_DEFAULT_PROJECT } from '../types';
import compiler from './compiler';
import save from './save';
import { EventDispatcher } from '../../events';

// Mock the decodeBase64ToUint8Array function
jest.mock('../helpers/base64Decoder', () => ({
	decodeBase64ToUint8Array: jest.fn((base64: string) => {
		// Simple mock implementation for testing
		const binaryString = atob(base64);
		return new Uint8Array(binaryString.split('').map(char => char.charCodeAt(0)));
	})
}));

describe('Runtime-ready project functionality', () => {
	let mockState: State;
	let mockEvents: EventDispatcher;
	let mockExportFile: jest.Mock;

	beforeEach(() => {
		mockExportFile = jest.fn().mockResolvedValue(undefined);
		
		mockState = {
			project: {
				...EMPTY_DEFAULT_PROJECT,
				title: 'Test Project'
			},
			compiler: {
				memoryRef: new WebAssembly.Memory({ initial: 1 }),
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
					environmentExtensions: {
						constants: {}
					}
				}
			},
			options: {
				exportFile: mockExportFile,
				requestRuntime: jest.fn(),
				getListOfModules: jest.fn(),
				getModule: jest.fn(),
				getListOfProjects: jest.fn(),
				getProject: jest.fn(),
				compileProject: jest.fn(),
				localStorageId: 'test'
			},
			graphicHelper: {
				baseCodeBlock: {
					codeBlocks: new Set()
				}
			}
		} as any;

		mockEvents = {
			on: jest.fn(),
			dispatch: jest.fn()
		} as any;
	});

	describe('Runtime-ready export', () => {
		it('should export project with compiled WASM as base64', async () => {
			// Set up save functionality
			save(mockState, mockEvents);
			
			// Get the saveRuntimeReady callback
			const onCalls = (mockEvents.on as jest.Mock).mock.calls;
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
			
			// Verify the base64 encoding is correct
			const expectedBase64 = btoa(String.fromCharCode(...mockState.compiler.codeBuffer!));
			expect(exportedProject.compiledWasm).toBe(expectedBase64);
		});

		it('should warn when no compiled WASM is available', async () => {
			// Remove compiled WASM
			mockState.compiler.codeBuffer = null as any;
			
			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
			
			// Set up save functionality
			save(mockState, mockEvents);
			
			// Get the saveRuntimeReady callback
			const onCalls = (mockEvents.on as jest.Mock).mock.calls;
			const saveRuntimeReadyCall = onCalls.find(call => call[0] === 'saveRuntimeReady');
			const saveRuntimeReadyCallback = saveRuntimeReadyCall[1];
			
			// Trigger the saveRuntimeReady action
			await saveRuntimeReadyCallback();
			
			// Verify warning was logged and export was not called
			expect(consoleSpy).toHaveBeenCalledWith('No compiled WebAssembly code available. Please compile your project first.');
			expect(mockExportFile).not.toHaveBeenCalled();
			
			consoleSpy.mockRestore();
		});
	});

	describe('Pre-compiled WASM loading', () => {
		it('should use pre-compiled WASM bytecode when available', async () => {
			// Set up a project with pre-compiled WASM
			const mockWasmBytecode = new Uint8Array([10, 20, 30, 40, 50]);
			const base64Wasm = btoa(String.fromCharCode(...mockWasmBytecode));
			
			mockState.project.compiledWasm = base64Wasm;
			
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
			
			// Set up compiler functionality
			compiler(mockState, mockEvents);
			
			// Get the onRecompile callback
			const onCalls = (mockEvents.on as jest.Mock).mock.calls;
			const recompileCall = onCalls.find(call => 
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
			
			// Verify pre-compiled WASM was used
			expect(consoleSpy).toHaveBeenCalledWith('[Compiler] Using pre-compiled WASM bytecode from project');
			expect(consoleSpy).toHaveBeenCalledWith('[Compiler] Pre-compiled WASM loaded successfully');
			
			// Verify buildFinished was dispatched
			expect(mockEvents.dispatch).toHaveBeenCalledWith('buildFinished');
			
			// Verify compiler state was set correctly
			expect(mockState.compiler.codeBuffer).toEqual(mockWasmBytecode);
			expect(mockState.compiler.isCompiling).toBe(false);
			expect(mockState.compiler.buildErrors).toEqual([]);
			expect(mockState.compiler.compilationTime).toBe(0);
			
			consoleSpy.mockRestore();
		});

		it('should fall back to regular compilation if pre-compiled WASM fails', async () => {
			// Set up a project with invalid pre-compiled WASM
			mockState.project.compiledWasm = 'invalid-base64!@#$';
			
			// Mock the compileProject function
			const mockCompileProject = jest.fn().mockResolvedValue({
				compiledModules: new Map(),
				codeBuffer: new Uint8Array([100, 200]),
				allocatedMemorySize: 1024,
			});
			mockState.options.compileProject = mockCompileProject;
			
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			
			// Set up compiler functionality
			compiler(mockState, mockEvents);
			
			// Get the onRecompile callback
			const onCalls = (mockEvents.on as jest.Mock).mock.calls;
			const recompileCall = onCalls.find(call => 
				call[0] === 'createConnection' || 
				call[0] === 'codeBlockAdded' || 
				call[0] === 'deleteCodeBlock' || 
				call[0] === 'projectLoaded' || 
				call[0] === 'codeChange'
			);
			const onRecompileCallback = recompileCall[1];
			
			// Trigger recompilation
			await onRecompileCallback();
			
			// Verify error was logged
			expect(consoleSpy).toHaveBeenCalledWith('[Compiler] Failed to load pre-compiled WASM:', expect.anything());
			
			// Verify regular compilation was attempted
			expect(mockCompileProject).toHaveBeenCalled();
			
			consoleSpy.mockRestore();
		});
	});
});