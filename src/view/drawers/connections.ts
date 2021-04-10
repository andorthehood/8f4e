import { fillColor } from '../../../packages/sprite-generator/src';
import * as moduleTypes from '../../modules';

const drawConnections = function (engine, state) {
	const ui = state.ui;
	const connections = state.ui.connections;
	const modules = state.ui.modules;

	engine.setSpriteLookup(fillColor);

	for (let i = 0; i < connections.length; i++) {
		const a = modules.find(({ id }) => id === connections[i][0].moduleId);
		const b = modules.find(({ id }) => id === connections[i][1].moduleId);

		let { x: fromX, y: fromY } = moduleTypes[a.type].connectors.find(({ id }) => id === connections[i][0].connectorId);
		let { x: toX, y: toY } = moduleTypes[b.type].connectors.find(({ id }) => id === connections[i][1].connectorId);

		fromX += a.x;
		fromY += a.y;

		toX += b.x;
		toY += b.y;

		engine.startGroup(5 + state.ui.viewport.x, 5 + state.ui.viewport.y);
		engine.drawLine(fromX, fromY, toX, toY, 'rgb(153,153,153)', 1);
		engine.endGroup();
	}

	if (state.ui.isConnectionBeingMade && state.ui.connectionPointA && state.ui.connectionPointB) {
		engine.drawLine(...ui.connectionPointA, ...ui.connectionPointB, 'rgb(255,255,255)', 1);
	}
};

export default drawConnections;
