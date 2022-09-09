import getConnectorDefaultPosition from './getConnectorDefaultPosition';
import { Connector } from '../../state/types';
import { HGRID, VGRID } from '../../view/drawers/consts';

export default function addDefaultInputPositions(connectors: Pick<Connector, 'id' | 'label'>[]): Connector[] {
	return connectors.map(function (connector, index: number) {
		return {
			...connector,
			...getConnectorDefaultPosition(index, true),
			width: 2 * VGRID,
			height: HGRID,
		};
	});
}
