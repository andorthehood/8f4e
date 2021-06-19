import { Position } from '../../state/types';

export default function getConnectorDefaultPosition(
	index: number,
	isInput: boolean,
	vGrid = 1,
	hGrid = 1,
	moduleWidth = 1
): Position {
	return {
		x: isInput ? 2 * vGrid : moduleWidth - 4 * vGrid,
		y: (index + 3) * hGrid,
	};
}
