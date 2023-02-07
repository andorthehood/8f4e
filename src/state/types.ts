import { SpriteLookup } from '@8f4e/2d-engine';
import { CompiledModuleLookup, Connection, MemoryAddressLookup, MemoryBuffer } from '@8f4e/compiler';

export interface Module {
	id: string;
	code: string[];
	isOpen: boolean;
	x: number;
	y: number;
}

export interface Connector extends Position, Size {
	id: string;
	label?: string;
	isInput?: boolean;
}

export interface Size {
	width: number;
	height: number;
}

export interface Position {
	x: number;
	y: number;
}

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
	compiledModules: CompiledModuleLookup;
}

export interface Error {
	display: boolean;
	message: string;
}

export interface Midi {
	ports: MidiPort[];
}

export interface ModuleGraphicData {
	width: number;
	height: number;
	inputs: Map<string, { width: number; height: number; x: number; y: number; id: string }>;
	outputs: Map<string, { width: number; height: number; x: number; y: number; id: string; labelOffset: number }>;
	code: string[];
	codeColors: Array<SpriteLookup | undefined>[];
	cursor: { col: number; row: number; offset: number };
}

export type GraphicHelper = Map<string, ModuleGraphicData>;

export interface State {
	compiler: Compiler;
	connectionFromConnector: string;
	connectionFromModule: string;
	connectionPointA: [number, number];
	connectionPointB: [number, number];
	connections: Connection[];
	contextMenu: ContextMenu;
	error: Error;
	history: HistoryItem[];
	isConnectionBeingMade: boolean;
	isDebugMode: boolean;
	midi: Midi;
	modules: Module[];
	selectedModule: Module;
	sructureVersion: number;
	viewport: Viewport;
	graphicHelper: GraphicHelper;
}
