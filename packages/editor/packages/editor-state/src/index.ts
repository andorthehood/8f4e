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
import configEffect from './effects/config';
import contextMenu from './effects/menu/contextMenu';
import graphicHelper from './effects/codeBlocks/graphicHelper';
import editorSettings from './effects/editorSettings';
import projectImport from './effects/projectImport';
import projectExport from './effects/projectExport';
import pianoKeyboard from './effects/codeBlocks/codeBlockDecorators/pianoKeyboard/interaction';
import sampleRate from './effects/sampleRate';
import exportWasm from './effects/exportWasm';
import viewport from './effects/viewport';
import binaryAsset from './effects/binaryAssets';
import runtime from './effects/runtime';
import keyboardShortcuts from './effects/keyboardShortcuts';
import blockTypeUpdater from './effects/codeBlocks/blockTypeUpdater';
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
		nextCodeBlockCreationIndex: 0,
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
			compilationErrors: [],
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
		colorSchemes: [],
		historyStack: [],
		redoStack: [],
		storageQuota: { usedBytes: 0, totalBytes: 0 },
		binaryAssets: [],
		configErrors: [],
	};
}

export default function init(events: EventDispatcher, project: Project, options: Options): StateManager<State> {
	const featureFlags = validateFeatureFlags(options.featureFlags);

	const store = createStateManager<State>({
		...createDefaultState(),
		callbacks: options.callbacks,
		featureFlags,
	});

	const state = store.getState();

	editorSettings(store, events, state);

	runtime(state, events);
	sampleRate(state, events);
	projectImport(store, events, state);
	codeBlockDragger(state, events);
	codeBlockNavigation(state, events);
	demoModeNavigation(state, events);
	_switch(state, events);
	button(state, events);
	pianoKeyboard(store, events);
	viewport(state, events);
	contextMenu(store, events);
	codeBlockCreator(state, events);
	blockTypeUpdater(store, events); // Must run before compiler to classify blocks first
	configEffect(store, events); // Config must run before compiler to apply settings first
	compiler(store, events);
	graphicHelper(store, events);
	codeEditing(store, events);
	projectExport(store, events);
	exportWasm(state, events);
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
	CodeBlockType,
	Project,
	ProjectInfo,
	Options,
	EditorSettings,
	CompilationResult,
	ConfigCompilationResult,
	CodeBlock,
	Viewport,
	ProjectViewport,
	GridCoordinates,
	Size,
	Position,
	ContextMenuItem,
	MenuGenerator,
	CompilationError,
	ConfigError,
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
export { default as findClosestCodeBlockInDirection } from './pureHelpers/finders/findClosestCodeBlockInDirection';
export type { Direction } from './pureHelpers/finders/findClosestCodeBlockInDirection';
export { default as centerViewportOnCodeBlock } from './pureHelpers/centerViewportOnCodeBlock';
export type { CodeBlockBounds } from './pureHelpers/centerViewportOnCodeBlock';
export { navigateToCodeBlockInDirection } from './effects/codeBlockNavigation';
