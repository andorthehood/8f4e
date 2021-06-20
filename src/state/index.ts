import compiler from './effects/compiler';
import connectionMaker from './effects/connections';
import contextMenu from './effects/menu/contextMenu';
import error from './effects/error';
import history from './effects/history';
import loader from './effects/loader';
import midi from './effects/midi';
import moduleCreator from './effects/modules/moduleCreator';
import moduleDragger from './effects/modules/moduleDragger';
import moduleMenu from './effects/menu/moduleMenu';
import moduleSliders from './effects/modules/moduleSliders';
import moduleSteppers from './effects/modules/moduleSteppers';
import moduleSwitches from './effects/modules/moduleSwitches';
import save from './effects/save';
import tests from './effects/tests';
import viewport from './effects/viewport';
import { State } from './types';
import generateModuleTypes from '../modules';

const defaultState: State = {
	sructureVersion: 7,
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
	moduleTypes: {},
};

export default function init(events): State {
	const state = { ...defaultState };
	state.moduleTypes = generateModuleTypes({ vGrid: state.viewport.vGrid, hGrid: state.viewport.hGrid });
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
	save(state, events);
	events.dispatch('init');
	return state;
}
