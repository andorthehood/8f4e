import * as moduleTypes from '../../../modules';

export default function moduleCreator(state, events) {
	const onAddModule = ({ x, y, type }) => {
		x = x - state.ui.viewport.x - Math.floor(moduleTypes[type].width / 2);
		y = y - state.ui.viewport.y - Math.floor(moduleTypes[type].height / 2);

		state.ui.modules.push({
			x,
			y,
			row: Math.floor(y / state.ui.viewport.hGrid),
			col: Math.floor(x / state.ui.viewport.vGrid),
			id: type + state.ui.modules.length,
			config: { ...moduleTypes[type].config },
			type,
			engine: moduleTypes[type].engine,
		});
	};

	const onDeleteModule = ({ moduleId }) => {
		events.dispatch('deleteConnection', { moduleId, replaceHistory: true });
		state.ui.modules.splice(
			state.ui.modules.findIndex(({ id }) => id === moduleId),
			1
		);
	};

	events.on('addModule', onAddModule);
	events.on('deleteModule', onDeleteModule);
}
