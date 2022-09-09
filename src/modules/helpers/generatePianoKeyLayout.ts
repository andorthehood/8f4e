import { HGRID, VGRID } from '../../view/drawers/consts';

export default function generatePianoKeyLayout<T>({ keyCount }: { keyCount: number }, callback: CallableFunction): T[] {
	return new Array(keyCount).fill(0).map((item, index) => {
		return callback({
			index,
			x: index * (2 * VGRID),
			y: 0,
			width: 2 * VGRID,
			height: 5 * HGRID,
		});
	});
}
