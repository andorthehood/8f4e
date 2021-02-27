import { Module, State } from '../types';

const findModuleAtViewportCoordinates = function (state: State, x: number, y: number): Module {
	return state.modules.find((module: Module) => {
		const { width, height } = state.moduleTypes[module.type];
		return (
			x >= module.x + state.viewport.x &&
			x <= module.x + width + state.viewport.x &&
			y >= module.y + state.viewport.y &&
			y <= module.y + height + state.viewport.y
		);
	});
};

export default findModuleAtViewportCoordinates;
