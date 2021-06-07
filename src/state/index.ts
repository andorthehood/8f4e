import compiler from './mutators/compiler';
import connectionMaker from './mutators/connections';
import contextMenu from './mutators/menu/contextMenu';
import error from './mutators/error';
import history from './mutators/history';
import innit from './mutators/init';
import loader from './mutators/loader';
import midi from './mutators/midi';
import moduleCreator from './mutators/modules/moduleCreator';
import moduleDragger from './mutators/modules/moduleDragger';
import moduleMenu from './mutators/menu/moduleMenu';
import moduleSliders from './mutators/modules/moduleSliders';
import moduleSteppers from './mutators/modules/moduleSteppers';
import moduleSwitches from './mutators/modules/moduleSwitches';
import save from './mutators/save';
import tests from './mutators/tests';
import viewport from './mutators/viewport';
import { State } from './types';

const defaultState: State = {
	sructureVersion: 6,
	compiler: {
		compilationTime: '0',
		cycleTime: 0,
		isCompiling: false,
		lastCompilationStart: 0,
		memoryBuffer: new Int32Array(),
		outputAddressLookup: {},
		timerAccuracy: 0,
	},
	connections: [],
	isDebugMode: process.env.NODE_ENV === 'development',
	modules: [],
	history: [],
	viewport: {
		hGrid: 14,
		height: 0,
		vGrid: 6,
		width: 0,
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
	isConnectionBeingMade: false,
	connectionPointA: null,
	connectionPointB: null,
	contextMenu: null,
	connectionFromModule: null,
	connectionFromConnector: null,
};

export default function init(events): State {
	const state = { ...defaultState };

	midi(state, events);
	loader(state, events, defaultState);
	history(state, events);
	connectionMaker(state, events);
	moduleSliders(state, events);
	moduleDragger(state, events);
	viewport(state, events);
	contextMenu(state, events);
	moduleMenu(state, events);
	moduleCreator(state, events);
	moduleSwitches(state, events);
	moduleSteppers(state, events);
	error(state, events);
	tests(state, events);
	compiler(state, events);
	innit(state, events);
	save(state, events);

	return state;
}
