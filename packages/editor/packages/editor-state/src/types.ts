import type { Font, SpriteLookups, ColorScheme } from '@8f4e/sprite-generator';
import type { SpriteLookup, PostProcessEffect } from 'glugglug';
import type { CompileOptions, CompiledModuleLookup, MemoryBuffer, DataStructure, Module } from '@8f4e/compiler';

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
export type RuntimeFactory = (state: State, events: EventDispatcher) => () => void;

export interface CodeBlock {
	code: string[];
	x: number;
	y: number;
	viewport?: Viewport;
}

export interface Size {
	width: number;
	height: number;
}

export interface Position {
	x: number;
	y: number;
}

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

export interface BuildError {
	lineNumber: number;
	code: number;
	message: string;
	moduleId: string;
}

export interface Compiler {
	codeBuffer: Uint8Array;
	compilationTime: number;
	cycleTime: number;
	isCompiling: boolean;
	lastCompilationStart: number;
	memoryBuffer: MemoryBuffer;
	memoryBufferFloat: Float32Array;
	timerAccuracy: number;
	compiledModules: CompiledModuleLookup;
	buildErrors: BuildError[];
	compilerOptions: CompileOptions;
	allocatedMemorySize: number;
	runtimeSettings: Runtimes[];
	selectedRuntime: number;
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

export interface CodeBlockGraphicData {
	width: number;
	minGridWidth: number;
	height: number;
	code: string[];
	padLength: number;
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
	x: number;
	y: number;
	offsetX: number;
	offsetY: number;
	gridX: number;
	gridY: number;
	extras: {
		blockHighlights: Array<{
			x: number;
			y: number;
			height: number;
			width: number;
			color: string;
		}>;
		inputs: Map<string, Input>;
		outputs: Map<string, Output>;
		debuggers: Map<string, Debugger>;
		bufferPlotters: Map<string, BufferPlotter>;
		switches: Map<string, Switch>;
		buttons: Map<string, Switch>;
		pianoKeyboards: Map<number, PianoKeyboard>;
		errorMessages: Map<
			number,
			{
				message: string[];
				x: number;
				y: number;
			}
		>;
	};
	lastUpdated: number;
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

export interface AudioWorkletRuntime {
	runtime: 'AudioWorkletRuntime';
	sampleRate: number;
	audioInputBuffers?: {
		moduleId: string;
		memoryId: string;
		channel: number;
		input: number;
	}[];
	audioOutputBuffers?: {
		moduleId: string;
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
	title: string;
	author: string;
	description: string;
	codeBlocks: CodeBlock[];
	viewport: Viewport;
	selectedRuntime: number;
	runtimeSettings: Runtimes[];
	binaryAssets?: BinaryAsset[];
	/** Compiled WebAssembly bytecode encoded as base64 string for runtime-only execution */
	compiledWasm?: string;
	compiledModules?: CompiledModuleLookup;
	memorySnapshot?: string;
	/** Post-process effects configuration for custom visual effects */
	postProcessEffects?: PostProcessEffect[];
	/** WebAssembly memory size in bytes */
	memorySizeBytes: number;
}

// Default empty project structure used when no project is loaded from storage
export const EMPTY_DEFAULT_PROJECT: Project = {
	title: '',
	author: '',
	description: '',
	codeBlocks: [],
	compiledModules: {},
	viewport: {
		x: 0,
		y: 0,
	},
	selectedRuntime: 0,
	runtimeSettings: [
		{
			runtime: 'WebWorkerLogicRuntime',
			sampleRate: 50,
		},
	],
	binaryAssets: [],
	memorySizeBytes: 1048576, // 1MB default
};

export interface ExampleModule {
	title: string;
	author: string;
	code: string;
	tests: unknown[];
	category: string;
}

export interface ModuleMetadata {
	slug: string;
	title: string;
	category: string;
}

export interface ProjectMetadata {
	slug: string;
	title: string;
	description: string;
}

/**
 * Basic project information (title, author, description)
 * Separate from runtime state for better organization
 */
export interface ProjectInfo {
	title: string;
	author: string;
	description: string;
}

export interface CompilationResult {
	compiledModules: CompiledModuleLookup;
	codeBuffer: Uint8Array;
	allocatedMemorySize: number;
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
	compileProject?: (modules: Module[], compilerOptions: CompileOptions) => Promise<CompilationResult>;

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
	loadColorSchemes?: () => Promise<Record<string, ColorScheme>>;
}

export interface Options {
	featureFlags?: FeatureFlagsConfig;
	callbacks: Callbacks;
}

export interface EditorSettings {
	colorScheme: string;
	font: Font;
}

export interface State {
	/** Basic project information (title, author, description) */
	projectInfo: ProjectInfo;
	compiler: Compiler;
	midi: Midi;
	graphicHelper: GraphicHelper;
	callbacks: Callbacks;
	editorSettings: EditorSettings;
	featureFlags: FeatureFlags;
	colorSchemes: Record<string, ColorScheme>;
	historyStack: Project[];
	redoStack: Project[];
	storageQuota: { usedBytes: number; totalBytes: number };
	binaryAssets: BinaryAsset[];
}
