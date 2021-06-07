import * as moduleTypes from '../../../modules';
import { State } from '../../types';

export default function moduleCreator(state: State, events) {
	function onAddModule({ x, y, type }) {
		x = x - state.viewport.x - Math.floor(moduleTypes[type].width / 2);
		y = y - state.viewport.y - Math.floor(moduleTypes[type].height / 2);

		state.modules.push({
			x,
			y,
			row: Math.floor(y / state.viewport.hGrid),
			col: Math.floor(x / state.viewport.vGrid),
			id: type + state.modules.length,
			config: { ...moduleTypes[type].config },
			type,
			engine: moduleTypes[type].engine,
		});
	}

	function onDeleteModule({ moduleId }) {
		events.dispatch('deleteConnection', { moduleId, replaceHistory: true });
		state.modules.splice(
			state.modules.findIndex(({ id }) => id === moduleId),
			1
		);
	}

	events.on('addModule', onAddModule);
	events.on('deleteModule', onDeleteModule);
}
