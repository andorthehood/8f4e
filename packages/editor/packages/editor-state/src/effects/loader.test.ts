import { vi, type MockInstance } from 'vitest';
import { StateManager } from '@8f4e/state-manager';

import loader from './loader';

import { EMPTY_DEFAULT_PROJECT } from '../types';

import type { State, EventDispatcher, Project } from '../types';

describe('Loader - Project-specific memory configuration', () => {
	let mockState: State;
	let mockStore: StateManager<State>;
	let mockEvents: EventDispatcher;

	beforeEach(() => {
		mockState = {
			projectInfo: {
				title: '',
				author: '',
				description: '',
			},
			compiler: {
				codeBuffer: new Uint8Array(0),
				isCompiling: false,
				buildErrors: [],
				compilationTime: 0,
				lastCompilationStart: 0,
				allocatedMemorySize: 0,
				memoryBuffer: new Int32Array(0),
				memoryBufferFloat: new Float32Array(0),
				compiledModules: {},
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
				requestRuntime: vi.fn(),
				loadProjectFromStorage: vi.fn().mockResolvedValue(null),
				loadColorSchemes: vi.fn().mockResolvedValue({
					default: { text: {}, fill: {}, icons: {} },
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
				font: '8x16',
			},
			featureFlags: {
				contextMenu: true,
				infoOverlay: true,
				moduleDragging: true,
				viewportDragging: true,
				persistentStorage: false,
				editing: true,
				viewportAnimations: true,
			},
			compilationTime: 0,
			colorSchemes: {},
		} as unknown as State;

		mockStore = {
			getState: () => mockState,
			set: vi.fn(),
		} as unknown as StateManager<State>;

		mockEvents = {
			on: vi.fn(),
			off: vi.fn(),
			dispatch: vi.fn(),
		} as EventDispatcher;
	});

	it('should use default memory settings when project has no memory configuration', async () => {
		loader(mockStore, mockEvents, mockState);

		// Get the loadProject callback
		const onCalls = (mockEvents.on as MockInstance).mock.calls;
		const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
		expect(loadProjectCall).toBeDefined();

		const loadProjectCallback = loadProjectCall[1];

		// Create a project without memory configuration
		const projectWithoutMemory: Project = {
			...EMPTY_DEFAULT_PROJECT,
			title: 'Test Project',
		};

		// Load the project
		loadProjectCallback({ project: projectWithoutMemory });

		// Verify compiler options use defaults
		expect(mockState.compiler.compilerOptions.memorySizeBytes).toBe(1048576);
	});

	it('should use project-specific memory settings when available', async () => {
		loader(mockStore, mockEvents, mockState);

		// Get the loadProject callback
		const onCalls = (mockEvents.on as MockInstance).mock.calls;
		const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
		expect(loadProjectCall).toBeDefined();

		const loadProjectCallback = loadProjectCall[1];

		// Create a project with custom memory configuration
		const projectWithMemory: Project = {
			...EMPTY_DEFAULT_PROJECT,
			title: 'Test Project',
			memorySizeBytes: 500 * 65536,
		};

		// Load the project
		loadProjectCallback({ project: projectWithMemory });

		// Verify compiler options use project-specific settings
		expect(mockState.compiler.compilerOptions.memorySizeBytes).toBe(500 * 65536);
	});

	it('should create memory with project-specific settings', async () => {
		loader(mockStore, mockEvents, mockState);

		// Get the loadProject callback
		const onCalls = (mockEvents.on as MockInstance).mock.calls;
		const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
		const loadProjectCallback = loadProjectCall[1];

		// Create a project with custom memory configuration
		const projectWithMemory: Project = {
			...EMPTY_DEFAULT_PROJECT,
			title: 'Test Project',
			memorySizeBytes: 2000 * 65536,
		};

		// Load the project
		loadProjectCallback({ project: projectWithMemory });

		// Verify the compiler options were updated
		expect(mockState.compiler.compilerOptions.memorySizeBytes).toBe(2000 * 65536);
	});
});
