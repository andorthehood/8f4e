const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
const blackKeys = [1, 3, 6, 8, 10];
const blackKeyPositions = [13, 33, 73, 93, 113];
const allKeys = [...whiteKeys, ...blackKeys];
const whiteKeyWidth = 18;
const spacing = 2;
const keyboardWidth = whiteKeyWidth * whiteKeys.length + spacing * whiteKeys.length;

function getWhiteKeyIndex(note: number): number {
	return whiteKeys.indexOf(note % allKeys.length);
}

function getBlackKeyIndex(note: number): number {
	return blackKeys.indexOf(note % allKeys.length);
}

export default function generatePianoKeyLayout<T>(
	{ keyCount, vGrid, hGrid }: { keyCount: number; vGrid: number; hGrid: number },
	callback: CallableFunction
): T[] {
	return new Array(keyCount).fill(0).map((item, index) => {
		const whiteKeyIndex = getWhiteKeyIndex(index);
		const blackKeyIndex = getBlackKeyIndex(index);
		const isWhite = blackKeyIndex === -1;
		const octave = Math.floor(index / allKeys.length);

		if (isWhite) {
			return callback({
				index,
				x: whiteKeyIndex * whiteKeyWidth + spacing * whiteKeyIndex + keyboardWidth * octave,
				y: 3 * hGrid,
				width: 18,
				height: 20,
			});
		} else {
			return callback({
				index,
				x: blackKeyPositions[blackKeyIndex] + keyboardWidth * octave,
				y: 0,
				width: 12,
				height: 40,
			});
		}
	});
}
