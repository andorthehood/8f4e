import { GraphicHelper, Module, Viewport } from '../types';

export default function findModuleAtViewportCoordinates(
	modules: Module[],
	graphicHelper: GraphicHelper,
	viewport: Viewport,
	x: number,
	y: number
): Module {
	return modules.find((module: Module) => {
		if (!graphicHelper.has(module.id)) {
			return false;
		}

		const { width, height } = graphicHelper.get(module.id);
		return (
			x >= module.x + viewport.x &&
			x <= module.x + width + viewport.x &&
			y >= module.y + viewport.y &&
			y <= module.y + height + viewport.y
		);
	});
}
