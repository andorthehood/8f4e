import { fillColor, feedbackScale, font } from '../spriteGenerator';

const drawModules = function (engine, state) {
	const offsetX = state.ui.viewport.x;
	const offsetY = state.ui.viewport.y;

	engine.startGroup(offsetX, offsetY);

	for (let i = 0; i < state.ui.modules.length; i++) {
		const { x, y, type, id } = state.ui.modules[i];
		const { width, height, name, connectors } = state.ui.moduleTypes[type];

		if (
			x + offsetX > -1 * width &&
			y + offsetY > -1 * height &&
			x + offsetX < state.ui.viewport.width &&
			y + offsetY < state.ui.viewport.height
		) {
			engine.startGroup(x, y);
			engine.setSpriteLookup(fillColor);
			engine.drawRectangle(0, 0, width, height, 'rgb(102,102,102)', 1);
			engine.setSpriteLookup(font('small_white'));
			engine.drawText(5, 5, name);

			const connectorIds = Object.keys(connectors);

			// if (state.ui.isDebugMode) {
			// 	for (let i = 0; i < state.ui.compiler.outputAddressLookup[id].length; i++) {
			// 		engine.drawText(
			// 			width,
			// 			height + i * 10,
			// 			state.ui.compiler.outputAddressLookup[id][i].id +
			// 				' ' +
			// 				state.ui.compiler.outputAddressLookup[id][i].address +
			// 				' ' +
			// 				state.ui.compiler.memoryBuffer[
			// 					state.ui.compiler.outputAddressLookup[id][i].address / Int32Array.BYTES_PER_ELEMENT
			// 				]
			// 		);
			// 	}
			// }

			engine.setSpriteLookup(feedbackScale);

			for (let i = 0; i < connectorIds.length; i++) {
				if (state.ui.compiler.outputAddressLookup[id + connectors[i].id]) {
					const connectorAddress = state.ui.compiler.outputAddressLookup[id + connectors[i].id];
					const value = state.ui.compiler.memoryBuffer[connectorAddress / 4];

					engine.drawRectangle(connectors[connectorIds[i]].x, connectors[connectorIds[i]].y, 10, 10, value, 1);
				}
			}

			engine.endGroup();
		}
	}

	engine.endGroup();
};

export default drawModules;
