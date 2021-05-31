import { Module, Viewport } from '../types';
import * as moduleTypes from '../../modules';

export default function findModuleAtViewportCoordinates(
	modules: Module[],
	viewport: Viewport,
	x: number,
	y: number
): Module {
	return modules.find((module: Module) => {
		const { width, height } = moduleTypes[module.type];
		return (
			x >= module.col * viewport.vGrid + viewport.x &&
			x <= module.col * viewport.vGrid + width * viewport.vGrid + viewport.x &&
			y >= module.row * viewport.hGrid + viewport.y &&
			y <= module.row * viewport.hGrid + height * viewport.hGrid + viewport.y
		);
	});
}
