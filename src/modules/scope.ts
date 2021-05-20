import { ModuleType } from '../state/types';

const scope: ModuleType = {
	category: 'Inspection',
	connectors: [
		{ id: 'in', x: 5, y: 45, isInput: true },
		{ id: 'out', x: 85, y: 45 },
	],
	engine: 'scope',
	height: 10,
	name: 'Scope',
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default scope;
