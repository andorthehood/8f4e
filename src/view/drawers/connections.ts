import { fillColor } from '../../../packages/sprite-generator/src';
import * as moduleTypes from '../../modules';
import { State } from '../../state/types';
import getConnectorDefaultPosition from '../helpers/getConnectorDefaultPosition';

export default function drawConnections(engine, state: State) {
	const connections = state.connections;
	const modules = state.modules;

	engine.setSpriteLookup(fillColor);

	for (let i = 0; i < connections.length; i++) {
		const moduleA = modules.find(({ id }) => id === connections[i][0].moduleId);
		const moduleB = modules.find(({ id }) => id === connections[i][1].moduleId);
		// @TODO improtve performance
		const connectorsA = [...moduleTypes[moduleA.type].inputs, ...moduleTypes[moduleA.type].outputs];
		const connectorsB = [...moduleTypes[moduleB.type].inputs, ...moduleTypes[moduleB.type].outputs];
		let fromIndex = connectorsA.findIndex(({ id }) => id === connections[i][0].connectorId);
		let toIndex = connectorsB.findIndex(({ id }) => id === connections[i][1].connectorId);

		let { x: fromX, y: fromY } = getConnectorDefaultPosition(
			fromIndex,
			false,
			moduleTypes[moduleA.type].width,
			state.viewport.vGrid,
			state.viewport.hGrid
		);

		let { x: toX, y: toY } = getConnectorDefaultPosition(
			toIndex,
			true,
			moduleTypes[moduleB.type].width,
			state.viewport.vGrid,
			state.viewport.hGrid
		);

		fromX += moduleA.col * state.viewport.vGrid;
		fromY += moduleA.row * state.viewport.hGrid;

		toX += moduleB.col * state.viewport.vGrid;
		toY += moduleB.row * state.viewport.hGrid;

		engine.startGroup(5 + state.viewport.x, 5 + state.viewport.y);
		engine.drawLine(fromX, fromY, toX, toY, 'rgb(153,153,153)', 1);
		engine.endGroup();
	}

	if (state.isConnectionBeingMade && state.connectionPointA && state.connectionPointB) {
		engine.drawLine(...state.connectionPointA, ...state.connectionPointB, 'rgb(255,255,255)', 1);
	}
}
