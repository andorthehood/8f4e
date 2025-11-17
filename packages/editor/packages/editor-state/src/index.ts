import { Font } from '@8f4e/sprite-generator';
import createStateManager, { StateManager } from '@8f4e/state-manager';

import historyTracking from './effects/historyTracking';
import codeEditing from './effects/codeBlocks/codeEditing';
import _switch from './effects/codeBlocks/codeBlockDecorators/switches/interaction';
import button from './effects/codeBlocks/codeBlockDecorators/buttons/interaction';
import codeBlockCreator from './effects/codeBlocks/codeBlockCreator';
import codeBlockDragger from './effects/codeBlocks/codeBlockDragger';
import codeBlockNavigation from './effects/codeBlockNavigation';
import demoModeNavigation from './effects/demoModeNavigation';
import compiler from './effects/compiler';
import contextMenu from './effects/menu/contextMenu';
import font from './effects/font';
import graphicHelper from './effects/codeBlocks/graphicHelper';
import loader from './effects/loader';
import pianoKeyboard from './effects/codeBlocks/codeBlockDecorators/pianoKeyboard/interaction';
import sampleRate from './effects/sampleRate';
import save from './effects/save';
import exportWasm from './effects/exportWasm';
import viewport from './effects/viewport';
import binaryAsset from './effects/binaryAssets';
import runtime from './effects/runtime';
import keyboardShortcuts from './effects/keyboardShortcuts';
import { validateFeatureFlags, defaultFeatureFlags } from './featureFlags';

import type { Options, Project, State, CodeBlockGraphicData, EventDispatcher, GraphicHelper } from './types';

// Helper function to create graphic helper with proper references
function createGraphicHelper(): GraphicHelper {
	return {
		dialog: {
			show: false,
			text: 'Lorem ipsum dolor sit amet',
			title: 'Dialog',
			buttons: [{ title: 'Close', action: 'close' }],
		},
		codeBlocks: new Set<CodeBlockGraphicData>(),
		outputsByWordAddress: new Map(),
		viewport: {
			x: 0,
			y: 0,
			animationDurationMs: 0,
			width: 0,
			height: 0,
			roundedHeight: 0,
			roundedWidth: 0,
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
		postProcessEffects: [],
	};
}

const memorySizeBytes = 1048576; // 1MB default

// Function to create default state
function createDefaultState() {
	return {
		projectInfo: {
			title: '',
			author: '',
			description: '',
		},
		compiler: {
			codeBuffer: new Uint8Array(),
			compilationTime: 0,
			cycleTime: 0,
			isCompiling: false,
			lastCompilationStart: 0,
			allocatedMemorySize: 0,
			memoryBuffer: new Int32Array(),
			memoryBufferFloat: new Float32Array(),
			timerAccuracy: 0,
			compiledModules: {},
			buildErrors: [],
			compilerOptions: {
				memorySizeBytes,
				startingMemoryWordAddress: 0,
				environmentExtensions: {
					constants: {},
					ignoredKeywords: ['debug', 'button', 'switch', 'offset', 'plot', 'piano'],
				},
			},
			runtimeSettings: [
				{
					runtime: 'WebWorkerLogicRuntime' as const,
					sampleRate: 50,
				},
			],
			selectedRuntime: 0,
		},
		midi: {
			inputs: [],
			outputs: [],
		},
		graphicHelper: createGraphicHelper(),
		editorSettings: {
			colorScheme: 'hackerman',
			font: '8x16' as Font,
		},
		featureFlags: defaultFeatureFlags,
		colorSchemes: {},
		historyStack: [],
		redoStack: [],
		storageQuota: { usedBytes: 0, totalBytes: 0 },
		binaryAssets: [],
	};
}

export default function init(events: EventDispatcher, project: Project, options: Options): StateManager<State> {
	// Initialize feature flags
	const featureFlags = validateFeatureFlags(options.featureFlags);

	const store = createStateManager<State>({
		...createDefaultState(),
		callbacks: options.callbacks,
		featureFlags,
	});

	const state = store.getState();

	runtime(state, events);
	sampleRate(state, events);
	loader(store, events, state);
	codeBlockDragger(state, events);
	codeBlockNavigation(state, events);
	demoModeNavigation(state, events);
	_switch(state, events);
	button(state, events);
	pianoKeyboard(store, events);
	viewport(state, events);
	contextMenu(store, events);
	codeBlockCreator(state, events);
	compiler(store, events);
	graphicHelper(store, events);
	codeEditing(store, events);
	save(store, events);
	exportWasm(state, events);
	font(state, events);
	binaryAsset(state, events);
	keyboardShortcuts(state, events);
	historyTracking(store, events);
	events.dispatch('init');

	events.on('consoleLog', event => {
		console.log(event);
	});

	return store;
}

// Export all types from types module
export type {
	State,
	CodeBlockGraphicData,
	Project,
	ProjectInfo,
	Options,
	EditorSettings,
	CompilationResult,
	CodeBlock,
	Viewport,
	Size,
	Position,
	ContextMenuItem,
	MenuGenerator,
	BuildError,
	Compiler,
	Midi,
	GraphicHelper,
	BinaryAsset,
	Callbacks,
	ExampleModule,
	ModuleMetadata,
	ProjectMetadata,
	Runtimes,
	WebWorkerLogicRuntime,
	MainThreadLogicRuntime,
	AudioWorkletRuntime,
	WebWorkerMIDIRuntime,
	MemoryIdentifier,
	BufferPlotter,
	Switch,
	Debugger,
	Output,
	Input,
	PianoKeyboard,
	ContextMenu,
	RuntimeFactory,
	RuntimeType,
	FeatureFlags,
	FeatureFlagsConfig,
	EventDispatcher,
	InternalMouseEvent,
	InternalKeyboardEvent,
} from './types';

// Export EMPTY_DEFAULT_PROJECT as a value
export { EMPTY_DEFAULT_PROJECT } from './types';

// Export helper functions
export { default as findClosestCodeBlockInDirection } from './helpers/findClosestCodeBlockInDirection';
export type { Direction } from './helpers/findClosestCodeBlockInDirection';
export { default as centerViewportOnCodeBlock } from './helpers/centerViewportOnCodeBlock';
export type { CodeBlockBounds } from './helpers/centerViewportOnCodeBlock';
export { navigateToCodeBlockInDirection } from './effects/codeBlockNavigation';
