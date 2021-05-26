export default function getConnectorDefaultPosition(
	index: number,
	isInput: boolean,
	moduleWidth: number,
	vGrid: number,
	hGrid: number
): { x: number; y: number; width: number; height: number } {
	return {
		x: isInput ? 1 * vGrid : (moduleWidth - 3) * vGrid + 2,
		y: (index + 1) * hGrid,
		width: vGrid * 2,
		height: hGrid - 4,
	};
}
