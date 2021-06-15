import getConnectorDefaultPosition from './getConnectorDefaultPosition';
import { Connector, ConnectorWithPosition } from '../state/types';

export default function addDefaultOutputPositions(
	connectors: Connector[],
	vGrid: number,
	hGrid: number,
	width: number
): ConnectorWithPosition[] {
	return connectors.map(function (connector, index: number) {
		return {
			...connector,
			...getConnectorDefaultPosition(index, false, vGrid, hGrid, width),
		};
	});
}
