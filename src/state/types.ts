import { MemoryBuffer } from 'compiler';

export interface Module {
	col: number;
	config: { [key: string]: any };
	engine: string;
	id: string;
	row: number;
	type: string;
	x: number;
	y: number;
}

export interface Connection {
	fromModule: string;
	toModule: string;
	fromConnector: string;
	toConnector: string;
}

export interface Connector {
	id: string;
	label?: string;
	x: number;
	y: number;
}

export interface Slider {
	height: number;
	id: string;
	maxValue: number;
	minValue: number;
	resolution: number;
	width: number;
	x: number;
	y: number;
}

export interface Switch {
	height: number;
	id: string;
	offValue: number | boolean | string;
	onValue: number | boolean | string;
	width: number;
	x: number;
	y: number;
}

export interface Stepper {
	height: number;
	id: string;
	maxValue: number;
	minValue: number;
	width: number;
	x: number;
	y: number;
}

export type MemoryTransformer = (
	module: Module,
	memoryBuffer: MemoryBuffer,
	memoryAddressLookup: { [key: string]: number }
) => void;

export interface ModuleType {
	category: string;
	config?: Object;
	inputs: Connector[];
	outputs: Connector[];
	engine: string;
	height: number;
	name: string;
	sliders: Slider[];
	steppers: Stepper[];
	switches: Switch[];
	transformer?: MemoryTransformer;
	width: number;
}

export type ModuleTypeLookup = { [key: string]: ModuleType };

export type Viewport = {
	hGrid: number;
	height: number;
	vGrid: number;
	width: number;
	x: number;
	y: number;
};

export type MidiPort = {
	id: string;
	name: string;
	manufacturer: string;
};

export type HistoryItem = {
	modules: Module[];
	connections: Connection[];
};

export interface State {
	history: HistoryItem[];
	sructureVersion: number;
	modules: Module[];
	connections: Connection[];
	isDebugMode: boolean;
	compiler: {
		compilationTime: string;
		cycleTime: number;
		isCompiling: boolean;
		lastCompilationStart: number;
		memoryBuffer: Int32Array;
		outputAddressLookup: { [key: string]: number };
		timerAccuracy: number;
	};
	viewport: Viewport;
	midi: {
		ports: MidiPort[];
	};
	error: {
		display: boolean;
		message: string;
	};
	isConnectionBeingMade: boolean;
	connectionPointA: any;
	connectionPointB: any;
	contextMenu: any;
}
