export interface Module {
	id: string;
	type: string;
	x: number;
	y: number;
}

export interface Connection {}

export interface Connector {
	id: string;
	x: number;
	y: number;
	isInput?: boolean;
	label?: string;
}

export interface Slider {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	minValue: number;
	maxValue: number;
	resolution: number;
}

export interface Switch {
	id: string;
	onValue: number;
	offValue: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface ModuleType {
	width: number;
	height: number;
	connectors: Connector[];
	name: string;
	sliders: Slider[];
	defaultValues?: Object;
	switches: Switch[];
}

export interface State {
	modules: Module[];
	connections: Connection[];
	isDebugMode: boolean;
	compiler: {};
	viewport: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	midi: {
		ports: [];
	};
	error: {
		display: boolean;
		message: string;
	};
	moduleTypes: {
		splitter: ModuleType;
		sequentialSwitch: ModuleType;
		clockGenerator: ModuleType;
		quantizer: ModuleType;
		cvToMidi: ModuleType;
		saw: ModuleType;
		triangle: ModuleType;
		randomGenerator: ModuleType;
		scope: ModuleType;
		attenuator: ModuleType;
		offset: ModuleType;
	};
}
