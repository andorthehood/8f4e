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

const init = function (events) {
	const state = { ui: {} };

	midi(state, events);
	loader(state, events);
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
};

export default init;
