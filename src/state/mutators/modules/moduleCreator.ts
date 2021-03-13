import * as moduleTypes from '../../../modules';

const moduleCreator = function (state, events) {
	const onAddModule = ({ x, y, type }) => {
		state.ui.modules.push({
			x: x - state.ui.viewport.x - Math.floor(moduleTypes[type].width / 2),
			y: y - state.ui.viewport.y - Math.floor(moduleTypes[type].height / 2),
			id: type + Date.now(),
			config: { ...moduleTypes[type].defaultValues },
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
};

export default moduleCreator;
