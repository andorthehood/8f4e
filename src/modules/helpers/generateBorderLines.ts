import { Line } from '../../state/types';
import { HGRID, VGRID } from '../../view/drawers/consts';

export default function generateBorderLines(width: number, height: number): Line[] {
	return [
		{
			height: 1,
			width: width - VGRID * 2,
			x: VGRID,
			y: HGRID / 2,
		},
		{
			height: height - HGRID,
			width: 1,
			x: width - VGRID,
			y: HGRID / 2,
		},
		{
			height: 1,
			width: width - VGRID * 2,
			x: VGRID,
			y: height - HGRID / 2,
		},
		{
			height: height - HGRID,
			width: 1,
			x: VGRID,
			y: HGRID / 2,
		},
	];
}
