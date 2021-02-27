import viewport from './mutators/viewport';
import loader from './mutators/loader';
import contextMenu from './mutators/menu/contextMenu';
import moduleDragger from './mutators/modules/moduleDragger';
import moduleCreator from './mutators/modules/moduleCreator';
import moduleSwitches from './mutators/modules/moduleSwitches';
import moduleSliders from './mutators/modules/moduleSliders';
import connectionMaker from './mutators/connections';
import error from './mutators/error';
import history from './mutators/history';
import tests from './mutators/tests';
import compiler from './mutators/compiler';
import midi from './mutators/midi';
import innit from './mutators/init';
import moduleMenu from './mutators/menu/moduleMenu';
import save from './mutators/save';

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
	error(state, events);
	tests(state, events);
	compiler(state, events);
	innit(state, events);
	save(state, events);

	return state;
};

export default init;
