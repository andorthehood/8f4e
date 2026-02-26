/**
 * Central type re-exports for editor-state.
 * This file now acts as a barrel, importing types from feature-specific modules
 * and re-exporting them for backward compatibility and public API stability.
 */

import type { Module, CompileOptions } from '@8f4e/compiler';
import type { MemoryAction as CompilerMemoryAction } from '@8f4e/compiler-worker/types';
import type { ColorScheme } from '@8f4e/sprite-generator';
import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';
import type { BinaryAsset } from './features/binary-assets/types';
import type { ParsedDirective } from './features/directives/types';
import type {
	CodeBlock,
	CodeBlockType,
	CodeBlockGraphicData,
	Input,
	Output,
	Debugger,
	MemoryIdentifier,
	BufferPlotter,
	Switch,
	Slider,
	PianoKeyboard,
	GraphicHelper,
} from './features/code-blocks/types';
import type { NavigateCodeBlockEvent, MoveCaretEvent, InsertTextEvent } from './features/code-editing/types';
import type { ConfigCompilationResult } from './features/config-compiler/types';
import type { EditorConfig, EditorConfigBlock } from './features/editor-config/types';
import type { ProjectConfig } from './features/project-config/types';
import type { LogMessage, ConsoleState } from './features/logger/types';
import type { ContextMenuItem, MenuGenerator, MenuStackEntry, ContextMenu } from './features/menu/types';
import type { Compiler, CompilationResult } from './features/program-compiler/types';
import type { Project, ModuleMetadata, ProjectMetadata } from './features/project-import/types';
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
} from './features/runtime/types';
import type { ProjectViewport, Viewport } from './features/viewport/types';
import type {
	Size,
	Position,
	GridCoordinates,
	EventDispatcher,
	InternalMouseEvent,
	InternalKeyboardEvent,
} from './shared/types';

// Re-export MemoryAction for use by consumers
export type { CompilerMemoryAction as MemoryAction };

// Re-export shared types
export type { Size, Position, GridCoordinates, EventDispatcher, InternalMouseEvent, InternalKeyboardEvent };

// Re-export viewport types
export type { ProjectViewport };

// Re-export code-blocks types
export type {
	CodeBlock,
	CodeBlockType,
	CodeBlockGraphicData,
	Input,
	Output,
	Debugger,
	MemoryIdentifier,
	BufferPlotter,
	Switch,
	Slider,
	PianoKeyboard,
	GraphicHelper,
};

// Re-export menu types
export type { ContextMenuItem, MenuGenerator, MenuStackEntry, ContextMenu };

// Re-export program-compiler types
export type { Compiler, CompilationResult };

// Re-export config types
export type { ConfigCompilationResult, ProjectConfig, EditorConfig, EditorConfigBlock };

// Re-export runtime types
export type {
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
};

// Re-export logger types
export type { LogMessage, ConsoleState };

// Re-export binary-assets types
export type { BinaryAsset };
export type { ParsedDirective };

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

	/** Enable/disable viewport animations for programmatic viewport changes */
	viewportAnimations: boolean;

	/** Enable/disable all editing functionality (create, edit, delete, save) */
	editing: boolean;

	/** Enable/disable keyboard toggling between view/edit modes (i/Escape) */
	modeToggling: boolean;

	/** Enable/disable automatic demo mode with periodic code block navigation */
	demoMode: boolean;

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
	loadEditorConfigBlocks?: () => Promise<EditorConfigBlock[] | null>;
	saveEditorConfigBlocks?: (blocks: EditorConfigBlock[]) => Promise<void>;

	// File handling callbacks
	importProject?: () => Promise<Project>;
	exportProject?: (data: string, fileName: string) => Promise<void>;
	exportBinaryCode?: (fileName: string) => Promise<void>;
	fetchBinaryAssets?: (urls: string[]) => Promise<BinaryAsset[]>;
	loadBinaryAssetIntoMemory?: (asset: BinaryAsset) => Promise<void>;
	clearBinaryAssetCache?: () => Promise<void>;
	getStorageQuota?: () => Promise<{ usedBytes: number; totalBytes: number }>;

	// Config compilation callback
	/**
	 * Compiles a stack-config program source into a JSON configuration object.
	 * Used by config blocks to generate runtime configuration.
	 *
	 * @param sourceBlocks - Config block source codes in execution order
	 * @param schema - JSON Schema describing the expected config structure
	 * @returns Promise containing the compiled config object and any errors
	 */
	compileConfig?: (sourceBlocks: string[], schema: JSONSchemaLike) => Promise<ConfigCompilationResult>;

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

// CodeError type for error reporting (top-level public API)
export interface CodeError {
	lineNumber: number;
	message: string;
	codeBlockId: string | number;
}

// State interface - complete editor state tree (top-level public API)
export interface State {
	compiler: Compiler;
	midi: Midi;
	graphicHelper: GraphicHelper;
	callbacks: Callbacks;
	featureFlags: FeatureFlags;
	colorScheme?: ColorScheme;
	historyStack: Project[];
	initialProjectState?: Project;
	compiledProjectConfig: ProjectConfig;
	compiledEditorConfig: EditorConfig;
	redoStack: Project[];
	storageQuota: { usedBytes: number; totalBytes: number };
	binaryAssets: BinaryAsset[];
	directives: ParsedDirective[];
	/** Console state for internal logging */
	console: ConsoleState;
	runtime: {
		stats: RuntimeStats;
	};
	/** Runtime registry for configurable runtime schemas */
	runtimeRegistry: RuntimeRegistry;
	/** Default runtime ID to use when no runtime is specified */
	defaultRuntimeId: string;
	codeErrors: {
		compilationErrors: CodeError[];
		projectConfigErrors: CodeError[];
		editorConfigErrors: CodeError[];
		shaderErrors: CodeError[];
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
}
