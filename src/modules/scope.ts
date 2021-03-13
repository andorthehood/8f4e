import { ModuleType } from '../state/types';

const scope: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'in', x: 5, y: 45, isInput: true },
		{ id: 'out', x: 85, y: 45 },
	],
	name: 'Scope',
	switches: [],
	sliders: [],
	steppers: [],
	engine: 'scope',
};

export default scope;
