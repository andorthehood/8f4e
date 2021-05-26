import { fillColor } from '../../../packages/sprite-generator/src';
import * as moduleTypes from '../../modules';
import { State } from '../../state/types';

export default function drawConnections(engine, state: State) {
	const connections = state.connections;
	const modules = state.modules;

	engine.setSpriteLookup(fillColor);

	for (let i = 0; i < connections.length; i++) {
		const a = modules.find(({ id }) => id === connections[i][0].moduleId);
		const b = modules.find(({ id }) => id === connections[i][1].moduleId);
		// @TODO improtve performance
		const connectorsA = [...moduleTypes[a.type].inputs, ...moduleTypes[a.type].outputs];
		const connectorsB = [...moduleTypes[b.type].inputs, ...moduleTypes[b.type].outputs];
		let { x: fromX, y: fromY } = connectorsA.find(({ id }) => id === connections[i][0].connectorId);
		let { x: toX, y: toY } = connectorsB.find(({ id }) => id === connections[i][1].connectorId);

		fromX += a.x;
		fromY += a.y;

		toX += b.x;
		toY += b.y;

		engine.startGroup(5 + state.viewport.x, 5 + state.viewport.y);
		engine.drawLine(fromX, fromY, toX, toY, 'rgb(153,153,153)', 1);
		engine.endGroup();
	}

	if (state.isConnectionBeingMade && state.connectionPointA && state.connectionPointB) {
		engine.drawLine(...state.connectionPointA, ...state.connectionPointB, 'rgb(255,255,255)', 1);
	}
}
