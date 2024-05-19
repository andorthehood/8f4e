import { CompileOptions, CompiledModuleLookup, MemoryBuffer, DataStructure } from '@8f4e/compiler';
import { Font, SpriteLookups } from '@8f4e/sprite-generator';
import { SpriteLookup } from '@8f4e/2d-engine';

export interface CodeBlock {
	code: string[];
	isOpen: boolean;
	x: number;
	y: number;
	viewport?: Viewport;
	codeBlocks?: CodeBlock[];
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
};

interface ContextMenuButton {
	action?: string;
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

export type ExtendedInstructionSet = 'debug' | 'button' | 'switch' | 'offset' | 'plot' | 'piano';

export type ContextMenuItem = ContextMenuButton | MenuItemDivider;

export type MenuGenerator = (state: State, payload?: any) => ContextMenuItem[] | Promise<ContextMenuItem[]>;

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

export interface Runtime {
	runner: 'audioWorklet' | 'webWorker';
	latency: number;
	renderQuantum: number;
}

export interface Compiler {
	codeBuffer: Uint8Array;
	compilationTime: number;
	cycleTime: number;
	isCompiling: boolean;
	lastCompilationStart: number;
	memoryBuffer: MemoryBuffer;
	memoryBufferFloat: Float32Array;
	memoryRef: WebAssembly.Memory;
	timerAccuracy: number;
	compiledModules: CompiledModuleLookup;
	buildErrors: BuildError[];
	compilerOptions: CompileOptions;
	allocatedMemorySize: number;
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
	trimmedCode: string[];
	padLength: number;
	codeToRender: number[][];
	codeColors: Array<Array<SpriteLookup | undefined>>;
	gaps: Map<number, { size: number }>;
	cursor: { col: number; row: number; x: number; y: number };
	id: string;
	positionOffsetterXWordAddress?: number;
	positionOffsetterYWordAddress?: number;
	x: number;
	y: number;
	offsetX: number;
	offsetY: number;
	gridX: number;
	gridY: number;
	isOpen: boolean;
	extras: {
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
	viewport: Viewport;
	parent: CodeBlockGraphicData;
	codeBlocks: Set<CodeBlockGraphicData>;
}

export type GraphicHelper = {
	spriteLookups?: SpriteLookups;
	outputsByWordAddress: Map<number, Output>;
	globalViewport: {
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
	};
	baseCodeBlock: CodeBlockGraphicData;
	activeViewport: CodeBlockGraphicData;
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
			payload?: any;
		}>;
	};
};

export interface BinaryAsset {
	/** The id of the module that the binary data should be loaded into */
	moduleId?: string;
	/** The id of the memory that the binary data should be loaded into */
	memoryId?: string;
	/** The binary data in base64 format */
	data: string;
	/** The file name of the binary data */
	fileName: string;
}

export interface Project {
	title: string;
	author: string;
	description: string;
	codeBlocks: CodeBlock[];
	viewport: Viewport;
	sampleRate: number;
	binaryAssets: BinaryAsset[];
	audioInputBuffers: {
		moduleId: string;
		memoryId: string;
		channel: number;
		input: number;
	}[];
	audioOutputBuffers: {
		moduleId: string;
		memoryId: string;
		channel: number;
		output: number;
	}[];
}

export interface ExampleModule {
	title: string;
	author: string;
	code: string;
	tests: unknown[];
	category: string;
}

export interface Options {
	isLocalStorageEnabled: boolean;
	isDebugMode: boolean;
	localStorageId: string;
	exampleProjects: Record<string, Project>;
	exampleModules: Record<string, ExampleModule>;
}

export interface EditorSettings {
	colorScheme: string;
	font: Font;
}

export interface State {
	compiler: Compiler;
	runtime: Runtime;
	midi: Midi;
	graphicHelper: GraphicHelper;
	project: Project;
	options: Options;
	editorSettings: EditorSettings;
	compilationTime: number;
}
