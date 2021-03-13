import { Module, State } from '../types';
import * as moduleTypes from '../../modules';

const findModuleControllerAtViewportCoordinates = function (
	state: State,
	module: Module,
	controllerType: string,
	x: number,
	y: number
) {
	const controllers = moduleTypes[module.type][controllerType];
	return controllers.find(controller => {
		const { width, height } = controller;
		return (
			x >= controller.x + module.x + state.viewport.x &&
			x <= controller.x + module.x + width + state.viewport.x &&
			y >= controller.y + module.y + state.viewport.y &&
			y <= controller.y + module.y + height + state.viewport.y
		);
	});
};

export default findModuleControllerAtViewportCoordinates;
