import offset from './mutators/offset';
import loader from './mutators/loader';
import contextMenu from './mutators/contextMenu';
import moduleDragger from './mutators/moduleDragger';

const init = function (events) {
	const state = { ui: {} };

	loader(state);
	moduleDragger(state, events);
	offset(state, events);
	contextMenu(state, events);

	console.log(state);

	return state;
};

export default init;
