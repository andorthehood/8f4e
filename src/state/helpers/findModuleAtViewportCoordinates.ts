import { Module, State } from '../types';
import * as moduleTypes from '../../modules';

const findModuleAtViewportCoordinates = function (state: State, x: number, y: number): Module {
	return state.modules.find((module: Module) => {
		const { width, height } = moduleTypes[module.type];
		return (
			x >= module.col * state.viewport.vGrid + state.viewport.x &&
			x <= module.col * state.viewport.vGrid + width * state.viewport.vGrid + state.viewport.x &&
			y >= module.row * state.viewport.hGrid + state.viewport.y &&
			y <= module.row * state.viewport.hGrid + height * state.viewport.hGrid + state.viewport.y
		);
	});
};

export default findModuleAtViewportCoordinates;
