import createStateManager, { StateManager } from '@8f4e/state-manager';

import createDefaultState from './pureHelpers/state/createDefaultState';
import historyTracking from './features/edit-history/effect';
import codeEditing from './features/code-editing/effect';
import _switch from './features/code-blocks/features/directives/switch/interaction';
import button from './features/code-blocks/features/directives/button/interaction';
import slider from './features/code-blocks/features/directives/slider/interaction';
import viewportDirectiveEffect from './features/code-blocks/features/directives/viewport/effect';
import codeBlockCreator from './features/code-blocks/features/codeBlockCreator/effect';
import codeBlockDragger from './features/code-blocks/features/codeBlockDragger/effect';
import codeBlockNavigation from './features/code-blocks/features/codeBlockNavigation/effect';
import compiler from './features/program-compiler/effect';
import contextMenu from './features/menu/effect';
import graphicHelper from './features/code-blocks/features/graphicHelper/effect';
import editorConfigModule from './features/editor-config-module/effect';
import projectImport from './features/project-import/effect';
import pianoKeyboard from './features/code-blocks/features/directives/piano/interaction';
import projectExport from './features/project-export/effect';
import viewport from './features/viewport/effect';
import binaryAsset from './features/binary-assets/effect';
import runtime from './features/runtime/effect';
import blockTypeUpdater from './features/code-blocks/features/blockTypeUpdater/effect';
import shaderEffectsDeriver from './features/shader-effects/effect';
import autoEnvConstants from './features/code-blocks/features/auto-env-constants/effect';
import globalEditorDirectivesEffect from './features/global-editor-directives/effect';
import parsedDirectivesUpdater from './features/code-blocks/features/parsedDirectivesUpdater/effect';
import skipExecutionToggler from './features/code-blocks/features/skipExecutionToggler/effect';
import clearDebugProbes from './features/code-blocks/features/clearDebugProbes/effect';
import groupSkipExecutionToggler from './features/code-blocks/features/group/skipExecutionToggler/effect';
import groupNonstickToggler from './features/code-blocks/features/group/nonstickToggler/effect';
import groupCopier from './features/code-blocks/features/group/copier/effect';
import favoriteToggler from './features/code-blocks/features/favoriteToggler/effect';
import groupRemover from './features/code-blocks/features/group/remover/effect';
import groupUngroupper from './features/code-blocks/features/group/ungroupper/effect';
import groupDeleter from './features/code-blocks/features/group/deleter/effect';
import { validateFeatureFlags } from './pureHelpers/state/featureFlags';
import dialog from './features/dialog/effect';
import runtimeDirectiveErrorsEffect from './features/runtime/directiveErrorsEffect';
import editorMode from './features/editor-mode/effect';
import presentation from './features/presentation/effect';

import type { Options, State, EventDispatcher } from './types';

// Function to create default state
export default function init(events: EventDispatcher, options: Options): StateManager<State> {
	const featureFlags = validateFeatureFlags(options.featureFlags);

	if (!options.runtimeRegistry[options.defaultRuntimeId]) {
		throw new Error(`Default runtime ID "${options.defaultRuntimeId}" not found in runtime registry`);
	}

	// Create base state
	const baseState = {
		...createDefaultState(),
		callbacks: options.callbacks,
		featureFlags,
		runtimeRegistry: options.runtimeRegistry,
		defaultRuntimeId: options.defaultRuntimeId,
	};

	const store = createStateManager<State>(baseState);

	const state = store.getState();

	runtime(store, events);
	editorMode(store, events);
	presentation(store, events);
	projectImport(store, events);
	codeBlockDragger(store, events);
	codeBlockNavigation(store, events);
	_switch(state, events);
	button(state, events);
	slider(store, events);
	pianoKeyboard(store, events);
	viewport(store, events);
	contextMenu(store, events);
	codeBlockCreator(store, events);
	skipExecutionToggler(store, events);
	clearDebugProbes(store, events);
	groupSkipExecutionToggler(store, events);
	groupNonstickToggler(store, events);
	groupCopier(store, events);
	favoriteToggler(store, events);
	groupRemover(store, events);
	groupUngroupper(store, events);
	groupDeleter(store, events);
	parsedDirectivesUpdater(store);
	autoEnvConstants(store); // Must run after codeBlockCreator to ensure env block is created
	blockTypeUpdater(store); // Must run before compiler to classify blocks first
	shaderEffectsDeriver(store, events); // Must run after blockTypeUpdater to derive shader effects
	globalEditorDirectivesEffect(store);
	runtimeDirectiveErrorsEffect(store);
	compiler(store, events);
	graphicHelper(store, events);
	viewportDirectiveEffect(store, events);
	editorConfigModule(store, events);
	codeEditing(store, events);
	projectExport(store, events);
	binaryAsset(store, events);
	historyTracking(store, events);
	dialog(store, events);

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
	ParsedDirectiveRecord,
	Project,
	Options,
	CompilationResult,
	EditorConfigStorageBlock,
	CodeBlock,
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
	ModuleMetadata,
	ProjectMetadata,
	Runtimes,
	WebWorkerLogicRuntime,
	MainThreadLogicRuntime,
	AudioWorkletRuntime,
	WebWorkerMIDIRuntime,
	MemoryIdentifier,
	ArrayPlotter,
	ArrayWave,
	Switch,
	Debugger,
	Output,
	Input,
	PianoKeyboard,
	ContextMenu,
	RuntimeFactory,
	RuntimeRegistry,
	RuntimeRegistryEntry,
	JSONSchemaLike,
	FeatureFlags,
	FeatureFlagsConfig,
	EditorMode,
	EventDispatcher,
	ResolvedGlobalEditorDirectives,
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

// Export EMPTY_DEFAULT_PROJECT as a value
export { EMPTY_DEFAULT_PROJECT } from './types';

// Export .8f4e format helpers
export { serializeProjectTo8f4e } from './features/project-export/serializeTo8f4e';
export { parse8f4eToProject } from './features/project-import/parse8f4e';

// Export helper functions
export { default as findClosestCodeBlockInDirection } from './features/code-blocks/utils/finders/findClosestCodeBlockInDirection';
export type { Direction } from './features/code-blocks/utils/types';
export { default as centerViewportOnCodeBlock } from './features/viewport/centerViewportOnCodeBlock';
export type { CodeBlockBounds } from './features/viewport/centerViewportOnCodeBlock';
export { navigateToCodeBlockInDirection } from './features/code-blocks/features/codeBlockNavigation/effect';
