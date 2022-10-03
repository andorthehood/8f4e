import { Button, Module, ModuleTypeLookup, Slider, Stepper, Viewport } from '../types';

export default function findModuleControllerAtViewportCoordinates(
	viewport: Viewport,
	module: Module,
	moduleTypes: ModuleTypeLookup,
	controllerType: 'sliders',
	x: number,
	y: number
): Slider;
export default function findModuleControllerAtViewportCoordinates(
	viewport: Viewport,
	module: Module,
	moduleTypes: ModuleTypeLookup,
	controllerType: 'buttons',
	x: number,
	y: number
): Button;
export default function findModuleControllerAtViewportCoordinates(
	viewport: Viewport,
	module: Module,
	moduleTypes: ModuleTypeLookup,
	controllerType: 'steppers',
	x: number,
	y: number
): Stepper;
export default function findModuleControllerAtViewportCoordinates(
	viewport: Viewport,
	module: Module,
	moduleTypes: ModuleTypeLookup,
	controllerType: 'sliders' | 'buttons' | 'steppers',
	x: number,
	y: number
): Slider | Button | Stepper {
	const controllers = moduleTypes[module.type][controllerType];

	if (!controllers) {
		return;
	}

	return controllers.find(controller => {
		const { width, height } = controller;
		return (
			x >= controller.x + module.x + viewport.x &&
			x <= controller.x + module.x + width + viewport.x &&
			y >= controller.y + module.y + viewport.y &&
			y <= controller.y + module.y + height + viewport.y
		);
	});
}
