import { Module, ModuleTypeLookup, Viewport } from '../types';

export default function findModuleAtViewportCoordinates(
	modules: Module[],
	moduleTypes: ModuleTypeLookup,
	viewport: Viewport,
	x: number,
	y: number
): Module {
	return modules.find((module: Module) => {
		const { width, height } = moduleTypes[module.type];
		return (
			x >= module.x + viewport.x &&
			x <= module.x + width + viewport.x &&
			y >= module.y + viewport.y &&
			y <= module.y + height + viewport.y
		);
	});
}
