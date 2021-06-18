import { Engine } from '2d-engine';
import { fillColor } from '../../../packages/sprite-generator/src';
import { State } from '../../state/types';

export default function drawConnections(engine: Engine, state: State): void {
	const connections = state.connections;
	const modules = state.modules;

	engine.setSpriteLookup(fillColor);

	for (let i = 0; i < connections.length; i++) {
		const fromModule = modules.find(({ id }) => id === connections[i].fromModuleId);
		const toModule = modules.find(({ id }) => id === connections[i].toModuleId);

		const { x: fromX, y: fromY, width, height } = state.moduleTypes[fromModule.type].outputs.find(
			({ id }) => id === connections[i].fromConnectorId
		);
		const { x: toX, y: toY } = state.moduleTypes[toModule.type].inputs.find(
			({ id }) => id === connections[i].toConnectorId
		);

		engine.startGroup(state.viewport.x, state.viewport.y);
		engine.drawLine(
			fromX + fromModule.x + width / 2,
			fromY + fromModule.y + height / 2,
			toX + toModule.x + width / 2,
			toY + toModule.y + height / 2,
			'rgb(153,153,153)',
			1
		);
		engine.endGroup();
	}

	if (state.isConnectionBeingMade && state.connectionPointA && state.connectionPointB) {
		engine.drawLine(...state.connectionPointA, ...state.connectionPointB, 'rgb(255,255,255)', 1);
	}
}
