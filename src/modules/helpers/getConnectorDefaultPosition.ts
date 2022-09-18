import { Position } from '../../state/types';
import { HGRID, VGRID } from '../../view/drawers/consts';

export default function getConnectorDefaultPosition(index: number, isInput: boolean, moduleWidth = 1): Position {
	return {
		x: isInput ? 0 : moduleWidth - 2 * VGRID,
		y: (index + 2) * HGRID,
	};
}
