import { fillColor } from '../../../packages/sprite-generator/src';
import { State } from '../../state/types';

export default function drawConnections(engine, state: State): void {
	const connections = state.connections;
	const modules = state.modules;

	engine.setSpriteLookup(fillColor);

	for (let i = 0; i < connections.length; i++) {
		const moduleA = modules.find(({ id }) => id === connections[i][0].moduleId);
		const moduleB = modules.find(({ id }) => id === connections[i][1].moduleId);
		// @TODO improtve performance
		const connectorsA = [...state.moduleTypes[moduleA.type].inputs, ...state.moduleTypes[moduleA.type].outputs];
		const connectorsB = [...state.moduleTypes[moduleB.type].inputs, ...state.moduleTypes[moduleB.type].outputs];
		let { x: fromX, y: fromY } = connectorsA.find(({ id }) => id === connections[i][0].connectorId);
		let { x: toX, y: toY } = connectorsB.find(({ id }) => id === connections[i][1].connectorId);

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
