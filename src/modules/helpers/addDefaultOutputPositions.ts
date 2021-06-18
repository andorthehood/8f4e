import getConnectorDefaultPosition from './getConnectorDefaultPosition';
import { Connector } from '../../state/types';

export default function addDefaultOutputPositions(
	connectors: Pick<Connector, 'id' | 'label'>[],
	vGrid: number,
	hGrid: number,
	width: number
): Connector[] {
	return connectors.map(function (connector, index: number) {
		return {
			...connector,
			...getConnectorDefaultPosition(index, false, vGrid, hGrid, width),
			width: 2 * vGrid,
			height: hGrid - 1,
		};
	});
}
