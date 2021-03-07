export interface Module {
	id: string;
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
	offValue: number;
	onValue: number;
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

export interface ModuleType {
	connectors: Connector[];
	defaultValues?: Object;
	height: number;
	name: string;
	sliders: Slider[];
	steppers: Stepper[];
	switches: Switch[];
	width: number;
}

export interface ModuleTypes {
	abs: ModuleType;
	and: ModuleType;
	attenuator: ModuleType;
	clockGenerator: ModuleType;
	constant: ModuleType;
	cvToMidi: ModuleType;
	invert: ModuleType;
	max: ModuleType;
	min: ModuleType;
	mixer: ModuleType;
	negate: ModuleType;
	offset: ModuleType;
	or: ModuleType;
	quantizer: ModuleType;
	randomGenerator: ModuleType;
	saw: ModuleType;
	scope: ModuleType;
	sequentialSwitch: ModuleType;
	splitter: ModuleType;
	triangle: ModuleType;
	xor: ModuleType;
}

export interface State {
	modules: Module[];
	connections: Connection[];
	isDebugMode: boolean;
	compiler: {};
	viewport: {
		height: number;
		width: number;
		x: number;
		y: number;
	};
	midi: {
		ports: [];
	};
	moduleTypes: ModuleTypes;
	error: {
		display: boolean;
		message: string;
	};
}
