import getConnectorDefaultPosition from './getConnectorDefaultPosition';
import { Connector } from '../state/types';

export default function addDefaultInputPositions(connectors): Connector[] {
	return connectors.map(function (connector, index: number) {
		return {
			...connector,
			...getConnectorDefaultPosition(index, true),
		};
	});
}
