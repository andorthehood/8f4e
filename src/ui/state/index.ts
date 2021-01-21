import viewport from './mutators/viewport';
import loader from './mutators/loader';
import contextMenu from './mutators/contextMenu';
import moduleDragger from './mutators/modules/moduleDragger';
import moduleCreator from './mutators/modules/moduleCreator';
import connectionMaker from './mutators/connectionMaker';

const init = function (events) {
	const state = { ui: {} };

	loader(state, events);
	connectionMaker(state, events);
	moduleDragger(state, events);
	viewport(state, events);
	contextMenu(state, events);
	moduleCreator(state, events);

	console.log(state);

	return state;
};

export default init;
