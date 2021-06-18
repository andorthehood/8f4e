import getConnectorDefaultPosition from './getConnectorDefaultPosition';
import { Connector, ConnectorWithPosition } from '../state/types';

export default function addDefaultInputPositions(
	connectors: Connector[],
	vGrid: number,
	hGrid: number
): ConnectorWithPosition[] {
	return connectors.map(function (connector, index: number) {
		return {
			...connector,
			...getConnectorDefaultPosition(index, true, vGrid, hGrid),
			width: 2 * vGrid,
			height: hGrid - 1,
		};
	});
}
