import { MemoryAddressLookup, MemoryBuffer, Connection, Engine, ModuleState } from 'compiler';

export interface Module {
	engine: Engine;
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

export interface Slider extends Position, Size {
	id: string;
	maxValue: number;
	minValue: number;
	resolution: number;
}

export interface Switch extends Position, Size {
	id: string;
	onClick: (module: Module, memoryBuffer: Int32Array, memoryAddressLookup: MemoryAddressLookup, value: number) => void;
	value: number;
}

export interface Stepper extends Position, Size {
	id: string;
	maxValue: number;
	minValue: number;
}

export type MemoryTransformer = (
	module: Module,
	memoryBuffer: MemoryBuffer,
	memoryAddressLookup: MemoryAddressLookup
) => void;

export interface Line extends Position, Size {
	color?: string;
}

export interface Drawer {
	name: string;
	config: Record<string, number | string>;
}

export interface ModuleType extends Size {
	category: string;
	drawer?: Drawer;
	engine: Engine;
	initialState: ModuleState;
	inputs: Connector[];
	lines: Line[];
	name: string;
	outputs: Connector[];
	sliders: Slider[];
	steppers: Stepper[];
	switches: Switch[];
	transformer?: MemoryTransformer;
}

export type ModuleController = Stepper | Connector | Slider | Switch;

export type ModuleTypeLookup = Record<string, ModuleType>;

export interface Viewport extends Position, Size {
	hGrid: number;
	vGrid: number;
}

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
	memoryBuffer: Int32Array;
	memoryAddressLookup: Record<string, number>;
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

export interface ModuleGeneratorProps {
	hGrid: number;
	vGrid: number;
}
