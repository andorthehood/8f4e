export default function getConnectorDefaultPosition(
	index: number,
	isInput: boolean,
	vGrid = 1,
	hGrid = 1,
	moduleWidth = 1
): { x: number; y: number; width: number; height: number } {
	return {
		x: isInput ? 1 : moduleWidth - 3 * vGrid,
		y: (index + 1) * hGrid,
		width: 2 * vGrid,
		height: 1 * hGrid,
	};
}
