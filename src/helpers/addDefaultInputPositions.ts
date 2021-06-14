import getConnectorDefaultPosition from './getConnectorDefaultPosition';
import { Connector } from '../state/types';

export default function addDefaultInputPositions(connectors, vGrid: number, hGrid: number): Connector[] {
	return connectors.map(function (connector, index: number) {
		return {
			...connector,
			...getConnectorDefaultPosition(index, true, vGrid, hGrid),
		};
	});
}
