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

export interface Connection {}

export interface Connector {
	id: string;
	isInput?: boolean;
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

export interface State {
	modules: Module[];
	connections: Connection[];
	isDebugMode: boolean;
	compiler: {
		compilationTime: number;
		cycleTime: number;
		isCompiling: boolean;
		lastCompilationStart: number;
		memoryBuffer: Int32Array;
		outputAddressLookup: { [key: string]: number };
		timerAccuracy: number;
	};
	viewport: {
		hGrid: number;
		height: number;
		vGrid: number;
		width: number;
		x: number;
		y: number;
	};
	midi: {
		ports: [];
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
