export default function generatePianoKeyLayout<T>(
	{ keyCount, hGrid, vGrid }: { keyCount: number; vGrid: number; hGrid: number },
	callback: CallableFunction
): T[] {
	return new Array(keyCount).fill(0).map((item, index) => {
		return callback({
			index,
			x: index * (2 * vGrid),
			y: 0,
			width: 2 * vGrid,
			height: 5 * hGrid,
		});
	});
}
