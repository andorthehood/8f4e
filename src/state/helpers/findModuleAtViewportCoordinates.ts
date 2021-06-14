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
			x >= module.col * viewport.vGrid + viewport.x &&
			x <= module.col * viewport.vGrid + width + viewport.x &&
			y >= module.row * viewport.hGrid + viewport.y &&
			y <= module.row * viewport.hGrid + height + viewport.y
		);
	});
}
