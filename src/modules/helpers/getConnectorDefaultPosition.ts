import { Position } from '../../state/types';
import { HGRID, VGRID } from '../../view/drawers/consts';

export default function getConnectorDefaultPosition(index: number, isInput: boolean, moduleWidth = 1): Position {
	return {
		x: isInput ? 2 * VGRID : moduleWidth - 4 * VGRID,
		y: (index + 3) * HGRID,
	};
}
