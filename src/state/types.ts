import {
	Connection,
	MemoryAddressLookup,
	MemoryBuffer,
	ModuleState,
	ModuleStateExtractor,
	ModuleStateInserter,
} from '@8f4e/compiler';

export interface Module {
	id: string;
	state: ModuleState;
	type: string;
	x: number;
	y: number;
}

export interface Connector extends Position, Size {
	id: string;
	label?: string;
}

export interface Size {
	width: number;
	height: number;
}

export interface Position {
	x: number;
	y: number;
}

export interface HitArea extends Size, Position {}

export type SliderChangeHandler = (
	module: Module,
	memoryBuffer: MemoryBuffer,
	memoryAddressLookup: MemoryAddressLookup,
	value: number,
	slider: Slider
) => void;

export interface Slider extends Position, Size {
	id: string;
	maxValue: number;
	minValue: number;
	resolution: number;
	onChange: SliderChangeHandler;
}

export type ButtonClickHandler = (
	module: Module,
	memoryBuffer: MemoryBuffer,
	memoryAddressLookup: MemoryAddressLookup,
	value: number
) => void;

export interface Button extends Position, Size {
	id: string;
	onClick: ButtonClickHandler;
	value: number;
}

export type StepperChangeHandler = (module: Module, state: State, value, stepper: Stepper) => void;

export interface Stepper extends Position, Size {
	id: string;
	maxValue: number;
	minValue: number;
	onChange: StepperChangeHandler;
	label: string;
	textValue?: string;
	upHitArea: HitArea;
	downHitArea: HitArea;
}

export interface Drawer<DrawerConfig> {
	name: string;
	config: DrawerConfig;
}

export interface ModuleType<DrawerConfig = unknown> extends Size {
	category: string;
	drawer?: Drawer<DrawerConfig>;
	engine: {
		source: string;
	};
	initialState: ModuleState;
	inputs: Connector[];
	name: string;
	outputs: Connector[];
	sliders?: Slider[];
	steppers?: Stepper[];
	buttons: Button[];
	extractState?: ModuleStateExtractor<ModuleState>;
	insertState?: ModuleStateInserter<ModuleState>;
}

export type ModuleController = Stepper | Connector | Slider | Button;

export type ModuleTypeLookup = Record<string, ModuleType>;

export interface Viewport extends Position, Size {}

export interface ContextMenuItem {
	action: string;
	close?: boolean;
	payload?: Record<string, unknown>;
	title: string;
}

export interface ContextMenu extends Position {
	highlightedItem: number;
	itemHeight: number;
	itemWidth: number;
	items: ContextMenuItem[];
	open: boolean;
}

export type MidiPort = {
	id: string;
	name: string;
	manufacturer: string;
};

export type HistoryItem = {
	connections: Connection[];
	modules: Module[];
};

export interface Compiler {
	compilationTime: string;
	cycleTime: number;
	isCompiling: boolean;
	lastCompilationStart: number;
	memoryBuffer: MemoryBuffer;
	memoryAddressLookup: MemoryAddressLookup;
	timerAccuracy: number;
}

export interface Error {
	display: boolean;
	message: string;
}

export interface Midi {
	ports: MidiPort[];
}

export interface State {
	compiler: Compiler;
	connectionFromConnector: string;
	connectionFromModule: string;
	connectionPointA: unknown;
	connectionPointB: unknown;
	connections: Connection[];
	contextMenu: ContextMenu;
	error: Error;
	history: HistoryItem[];
	isConnectionBeingMade: boolean;
	isDebugMode: boolean;
	midi: Midi;
	moduleTypes: ModuleTypeLookup;
	modules: Module[];
	sructureVersion: number;
	viewport: Viewport;
}
