import { HGRID, VGRID } from '../drawers/consts';

export default function getConnectorDefaultPosition(
	index: number,
	isInput: boolean,
	moduleWidth: number
): { x: number; y: number; width: number; height: number } {
	return {
		x: isInput ? 1 * VGRID : (moduleWidth - 3) * VGRID + 2,
		y: (index + 1) * HGRID,
		width: VGRID * 2,
		height: HGRID - 4,
	};
}
