import { State } from '../types';
import { moduleTypes } from '../consts';

const STRUCTURE_VERSION = 3;

const defaultState: State = {
	modules: [],
	connections: [],
	moduleTypes,
	isDebugMode: false, //process.env.NODE_ENV === 'development',
	compiler: {
		compilationTime: 0,
		isCompiling: false,
		outputAddressLookup: {},
		memoryBuffer: [],
	},
	viewport: {
		width: 0,
		height: 0,
		x: 0,
		y: 0,
	},
	midi: {
		ports: [],
	},
	error: {
		display: false,
		message: '',
	},
};

const loader = function (state, events) {
	state.ui = { ...defaultState, ...(JSON.parse(localStorage.getItem('state')) || {}) };
	if (state.ui.sructureVersion !== STRUCTURE_VERSION) {
		state.ui = { sructureVersion: STRUCTURE_VERSION, ...defaultState };
	}
	state.history = [];

	// @ts-ignore
	window.state = state;

	const onSaveState = () => {
		localStorage.setItem(
			'state',
			JSON.stringify({
				viewport: state.ui.viewport,
				connections: state.ui.connections,
				modules: state.ui.modules,
				sructureVersion: state.ui.sructureVersion,
			})
		);
	};

	const onOpenFile = () => {};

	events.on('saveState', onSaveState);
	events.on('open', onOpenFile);
};

export default loader;
