import getConnectorDefaultPosition from './getConnectorDefaultPosition';
import { Connector } from '../../state/types';

export default function addDefaultInputPositions(
	connectors: Pick<Connector, 'id' | 'label'>[],
	vGrid: number,
	hGrid: number
): Connector[] {
	return connectors.map(function (connector, index: number) {
		return {
			...connector,
			...getConnectorDefaultPosition(index, true, vGrid, hGrid),
			width: 2 * vGrid,
			height: hGrid,
		};
	});
}
