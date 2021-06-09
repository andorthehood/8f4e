export default function getConnectorDefaultPosition(
	index: number,
	isInput: boolean,
	moduleWidth: number = 1
): { x: number; y: number; width: number; height: number } {
	return {
		x: isInput ? 1 : moduleWidth - 3 + 2,
		y: index + 1,
		width: 2,
		height: 4,
	};
}
