import type { EventDispatcher, Options, State } from '@8f4e/editor-state-types';
import createStateManager, { type StateManager } from '@8f4e/state-manager';
import browserLocalNotes from './features/browser-local-notes/effect';
import canvasScreenshot from './features/canvas-screenshot/effect';
import codeBlockRendering from './features/code-blocks/effect';
import autoEnvConstants from './features/code-blocks/features/auto-env-constants/effect';
import blockTypeUpdater from './features/code-blocks/features/blockTypeUpdater/effect';
import codeBlockCreator from './features/code-blocks/features/codeBlockCreator/effect';
import codeBlockDragger from './features/code-blocks/features/codeBlockDragger/effect';
import codeBlockNavigation from './features/code-blocks/features/codeBlockNavigation/effect';
import button from './features/code-blocks/features/directives/button/interaction';
import crossfade from './features/code-blocks/features/directives/crossfade/interaction';
import pianoKeyboard from './features/code-blocks/features/directives/piano/interaction';
import slider from './features/code-blocks/features/directives/slider/interaction';
import _switch from './features/code-blocks/features/directives/switch/interaction';
import viewportDirectiveEffect from './features/code-blocks/features/directives/viewport/effect';
import entryOutlines from './features/code-blocks/features/entryOutlines/effect';
import favoriteToggler from './features/code-blocks/features/favoriteToggler/effect';
import groupCopier from './features/code-blocks/features/group/copier/effect';
import groupDeleter from './features/code-blocks/features/group/deleter/effect';
import groupNonstickToggler from './features/code-blocks/features/group/nonstickToggler/effect';
import groupRemover from './features/code-blocks/features/group/remover/effect';
import groupSkipExecutionToggler from './features/code-blocks/features/group/skipExecutionToggler/effect';
import groupUngroupper from './features/code-blocks/features/group/ungroupper/effect';
import memoryConnectionRemover from './features/code-blocks/features/memoryConnectionRemover/effect';
import parsedDirectivesUpdater from './features/code-blocks/features/parsedDirectivesUpdater/effect';
import skipExecutionToggler from './features/code-blocks/features/skipExecutionToggler/effect';
import sliderDefaultSaver from './features/code-blocks/features/sliderDefaultSaver/effect';
import codeEditing from './features/code-editing/effect';
import color from './features/color/effect';
import dialog from './features/dialog/effect';
import historyTracking from './features/edit-history/effect';
import { registerEditorConfigSchemaContributionsValidator } from './features/editor-config/schemaContributions';
import editorMode from './features/editor-mode/effect';
import font from './features/font/effect';
import globalEditorDirectivesEffect from './features/global-editor-directives/effect';
import contextMenu from './features/menu/effect';
import presentation from './features/presentation/effect';
import compiler from './features/program-compiler/effect';
import projectExport from './features/project-export/effect';
import projectImport from './features/project-import/effect';
import runtime from './features/runtime/effect';
import shaderEffectsDeriver from './features/shader-effects/effect';
import tooltip from './features/tooltip/effect';
import viewport from './features/viewport/effect';
import createDefaultState from './pureHelpers/state/createDefaultState';
import { validateFeatureFlags } from './pureHelpers/state/featureFlags';

export {
	collectSchemaConfigPaths,
	createSchemaEditorConfigValidator,
	getSchemaForConfigPath,
	parseSchemaConfigValue,
	resolveSchemaConfigRoot,
	validateSchemaConfigValue,
} from './features/editor-config/schemaValidator';

// Function to create default state
export default function init(events: EventDispatcher, options: Options): StateManager<State> {
	const featureFlags = validateFeatureFlags(options.featureFlags);

	// Create base state
	const baseState = {
		...createDefaultState(),
		callbacks: options.callbacks,
		featureFlags,
		runtimeRegistry: options.runtimeRegistry,
		editorConfigSchemaContributions: options.editorConfigSchemaContributions ?? {},
	};

	const store = createStateManager<State>(baseState);

	const state = store.getState();

	font(store);
	color(store);
	registerEditorConfigSchemaContributionsValidator(store);
	projectExport(store, events);
	canvasScreenshot(store, events);
	dialog(store, events);

	runtime(store, events);
	editorMode(store, events);
	presentation(store, events);
	projectImport(store, events);
	codeBlockDragger(store, events);
	codeBlockNavigation(store, events);
	_switch(state, events);
	button(state, events);
	slider(store, events);
	sliderDefaultSaver(store, events);
	memoryConnectionRemover(store, events);
	crossfade(store, events);
	pianoKeyboard(store, events);
	viewport(store, events);
	contextMenu(store, events);
	codeBlockCreator(store, events);
	skipExecutionToggler(store, events);
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
	compiler(store);
	codeBlockRendering(store, events);
	viewportDirectiveEffect(store, events);
	entryOutlines(store);
	browserLocalNotes(store, events);
	codeEditing(store, events);
	tooltip(store);
	historyTracking(store, events);

	events.on('consoleLog', event => {
		console.log(event);
	});

	return store;
}

export { navigateToCodeBlockInDirection } from './features/code-blocks/features/codeBlockNavigation/effect';
// Export helper functions
export { default as findClosestCodeBlockInDirection } from './features/code-blocks/utils/finders/findClosestCodeBlockInDirection';
// Export .8f4e format helpers
export { serializeProjectTo8f4e } from './features/project-export/serializeTo8f4e';
// Export EMPTY_DEFAULT_PROJECT as a value
export { EMPTY_DEFAULT_PROJECT } from './features/project-import/emptyDefaultProject';
export { parse8f4eToProject } from './features/project-import/parse8f4e';
export type { CodeBlockBounds } from './features/viewport/centerViewportOnCodeBlock';
export { default as centerViewportOnCodeBlock } from './features/viewport/centerViewportOnCodeBlock';
