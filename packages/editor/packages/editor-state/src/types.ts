/**
 * Central type re-exports for editor-state.
 * This file now acts as a barrel, importing types from feature-specific modules
 * and re-exporting them for backward compatibility and public API stability.
 */

import type { Module, CompileOptions } from '@8f4e/compiler';
import type { MemoryAction as CompilerMemoryAction } from '@8f4e/compiler-worker/types';
import type { ColorScheme } from '@8f4e/sprite-generator';
import type { BinaryAsset } from './features/binary-assets/types';
import type {
	CodeBlock,
	CodeBlockType,
	CodeBlockGraphicData,
	ParsedDirectiveRecord,
	Input,
	Output,
	Debugger,
	MemoryIdentifier,
	ArrayPlotter,
	ArrayScanner,
	ScanSampleType,
	Switch,
	Slider,
	PianoKeyboard,
	GraphicHelper,
} from './features/code-blocks/types';
import type { NavigateCodeBlockEvent, MoveCaretEvent, InsertTextEvent } from './features/code-editing/types';
import type { EditorConfigStorageBlock } from './features/editor-config-module/editorConfigModule';
import type { ResolvedGlobalEditorDirectives } from './features/global-editor-directives/types';
import type { LogMessage, ConsoleState } from './features/logger/types';
import type { ContextMenuItem, MenuGenerator, MenuStackEntry, ContextMenu } from './features/menu/types';
import type { Compiler, CompilationResult } from './features/program-compiler/types';
import type { Project, ModuleMetadata, ProjectMetadata } from './features/project-import/types';
import type { PresentationState } from './features/presentation/types';
import type {
	RuntimeFactory,
	RuntimeRegistryEntry,
	RuntimeRegistry,
	WebWorkerLogicRuntime,
	MainThreadLogicRuntime,
	AudioWorkletRuntime,
	WebWorkerMIDIRuntime,
	Runtimes,
	Midi,
	RuntimeStats,
	RuntimeDirectiveResolver,
	RuntimeEnvConstantsContributor,
	JSONSchemaLike,
} from './features/runtime/types';
import type { ProjectViewport, Viewport, ViewportAnimation } from './features/viewport/types';
import type {
	Size,
	Position,
	GridCoordinates,
	CodeError,
	EventDispatcher,
	InternalMouseEvent,
	InternalKeyboardEvent,
} from './shared/types';

// Re-export MemoryAction for use by consumers
export type { CompilerMemoryAction as MemoryAction };

// Re-export shared types
export type { Size, Position, GridCoordinates, CodeError, EventDispatcher, InternalMouseEvent, InternalKeyboardEvent };

// Re-export viewport types
export type { ProjectViewport };

// Re-export code-blocks types
export type {
	CodeBlock,
	CodeBlockType,
	CodeBlockGraphicData,
	ParsedDirectiveRecord,
	Input,
	Output,
	Debugger,
	MemoryIdentifier,
	ArrayPlotter,
	ArrayScanner,
	ScanSampleType,
	Switch,
	Slider,
	PianoKeyboard,
	GraphicHelper,
};

// Re-export menu types
export type { ContextMenuItem, MenuGenerator, MenuStackEntry, ContextMenu };

// Re-export program-compiler types
export type { Compiler, CompilationResult };

// Re-export helper-module storage types
export type { EditorConfigStorageBlock };

// Re-export global-editor-directives types
export type { ResolvedGlobalEditorDirectives };

// Re-export runtime types
export type {
	RuntimeFactory,
	RuntimeRegistryEntry,
	RuntimeRegistry,
	JSONSchemaLike,
	WebWorkerLogicRuntime,
	MainThreadLogicRuntime,
	AudioWorkletRuntime,
	WebWorkerMIDIRuntime,
	Runtimes,
	Midi,
	RuntimeStats,
	RuntimeDirectiveResolver,
	RuntimeEnvConstantsContributor,
};

// Re-export logger types
export type { LogMessage, ConsoleState };

// Re-export binary-assets types
export type { BinaryAsset };

// Re-export code-editing types
export type { NavigateCodeBlockEvent, MoveCaretEvent, InsertTextEvent };

// Re-export project-import types
export type { Project, ModuleMetadata, ProjectMetadata };

// Re-export the EMPTY_DEFAULT_PROJECT constant
export { EMPTY_DEFAULT_PROJECT } from './features/project-import/types';

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

	/** Enable/disable history tracking for undo/redo functionality */
	historyTracking?: boolean;

	/** Enable/disable console overlay display (internal logging) */
	consoleOverlay: boolean;

	/** Enable/disable position offsetters that allow code blocks to be moved via memory values */
	positionOffsetters: boolean;
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
	getListOfModules?: () => Promise<ModuleMetadata[]>;
	getModule?: (slug: string) => Promise<string>;
	getModuleDependencies?: (slug: string) => Promise<string[]>;
	getListOfProjects?: () => Promise<ProjectMetadata[]>;
	getProject?: (url: string) => Promise<string>;

	// Compilation callback
	compileCode?: (
		modules: Module[],
		compilerOptions: CompileOptions,
		functions: Module[],
		macros?: Module[]
	) => Promise<CompilationResult>;

	// Session storage callbacks
	loadSession: () => Promise<Project | null>;
	saveSession?: (project: Project) => Promise<void>;
	loadEditorConfigBlocks?: () => Promise<EditorConfigStorageBlock[] | null>;
	saveEditorConfigBlocks?: (blocks: EditorConfigStorageBlock[]) => Promise<void>;

	// File handling callbacks
	importProject?: () => Promise<Project>;
	exportProject?: (data: string, fileName: string) => Promise<void>;
	exportBinaryCode?: (fileName: string) => Promise<void>;
	fetchBinaryAssets?: (urls: string[]) => Promise<BinaryAsset[]>;
	loadBinaryAssetIntoMemory?: (asset: BinaryAsset) => Promise<void>;
	clearBinaryAssetCache?: () => Promise<void>;
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
	 * Runtime registry mapping runtime IDs to their configuration entries.
	 * Each entry defines a runtime's defaults, schema, and factory function.
	 */
	runtimeRegistry: RuntimeRegistry;
	/**
	 * Default runtime ID to use when no runtime is specified or when an unknown runtime ID is encountered.
	 * Must match a key in the runtimeRegistry.
	 */
	defaultRuntimeId: string;
}

// State interface - complete editor state tree (top-level public API)
export interface State {
	compiler: Compiler;
	midi: Midi;
	graphicHelper: GraphicHelper;
	callbacks: Callbacks;
	featureFlags: FeatureFlags;
	editorMode: EditorMode;
	colorScheme?: ColorScheme;
	historyStack: Project[];
	initialProjectState?: Project;
	redoStack: Project[];
	storageQuota: { usedBytes: number; totalBytes: number };
	binaryAssets: BinaryAsset[];
	/** Console state for internal logging */
	console: ConsoleState;
	runtime: {
		stats: RuntimeStats;
	};
	/** Runtime registry for configurable runtime schemas */
	runtimeRegistry: RuntimeRegistry;
	/** Default runtime ID to use when no runtime is specified */
	defaultRuntimeId: string;
	/** Resolved global editor directives from `; @<name>` comments */
	globalEditorDirectives: ResolvedGlobalEditorDirectives;
	codeErrors: {
		compilationErrors: CodeError[];
		globalEditorDirectiveErrors: CodeError[];
		shaderErrors: CodeError[];
		runtimeDirectiveErrors: CodeError[];
	};
	dialog: {
		show: boolean;
		text: string;
		wrappedText: string[];
		title: string;
		buttons: Array<{
			title: string;
			action: string;
			payload?: unknown;
		}>;
		width: number;
		height: number;
		x: number;
		y: number;
	};
	viewport: Viewport;
	viewportAnimation: ViewportAnimation;
	presentation: PresentationState;
}
