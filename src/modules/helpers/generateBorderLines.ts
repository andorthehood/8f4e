import { Line } from '../../state/types';

export default function generateBorderLines(vGrid: number, hGrid: number, width: number, height: number): Line[] {
	return [
		{
			height: 1,
			width: width - vGrid * 2,
			x: vGrid,
			y: hGrid / 2,
		},
		{
			height: height - hGrid,
			width: 1,
			x: width - vGrid,
			y: hGrid / 2,
		},
		{
			height: 1,
			width: width - vGrid * 2,
			x: vGrid,
			y: height - hGrid / 2,
		},
		{
			height: height - hGrid,
			width: 1,
			x: vGrid,
			y: hGrid / 2,
		},
	];
}
