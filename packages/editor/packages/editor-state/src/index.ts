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
import compiler from './features/program-compiler/compiler';
import configEffect from './features/config-compiler/config';
import contextMenu from './effects/menu/contextMenu';
import graphicHelper from './effects/codeBlocks/graphicHelper';
import editorSettings from './effects/editorSettings';
import projectImport from './effects/projectImport';
import projectExport from './effects/projectExport';
import pianoKeyboard from './effects/codeBlocks/codeBlockDecorators/pianoKeyboard/interaction';
import exportWasm from './effects/exportWasm';
import viewport from './effects/viewport';
import binaryAsset from './effects/binaryAssets';
import runtime from './effects/runtime';
import blockTypeUpdater from './effects/codeBlocks/blockTypeUpdater';
import shaderEffectsDeriver from './effects/shaders/shaderEffectsDeriver';
import { validateFeatureFlags } from './pureHelpers/state/featureFlags';

import type { Options, State, EventDispatcher, Runtimes } from './types';

// Function to create default state
export default function init(events: EventDispatcher, options: Options): StateManager<State> {
	const featureFlags = validateFeatureFlags(options.featureFlags);

	// Get default runtime settings from registry
	const registryEntry = options.runtimeRegistry[options.defaultRuntimeId];
	if (!registryEntry) {
		throw new Error(`Default runtime ID "${options.defaultRuntimeId}" not found in runtime registry`);
	}

	// Create base state
	const baseState = {
		...createDefaultState(),
		callbacks: options.callbacks,
		featureFlags,
		runtimeRegistry: options.runtimeRegistry,
		defaultRuntimeId: options.defaultRuntimeId,
		compiledConfig: {
			...createDefaultState().compiledConfig,
			runtimeSettings: [registryEntry.defaults as unknown as Runtimes],
		},
	};

	const store = createStateManager<State>(baseState);

	const state = store.getState();

	editorSettings(store, events, state);

	runtime(store, events);
	projectImport(store, events);
	codeBlockDragger(store, events);
	codeBlockNavigation(state, events);
	demoModeNavigation(state, events);
	_switch(state, events);
	button(state, events);
	pianoKeyboard(store, events);
	viewport(state, events);
	contextMenu(store, events);
	codeBlockCreator(store, events);
	blockTypeUpdater(store); // Must run before compiler to classify blocks first
	shaderEffectsDeriver(store, events); // Must run after blockTypeUpdater to derive shader effects
	configEffect(store, events);
	compiler(store, events);
	graphicHelper(store, events);
	codeEditing(store, events);
	projectExport(store, events);
	exportWasm(state, events);
	binaryAsset(state, events);
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
	RuntimeRegistry,
	RuntimeRegistryEntry,
	FeatureFlags,
	FeatureFlagsConfig,
	EventDispatcher,
	InternalMouseEvent,
	InternalKeyboardEvent,
	NavigateCodeBlockEvent,
	MoveCaretEvent,
	InsertTextEvent,
	LogMessage,
	ConsoleState,
	CodeError,
	MemoryAction,
} from './types';

// Re-export JSONSchemaLike from stack-config-compiler for convenience
export type { JSONSchemaLike } from '@8f4e/stack-config-compiler';

// Export EMPTY_DEFAULT_PROJECT as a value
export { EMPTY_DEFAULT_PROJECT } from './types';

// Export helper functions
export { default as findClosestCodeBlockInDirection } from './pureHelpers/finders/findClosestCodeBlockInDirection';
export type { Direction } from './pureHelpers/finders/findClosestCodeBlockInDirection';
export { default as centerViewportOnCodeBlock } from './pureHelpers/centerViewportOnCodeBlock';
export type { CodeBlockBounds } from './pureHelpers/centerViewportOnCodeBlock';
export { navigateToCodeBlockInDirection } from './effects/codeBlockNavigation';
