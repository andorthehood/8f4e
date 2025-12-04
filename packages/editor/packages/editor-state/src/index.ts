import createStateManager, { StateManager } from '@8f4e/state-manager';

import createDefaultState from './pureHelpers/state/createDefaultState';
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
import { validateFeatureFlags } from './pureHelpers/state/featureFlags';

import type { Options, State, EventDispatcher } from './types';

// Function to create default state
export default function init(events: EventDispatcher, options: Options): StateManager<State> {
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
	LogMessage,
	ConsoleState,
} from './types';

// Export EMPTY_DEFAULT_PROJECT as a value
export { EMPTY_DEFAULT_PROJECT } from './types';

// Export helper functions
export { default as findClosestCodeBlockInDirection } from './pureHelpers/finders/findClosestCodeBlockInDirection';
export type { Direction } from './pureHelpers/finders/findClosestCodeBlockInDirection';
export { default as centerViewportOnCodeBlock } from './pureHelpers/centerViewportOnCodeBlock';
export type { CodeBlockBounds } from './pureHelpers/centerViewportOnCodeBlock';
export { navigateToCodeBlockInDirection } from './effects/codeBlockNavigation';
