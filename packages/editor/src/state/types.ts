import { SpriteLookup } from '@8f4e/2d-engine';
import { CompiledModuleLookup, CompileOptions, MemoryBuffer } from '@8f4e/compiler';
import { Font, SpriteLookups } from '@8f4e/sprite-generator';
import { IPatcher } from '@rnbo/js';

export interface Module {
	code: string[];
	isOpen: boolean;
	x: number;
	y: number;
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
}

interface MenuItemDivider extends ContextMenuButton {
	divider: true;
	title: never;
}

export type ExtendedInstructionSet = 'debug' | 'button' | 'switch' | 'offset' | 'scope';

export type ContextMenuItem = ContextMenuButton | MenuItemDivider;

export type MenuGenerator = (state: State, payload?: any) => ContextMenuItem[];

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
	compilationTime: string;
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
}

export interface Midi {
	outputs: MIDIOutput[];
	inputs: MIDIInput[];
}

export interface Scope {
	width: number;
	height: number;
	x: number;
	y: number;
	id: string;
	minValue: number;
	maxValue: number;
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
	wordAddress: number;
	showAddress: boolean;
	isInteger: boolean;
	x: number;
	y: number;
	id: string;
}

export interface Output {
	module: ModuleGraphicData;
	width: number;
	height: number;
	x: number;
	y: number;
	id: string;
	calibratedMax: number;
	calibratedMin: number;
	wordAddress: number;
	isInteger: boolean;
}

export interface Input {
	module: ModuleGraphicData;
	width: number;
	height: number;
	x: number;
	y: number;
	id: string;
	wordAddress: number;
}

export interface ModuleGraphicData {
	width: number;
	height: number;
	inputs: Map<string, Input>;
	outputs: Map<string, Output>;
	code: string[];
	padLength: number;
	codeWithLineNumbers: string[];
	codeToRender: number[][];
	codeColors: Array<Array<SpriteLookup | undefined>>;
	gaps: Map<number, { size: number }>;
	cursor: { col: number; row: number; x: number; y: number };
	id: string;
	debuggers: Map<string, Debugger>;
	scopes: Map<string, Scope>;
	switches: Map<string, Switch>;
	buttons: Map<string, Switch>;
	positionOffsetterXWordAddress?: number;
	positionOffsetterYWordAddress?: number;
	x: number;
	y: number;
	offsetX: number;
	offsetY: number;
	isOpen: boolean;
	errorMessages: Map<
		number,
		{
			message: string[];
			x: number;
			y: number;
		}
	>;
	isGroup: boolean;
}

export type GraphicHelper = {
	spriteLookups?: SpriteLookups;
	outputsByWordAddress: Map<number, Output>;
	modules: Set<ModuleGraphicData>;
	viewport: {
		width: number;
		height: number;
		roundedWidth: number;
		roundedHeight: number;
		vGrid: number;
		hGrid: number;
		x: number;
		y: number;
		borderLineCoordinates: {
			top: { startX: number; startY: number; endX: number; endY: number };
			right: { startX: number; startY: number; endX: number; endY: number };
			bottom: { startX: number; startY: number; endX: number; endY: number };
			left: { startX: number; startY: number; endX: number; endY: number };
		};
		center: { x: number; y: number };
	};
	contextMenu: ContextMenu;
	draggedModule?: ModuleGraphicData;
	selectedModule?: ModuleGraphicData;
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

export interface Group {
	code: string[];
	modules: Module[];
	groups: Group[];
}

export interface Project {
	title: string;
	author: string;
	description: string;
	modules: Module[];
	groups: Group[];
	viewport: Viewport;
	rnbo: { patchers: Record<string, IPatcher> };
	sampleRate: number;
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
}
