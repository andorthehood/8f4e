/**
 * Central type re-exports for editor-state.
 * This file now acts as a barrel, importing types from feature-specific modules
 * and re-exporting them for backward compatibility and public API stability.
 */

import type { CompileInput, CompileOptions, MemoryAction as CompilerMemoryAction } from '@8f4e/compiler-spec';
import type { FillSpriteColorName } from '@8f4e/sprite-generator';
import type { SpriteLookup } from 'glugglug';
import type { BinaryAsset } from './features/binary-assets/types';
import type { BrowserLocalNoteStorageBlock } from './features/browser-local-notes/types';
import type {
	ArrayBars,
	ArrayMeter,
	ArrayPlotter,
	ArrayWave,
	CodeBlock,
	CodeBlockEntryOutline,
	CodeBlockGraphicData,
	CodeBlockType,
	Crossfade,
	Debugger,
	GraphicHelper,
	InfoPanel,
	Input,
	MemoryIdentifier,
	Output,
	ParsedDirectiveRecord,
	PianoKeyboard,
	PianoKeyboardBlackKey,
	PianoKeyboardKey,
	PianoKeyboardWhiteKey,
	PianoKeySprite,
	PianoPressedOverlayFont,
	Slider,
	Switch,
	TypedValueKind,
} from './features/code-blocks/types';
import type { InsertTextEvent, MoveCaretEvent, NavigateCodeBlockEvent } from './features/code-editing/types';
import type { DialogButton, DialogContent, DialogState } from './features/dialog/types';
import type {
	EditorConfig,
	EditorConfigSchemaContributionRegistry,
	EditorConfigValidatorRegistry,
	JSONSchemaLike,
} from './features/editor-config/types';
import type { ResolvedGlobalEditorDirectives } from './features/global-editor-directives/types';
import type { ConsoleState, LogMessage } from './features/logger/types';
import type { ContextMenu, ContextMenuItem, MenuGenerator, MenuStackEntry } from './features/menu/types';
import type { PresentationState } from './features/presentation/types';
import type { CompilationResult, Compiler } from './features/program-compiler/types';
import type { Project } from './features/project-import/types';
import type {
	RuntimeEnvConstantsContributor,
	RuntimeFactory,
	RuntimeRegistry,
	RuntimeRegistryEntry,
	RuntimeValuesByRuntimeId,
} from './features/runtime/types';
import type { ProjectViewport, Viewport, ViewportAnimation } from './features/viewport/types';
import type {
	CodeError,
	EventDispatcher,
	GridCoordinates,
	InternalKeyboardEvent,
	InternalMouseEvent,
	Position,
	Size,
} from './shared/types';

export {
	type ParsedDirectiveLineRecord,
	parseDirectiveLineRecords,
	parseDirectiveRecords,
} from './features/code-blocks/utils/directives';

// Re-export MemoryAction for use by consumers
// Re-export shared types
// Re-export viewport types
// Re-export code-blocks types
// Re-export menu types
// Re-export program-compiler spec
// Re-export browser-local note storage types
// Re-export dialog types
// Re-export global-editor-directives types
// Re-export runtime types
// Re-export logger types
// Re-export binary-assets types
// Re-export code-editing types
// Re-export project-import types
export type {
	ArrayBars,
	ArrayMeter,
	ArrayPlotter,
	ArrayWave,
	BinaryAsset,
	BrowserLocalNoteStorageBlock,
	CodeBlock,
	CodeBlockEntryOutline,
	CodeBlockGraphicData,
	CodeBlockType,
	CodeError,
	CompilationResult,
	Compiler,
	CompilerMemoryAction as MemoryAction,
	ConsoleState,
	ContextMenu,
	ContextMenuItem,
	Crossfade,
	Debugger,
	DialogButton,
	DialogContent,
	DialogState,
	EventDispatcher,
	GraphicHelper,
	GridCoordinates,
	InfoPanel,
	Input,
	InsertTextEvent,
	InternalKeyboardEvent,
	InternalMouseEvent,
	JSONSchemaLike,
	LogMessage,
	MemoryIdentifier,
	MenuGenerator,
	MenuStackEntry,
	MoveCaretEvent,
	NavigateCodeBlockEvent,
	Output,
	ParsedDirectiveRecord,
	PianoKeyboard,
	PianoKeyboardBlackKey,
	PianoKeyboardKey,
	PianoKeyboardWhiteKey,
	PianoKeySprite,
	PianoPressedOverlayFont,
	Position,
	Project,
	ProjectViewport,
	ResolvedGlobalEditorDirectives,
	RuntimeEnvConstantsContributor,
	RuntimeFactory,
	RuntimeRegistry,
	RuntimeRegistryEntry,
	RuntimeValuesByRuntimeId,
	Size,
	Slider,
	Switch,
	TypedValueKind,
};

export type InfoValue = unknown;
export type InfoRecord = Record<string, InfoValue>;
export type InfoState = Record<string, InfoRecord | undefined>;

export type TooltipLiveValueSourceKind = 'memoryAddress' | 'memoryValue' | 'memoryDereference';

export interface TooltipLiveValueMemoryFormat {
	elementWordSize: number;
	isInteger: boolean;
	isUnsigned: boolean;
}

export interface TooltipMemoryAddressLiveValueSource {
	kind: 'memoryAddress';
	moduleId: string;
	memoryId: string;
}

export interface TooltipMemoryValueLiveValueSource {
	kind: 'memoryValue';
	moduleId: string;
	memoryId: string;
	elementIndex?: number;
}

export interface TooltipMemoryDereferenceLiveValueSource {
	kind: 'memoryDereference';
	moduleId: string;
	memoryId: string;
	format: TooltipLiveValueMemoryFormat;
}

export type TooltipLiveValueSource =
	| TooltipMemoryAddressLiveValueSource
	| TooltipMemoryValueLiveValueSource
	| TooltipMemoryDereferenceLiveValueSource;

export interface TooltipLiveValue {
	x: number;
	y: number;
	source: TooltipLiveValueSource;
	color: SpriteLookup | undefined;
}

export interface TooltipLayout {
	horizontalPadding: number;
	width: number;
	height: number;
	x: number;
	y: number;
	lineX: number;
}

export interface TooltipHighlight {
	x: number;
	y: number;
	width: number;
	height: number;
	fillColor: FillSpriteColorName;
}

export interface TooltipState {
	text: string[];
	characters: Array<Array<number | string>>;
	colors: Array<Array<SpriteLookup | undefined>>;
	lineCount: number;
	widthChars: number;
	layout: TooltipLayout;
	highlights: TooltipHighlight[];
	liveValues: TooltipLiveValue[];
}

// Feature Flags types (top-level public API)
export interface FeatureFlags {
	/** Enable/disable right-click context menu functionality */
	contextMenu: boolean;

	/** Enable/disable info overlay display (development information) */
	infoOverlay: boolean;

	/** Enable/disable dragging and repositioning of code block modules */
	moduleDragging: boolean;

	/** Enable/disable selecting lines/caret positions within code blocks */
	codeLineSelection: boolean;

	/** Enable/disable panning/scrolling of the editor viewport */
	viewportDragging: boolean;

	/** Whether the editor is currently in an edit-enabled state. */
	editing: boolean;

	/** Enable/disable keyboard toggling between view/edit modes (e/Escape) */
	modeToggling: boolean;

	/** Enable/disable the mode hint overlay at the top of the viewport */
	modeOverlay: boolean;

	/** Enable/disable history tracking for undo/redo functionality */
	historyTracking?: boolean;

	/** Enable/disable console overlay display (internal logging) */
	consoleOverlay: boolean;

	/** Enable/disable position offsetters that allow code blocks to be moved via memory values */
	positionOffsetters: boolean;

	/** Enable/disable arrows that point toward off-screen code blocks */
	offscreenBlockArrows: boolean;
}

/**
 * Type for partial feature flags used in editor configuration.
 * This allows users to specify only the flags they want to override.
 */
export type FeatureFlagsConfig = Partial<FeatureFlags>;

export type EditorMode = 'view' | 'edit' | 'presentation';

// Callbacks interface contains all callback functions (top-level public API)
export interface Callbacks {
	// Module and project loading callbacks
	getListOfModules?: () => Promise<
		Array<{
			slug: string;
			title: string;
			description?: string;
			category: string;
			dependencies?: string[];
		}>
	>;
	getModule?: (slug: string) => Promise<string>;
	getModuleDependencies?: (slug: string) => Promise<string[]>;
	getListOfProjects?: () => Promise<
		Array<{
			url: string;
			title: string;
			category: string;
		}>
	>;
	getProject?: (url: string) => Promise<string>;

	// Compilation callback
	compileCode?: (input: CompileInput, compilerOptions: CompileOptions) => Promise<CompilationResult>;

	// Session storage callbacks
	loadSession: () => Promise<Project | null>;
	saveSession?: (project: Project) => Promise<void>;
	loadBrowserLocalNotes?: () => Promise<BrowserLocalNoteStorageBlock[] | null>;
	saveBrowserLocalNotes?: (blocks: BrowserLocalNoteStorageBlock[]) => Promise<void>;

	// File handling callbacks
	importProject?: () => Promise<Project>;
	exportProject?: (data: string, fileName: string) => Promise<void>;
	exportBinaryCode?: (fileName: string) => Promise<void>;
	exportCanvasScreenshot?: (fileName: string) => Promise<void>;
	getStorageQuota?: () => Promise<{ usedBytes: number; totalBytes: number }>;

	// Memory manipulation callback
	setWordInMemory?: (wordAlignedAddress: number, value: number, isInteger: boolean) => void;

	getWordFromMemory?: (wordAlignedAddress: number) => number;

	// Clipboard callbacks
	/**
	 * Reads text from the system clipboard.
	 * Used for pasting code blocks into the editor.
	 * If not provided, clipboard paste operations will be disabled.
	 *
	 * @returns Promise that resolves with the clipboard text content
	 */
	readClipboardText?: () => Promise<string>;

	/**
	 * Writes text to the system clipboard.
	 * Used for copying code blocks from the editor.
	 * If not provided, clipboard copy operations will be disabled.
	 *
	 * @param text - The text content to write to the clipboard
	 * @returns Promise that resolves when the write operation completes
	 */
	writeClipboardText?: (text: string) => Promise<void>;

	/**
	 * Schedules a frame callback for editor-state driven animations.
	 * Hosts can provide `window.requestAnimationFrame` or an equivalent scheduler.
	 */
	requestAnimationFrame?: (callback: (time: number) => void) => number;

	/**
	 * Cancels a previously scheduled animation frame callback.
	 */
	cancelAnimationFrame?: (id: number) => void;
}

// Options interface for editor initialization (top-level public API)
export interface Options {
	featureFlags?: FeatureFlagsConfig;
	callbacks: Callbacks;
	/**
	 * Runtime registry mapping runtime IDs to runtime implementations.
	 */
	runtimeRegistry: RuntimeRegistry;
	/**
	 * Default runtime ID to use when no runtime is specified or when an unknown runtime ID is encountered.
	 * Must match a key in the runtimeRegistry.
	 */
	defaultRuntimeId: string;
	/** Optional host-provided schema contributions for project-level editor config. */
	editorConfigSchemaContributions?: EditorConfigSchemaContributionRegistry;
}

// State interface - complete editor state tree (top-level public API)
export interface State {
	compiler: Compiler;
	graphicHelper: GraphicHelper;
	/** Arbitrary key/value records rendered by `; @info <id>` directives. */
	info: InfoState;
	tooltip: TooltipState;
	callbacks: Callbacks;
	featureFlags: FeatureFlags;
	editorMode: EditorMode;
	editorConfig: EditorConfig;
	editorConfigValidators: EditorConfigValidatorRegistry;
	editorConfigSchemaContributions: EditorConfigSchemaContributionRegistry;
	historyStack: Project[];
	initialProjectState?: Project;
	redoStack: Project[];
	storageQuota: { usedBytes: number; totalBytes: number };
	binaryAssets: BinaryAsset[];
	/** Console state for internal logging */
	console: ConsoleState;
	runtime: {
		values: RuntimeValuesByRuntimeId;
	};
	/** Runtime registry for available runtime implementations */
	runtimeRegistry: RuntimeRegistry;
	/** Default runtime ID to use when no runtime is specified */
	defaultRuntimeId: string;
	/** Resolved global editor directives from `; @<name>` comments */
	globalEditorDirectives: ResolvedGlobalEditorDirectives;
	codeErrors: {
		compilationErrors: CodeError[];
		editorDirectiveErrors: CodeError[];
		shaderErrors: CodeError[];
	};
	dialog: DialogState;
	dialogStack: DialogContent[];
	viewport: Viewport;
	viewportAnimation: ViewportAnimation;
	presentation: PresentationState;
}

export type * from './features/binary-assets/types';
export type * from './features/browser-local-notes/types';
export type * from './features/code-blocks/features/directives/types';
export type * from './features/code-blocks/features/graphicHelper/buildDisplayModel';
export type * from './features/code-blocks/types';
export type * from './features/code-blocks/utils/types';
export type * from './features/code-editing/types';
export type * from './features/editor-config/types';
export type {
	EditorConfig,
	EditorConfigEntry,
	EditorConfigValidator,
	EditorConfigValidatorRegistry,
} from './features/editor-config/types';
export type * from './features/global-editor-directives/types';
export type * from './features/logger/types';
export type * from './features/menu/types';
export type * from './features/presentation/types';
export type * from './features/program-compiler/types';
export type * from './features/project-import/types';
export type * from './features/runtime/types';
export type * from './features/viewport/blockAlignment';
export type * from './features/viewport/types';
export type * from './shared/types';
