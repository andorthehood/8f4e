import { V_GRID, H_GRID } from '../modules/consts';

export default function getConnectorDefaultPosition(
	index: number,
	isInput: boolean,
	moduleWidth: number = 1
): { x: number; y: number; width: number; height: number } {
	return {
		x: isInput ? 1 : moduleWidth - 3 * V_GRID,
		y: (index + 1) * H_GRID,
		width: 2 * V_GRID,
		height: 1 * H_GRID,
	};
}
