import { ModuleType } from '../state/types';

const scope: ModuleType = {
	category: 'Inspection',
	engine: 'scope',
	height: 10,
	inputs: [{ id: 'in', x: 5, y: 45 }],
	name: 'Scope',
	outputs: [{ id: 'out', x: 85, y: 45 }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default scope;
