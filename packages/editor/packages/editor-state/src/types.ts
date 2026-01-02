import { StateManager } from '@8f4e/state-manager';

import type { Font, SpriteLookups, ColorScheme } from '@8f4e/sprite-generator';
import type { SpriteLookup, PostProcessEffect } from 'glugglug';
import type {
	CompileOptions,
	CompiledModuleLookup,
	MemoryBuffer,
	DataStructure,
	Module,
	CompiledFunctionLookup,
} from '@8f4e/compiler';
import type { CompileAndUpdateMemoryResult, MemoryAction as CompilerMemoryAction } from '@8f4e/compiler-worker/types';

// Re-export MemoryAction for use by consumers
export type { CompilerMemoryAction as MemoryAction };

// Feature Flags types
export interface FeatureFlags {
	/** Enable/disable right-click context menu functionality */
	contextMenu: boolean;

	/** Enable/disable info overlay display (development information) */
	infoOverlay: boolean;

	/** Enable/disable dragging and repositioning of code block modules */
	moduleDragging: boolean;

	/** Enable/disable panning/scrolling of the editor viewport */
	viewportDragging: boolean;

	/** Enable/disable viewport animations for programmatic viewport changes */
	viewportAnimations: boolean;

	/** Enable/disable persistent storage functionality */
	persistentStorage: boolean;

	/** Enable/disable all editing functionality (create, edit, delete, save) */
	editing: boolean;

	/** Enable/disable automatic demo mode with periodic code block navigation */
	demoMode: boolean;

	/** Enable/disable history tracking for undo/redo functionality */
	historyTracking?: boolean;

	/** Enable/disable console overlay display (internal logging) */
	consoleOverlay: boolean;
}

/**
 * Type for partial feature flags used in editor configuration.
 * This allows users to specify only the flags they want to override.
 */
export type FeatureFlagsConfig = Partial<FeatureFlags>;

// Runtime types
export type RuntimeType =
	| 'WebWorkerLogicRuntime'
	| 'MainThreadLogicRuntime'
	| 'AudioWorkletRuntime'
	| 'WebWorkerMIDIRuntime';

// EventDispatcher type - complete definition for event management
export interface EventDispatcher {
	on: <T>(eventName: string, callback: (event: T) => void) => void;
	off: <T>(eventName: string, callback: (event: T) => void) => void;
	dispatch: <T>(eventName: string, eventObject?: T) => void;
}

// Event types for user interactions
export interface InternalMouseEvent {
	x: number;
	y: number;
	movementX: number;
	movementY: number;
	buttons: number;
	stopPropagation: boolean;
	canvasWidth: number;
	canvasHeight: number;
}

export interface InternalKeyboardEvent {
	key: string;
	metaKey: boolean;
}

// Type for runtime factory function
export type RuntimeFactory = (store: StateManager<State>, events: EventDispatcher) => () => void;

/**
 * Grid coordinates represent logical cell positions in the editor grid.
 * These are distinct from pixel coordinates used at runtime.
 */
export interface GridCoordinates {
	x: number;
	y: number;
}

/**
 * Project-level viewport using grid coordinates.
 * Used in Project for persistent storage - converted to pixel coordinates at runtime.
 */
export interface ProjectViewport {
	gridCoordinates: GridCoordinates;
	animationDurationMs?: number;
}

export interface CodeBlock {
	code: string[];
	/** Grid coordinates for the code block position in the editor */
	gridCoordinates: GridCoordinates;
	viewport?: ProjectViewport;
}

export interface Size {
	width: number;
	height: number;
}

export interface Position {
	x: number;
	y: number;
}

/**
 * Runtime viewport type using pixel coordinates.
 * Used in graphicHelper.viewport for runtime rendering.
 * This is separate from ProjectViewport which uses grid coordinates for persistence.
 */
export type Viewport = {
	x: number;
	y: number;
	animationDurationMs?: number;
};

interface ContextMenuButton {
	action?: string;
	selector?: string;
	value?: unknown;
	close?: boolean;
	payload?: Record<string, unknown>;
	disabled?: boolean;
	divider?: boolean;
	title?: string;
	isSectionTitle?: boolean;
}

interface MenuItemDivider extends ContextMenuButton {
	divider: true;
	title: never;
}

export type ContextMenuItem = ContextMenuButton | MenuItemDivider;

export type MenuGenerator = (state: State, payload?: unknown) => ContextMenuItem[] | Promise<ContextMenuItem[]>;

export interface ContextMenu extends Position {
	highlightedItem: number;
	itemWidth: number;
	items: ContextMenuItem[];
	open: boolean;
	menuStack: string[];
}

export interface Compiler {
	codeBuffer: Uint8Array;
	compilationTime: number;
	isCompiling: boolean;
	lastCompilationStart: number;
	memoryBuffer: MemoryBuffer;
	memoryBufferFloat: Float32Array;
	compiledModules: CompiledModuleLookup;
	compilerOptions: CompileOptions;
	allocatedMemorySize: number;
	compiledFunctions?: CompiledFunctionLookup;
	disableAutoCompilation: boolean;
	compiledConfig?: Record<string, unknown>;
}

export interface Midi {
	outputs: MIDIOutput[];
	inputs: MIDIInput[];
}

export interface MemoryIdentifier {
	memory: DataStructure;
	showAddress: boolean;
	showEndAddress: boolean;
	bufferPointer: number;
	showBinary: boolean;
}

export interface BufferPlotter {
	width: number;
	height: number;
	x: number;
	y: number;
	minValue: number;
	maxValue: number;
	buffer: MemoryIdentifier;
	bufferLength: MemoryIdentifier | undefined;
}
export interface Switch {
	width: number;
	height: number;
	x: number;
	y: number;
	id: string;
	offValue: number;
	onValue: number;
}

export interface Debugger {
	width: number;
	height: number;
	showAddress: boolean;
	showEndAddress: boolean;
	x: number;
	y: number;
	id: string;
	memory: DataStructure;
	bufferPointer: number;
	showBinary: boolean;
}

export interface Output {
	codeBlock: CodeBlockGraphicData;
	width: number;
	height: number;
	x: number;
	y: number;
	id: string;
	calibratedMax: number;
	calibratedMin: number;
	memory: DataStructure;
}

export interface Input {
	codeBlock: CodeBlockGraphicData;
	width: number;
	height: number;
	x: number;
	y: number;
	id: string;
	wordAlignedAddress: number;
}

export interface PianoKeyboard {
	x: number;
	y: number;
	width: number;
	height: number;
	keyWidth: number;
	pressedKeys: Set<number>;
	pressedKeysListMemory: DataStructure;
	pressedNumberOfKeysMemory: DataStructure;
	startingNumber: number;
}

/**
 * The type of a code block, determined by its content markers.
 * - 'module': Contains module/moduleEnd markers (compiled to WASM)
 * - 'config': Contains config/configEnd markers (compiled to JSON configuration)
 * - 'function': Contains function/functionEnd markers (compiled to WASM as reusable helper)
 * - 'constants': Contains constants/constantsEnd markers
 * - 'vertexShader': Contains vertexShader/vertexShaderEnd markers (GLSL vertex shader)
 * - 'fragmentShader': Contains fragmentShader/fragmentShaderEnd markers (GLSL fragment shader)
 * - 'comment': Contains comment/commentEnd markers (documentation, excluded from compilation)
 * - 'unknown': Mixed or incomplete markers, or no recognizable markers
 */
export type CodeBlockType =
	| 'module'
	| 'config'
	| 'function'
	| 'constants'
	| 'vertexShader'
	| 'fragmentShader'
	| 'comment'
	| 'unknown';

export interface CodeBlockGraphicData {
	width: number;
	minGridWidth: number;
	height: number;
	code: string[];
	lineNumberColumnWidth: number;
	codeToRender: number[][];
	codeColors: Array<Array<SpriteLookup | undefined>>;
	/** The gaps between lines */
	gaps: Map<number, { size: number }>;
	cursor: {
		/** The column of the cursor */
		col: number;
		/** The row of the cursor */
		row: number;
		/** The x position of the cursor calculated considering the grid and the line numbers. */
		x: number;
		/** The y position of the cursor calculated considering the grid and the gaps between lines. */
		y: number;
	};
	id: string;
	positionOffsetterXWordAddress?: number;
	positionOffsetterYWordAddress?: number;
	/** Grid-space X coordinate (source of truth for horizontal position). Pixel X = gridX * vGrid */
	gridX: number;
	/** Grid-space Y coordinate (source of truth for vertical position). Pixel Y = gridY * hGrid */
	gridY: number;
	/** Pixel-space X coordinate, computed from gridX * vGrid (where vGrid = characterWidth) */
	x: number;
	/** Pixel-space Y coordinate, computed from gridY * hGrid (where hGrid = characterHeight) */
	y: number;
	offsetX: number;
	offsetY: number;
	extras: {
		blockHighlights: Array<{
			x: number;
			y: number;
			height: number;
			width: number;
			color: string;
		}>;
		inputs: Input[];
		outputs: Output[];
		debuggers: Debugger[];
		bufferPlotters: BufferPlotter[];
		switches: Switch[];
		buttons: Switch[];
		pianoKeyboards: PianoKeyboard[];
		errorMessages: Array<{
			message: string[];
			x: number;
			y: number;
			lineNumber: number;
		}>;
	};
	lastUpdated: number;
	/**
	 * Monotonically increasing index assigned when the code block is created.
	 * Used to maintain stable ordering for compiler module list.
	 * This is a runtime-only value and is NOT persisted.
	 */
	creationIndex: number;
	/**
	 * The type of the code block, determined by its content markers.
	 * Updated automatically when code changes.
	 */
	blockType: CodeBlockType;
}

export type GraphicHelper = {
	spriteLookups?: SpriteLookups;
	outputsByWordAddress: Map<number, Output>;
	viewport: {
		width: number;
		height: number;
		roundedWidth: number;
		roundedHeight: number;
		vGrid: number;
		hGrid: number;
		borderLineCoordinates: {
			top: { startX: number; startY: number; endX: number; endY: number };
			right: { startX: number; startY: number; endX: number; endY: number };
			bottom: { startX: number; startY: number; endX: number; endY: number };
			left: { startX: number; startY: number; endX: number; endY: number };
		};
		center: { x: number; y: number };
		x: number;
		y: number;
		animationDurationMs?: number;
	};
	codeBlocks: Set<CodeBlockGraphicData>;
	/**
	 * Monotonically increasing counter for assigning creationIndex to new code blocks.
	 * Incremented each time a new code block is created.
	 * This is a runtime-only value and is NOT persisted.
	 */
	nextCodeBlockCreationIndex: number;
	contextMenu: ContextMenu;
	draggedCodeBlock?: CodeBlockGraphicData;
	selectedCodeBlock?: CodeBlockGraphicData;
	dialog: {
		show: boolean;
		text: string;
		title: string;
		buttons: Array<{
			title: string;
			action: string;
			payload?: unknown;
		}>;
	};
	/** Post-process effects configuration for custom visual effects */
	postProcessEffects: PostProcessEffect[];
};

export interface BinaryAsset {
	/** The id of the module that the binary data should be loaded into */
	moduleId?: string;
	/** The id of the memory that the binary data should be loaded into */
	memoryId?: string;
	/** The file name of the binary data */
	fileName: string;
	/** Non-cryptographic hash for versioning */
	contentHash?: string;
	/** Web, data or relative file URL */
	url?: string;
	/** MIME type of the binary data */
	mimeType?: string;
	/** Size of the binary data in bytes */
	sizeBytes?: number;
}

interface MidiNoteIO {
	moduleId: string;
	channelMemoryId?: string;
	portMemoryId?: string;
	velocityMemoryId?: string;
	noteOnOffMemoryId?: string;
	noteMemoryId?: string;
}

interface MidiCCIO {
	moduleId: string;
	channelMemoryId?: string;
	selectedCCMemoryId?: string;
	valueMemoryId?: string;
}

export interface WebWorkerLogicRuntime {
	runtime: 'WebWorkerLogicRuntime';
	sampleRate: number;
}

export interface MainThreadLogicRuntime {
	runtime: 'MainThreadLogicRuntime';
	sampleRate: number;
}

/**
 * AudioWorklet runtime configuration.
 *
 * Audio buffers use a unified `memoryId` format in the form `'module.memory'` (e.g., 'audiooutL.buffer').
 * This aligns with the `module.memory` syntax used elsewhere in the editor.
 */
export interface AudioWorkletRuntime {
	runtime: 'AudioWorkletRuntime';
	sampleRate: number;
	audioInputBuffers?: {
		/**
		 * Memory identifier in unified format `'module.memory'` (e.g., 'audioin.buffer').
		 */
		memoryId: string;
		channel: number;
		input: number;
	}[];
	audioOutputBuffers?: {
		/**
		 * Memory identifier in unified format `'module.memory'` (e.g., 'audiooutL.buffer').
		 */
		memoryId: string;
		channel: number;
		output: number;
	}[];
}

export interface WebWorkerMIDIRuntime {
	runtime: 'WebWorkerMIDIRuntime';
	sampleRate: number;
	midiNoteOutputs?: MidiNoteIO[];
	midiNoteInputs?: MidiNoteIO[];
	midiControlChangeOutputs?: MidiCCIO[];
	midiControlChangeInputs?: MidiCCIO[];
}

export type Runtimes = WebWorkerLogicRuntime | MainThreadLogicRuntime | AudioWorkletRuntime | WebWorkerMIDIRuntime;

export interface Project {
	codeBlocks: CodeBlock[];
	/** Viewport position using grid coordinates for persistent storage */
	viewport: ProjectViewport;
	binaryAssets?: BinaryAsset[];
	/** Compiled WebAssembly bytecode encoded as base64 string for runtime-only execution */
	compiledWasm?: string;
	compiledModules?: CompiledModuleLookup;
	memorySnapshot?: string;
	/** Compiled configuration from config blocks for runtime-only execution */
	compiledConfig?: Record<string, unknown>;
	/** Post-process effects configuration for custom visual effects */
	postProcessEffects?: PostProcessEffect[];
}

// Default empty project structure used when no project is loaded from storage
export const EMPTY_DEFAULT_PROJECT: Project = {
	codeBlocks: [],
	compiledModules: {},
	viewport: {
		gridCoordinates: { x: 0, y: 0 },
	},
	binaryAssets: [],
};

export interface ExampleModule {
	title: string;
	description?: string;
	author: string;
	code: string;
	tests: unknown[];
	category: string;
}

export interface ModuleMetadata {
	slug: string;
	title: string;
	description?: string;
	category: string;
}

export interface ProjectMetadata {
	slug: string;
	title: string;
}

export interface CompilationResult extends Omit<CompileAndUpdateMemoryResult, 'memoryRef'> {
	memoryBuffer: MemoryBuffer;
	memoryBufferFloat: Float32Array;
}

// Callbacks interface contains all callback functions
export interface Callbacks {
	requestRuntime: (runtimeType: RuntimeType) => Promise<RuntimeFactory>;

	// Module and project loading callbacks
	getListOfModules?: () => Promise<ModuleMetadata[]>;
	getModule?: (slug: string) => Promise<ExampleModule>;
	getListOfProjects?: () => Promise<ProjectMetadata[]>;
	getProject?: (slug: string) => Promise<Project>;

	// Compilation callback
	compileCode?: (
		modules: Module[],
		compilerOptions: CompileOptions,
		functions?: Module[]
	) => Promise<CompilationResult>;

	// Session storage callbacks
	loadSession: () => Promise<Project | null>;
	saveSession?: (project: Project) => Promise<void>;
	loadEditorSettings?: () => Promise<EditorSettings | null>;
	saveEditorSettings?: (settings: EditorSettings) => Promise<void>;

	// File handling callbacks
	importProject?: () => Promise<Project>;
	exportProject?: (data: string, fileName: string) => Promise<void>;
	importBinaryFile?: () => Promise<{ fileName: string }>;
	exportBinaryFile?: (data: Uint8Array, fileName: string, mimeType: string) => Promise<void>;
	loadBinaryFileIntoMemory?: (file: BinaryAsset) => Promise<void>;
	getStorageQuota?: () => Promise<{ usedBytes: number; totalBytes: number }>;

	// Color scheme loader callback
	getListOfColorSchemes?: () => Promise<string[]>;
	getColorScheme?: (name: string) => Promise<ColorScheme>;

	// Config compilation callback
	/**
	 * Compiles a stack-config program source into a JSON configuration object.
	 * Used by config blocks to generate runtime configuration.
	 *
	 * @param source - The config program source code (one command per line)
	 * @param schema - JSON Schema describing the expected config structure
	 * @returns Promise containing the compiled config object and any errors
	 */
	compileConfig?: (source: string, schema: ConfigSchema) => Promise<ConfigCompilationResult>;
}

/**
 * Supported primitive types in config schema subset
 */
export type ConfigSchemaType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

/**
 * A subset of JSON Schema used for config validation
 */
export interface ConfigSchema {
	type?: ConfigSchemaType | ConfigSchemaType[];
	enum?: readonly (string | number | boolean | null)[];
	properties?: Record<string, ConfigSchema>;
	required?: readonly string[];
	items?: ConfigSchema;
	additionalProperties?: boolean | ConfigSchema;
}

/**
 * Result of compiling a stack-config program
 */
export interface ConfigCompilationResult {
	/** The resulting JSON-compatible configuration object, or null if there were errors */
	config: unknown | null;
	/** Array of error objects with line numbers and messages */
	errors: { line: number; message: string }[];
}

export interface Options {
	featureFlags?: FeatureFlagsConfig;
	callbacks: Callbacks;
}

export interface EditorSettings {
	colorScheme: string;
	font: Font;
}

export interface LogMessage {
	level: 'log' | 'warn' | 'error' | 'info';
	category?: string;
	timestamp: string;
	message: string;
}

export interface ConsoleState {
	logs: LogMessage[];
	maxLogs: number;
}

export interface RuntimeStats {
	timerPrecisionPercentage: number;
	timeToExecuteLoopMs: number;
	timerDriftMs: number;
	timerExpectedIntervalTimeMs: number;
}

export interface CodeError {
	lineNumber: number;
	message: string;
	codeBlockId: string | number;
}

export interface State {
	compiler: Compiler;
	midi: Midi;
	graphicHelper: GraphicHelper;
	callbacks: Callbacks;
	editorSettings: EditorSettings;
	featureFlags: FeatureFlags;
	colorSchemes: string[];
	colorScheme?: ColorScheme;
	historyStack: Project[];
	redoStack: Project[];
	storageQuota: { usedBytes: number; totalBytes: number };
	binaryAssets: BinaryAsset[];
	/** Console state for internal logging */
	console: ConsoleState;
	runtime: {
		runtimeSettings: Runtimes[];
		selectedRuntime: number;
		stats: RuntimeStats;
	};
	codeErrors: {
		compilationErrors: CodeError[];
		configErrors: CodeError[];
	};
}
