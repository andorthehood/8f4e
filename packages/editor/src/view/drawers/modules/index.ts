import { Engine } from '@8f4e/2d-engine';

import drawConnectors from './connectors';
import drawScopes from './scopes';
import drawDebuggers from './debuggers';
import drawSwitches from './switches';
import drawButtons from './buttons';
import drawErrorMessages from './errorMessages';

import { State } from '../../../state/types';

export default function drawModules(engine: Engine, state: State): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	const { x, y } = state.graphicHelper.viewport;

	const offsetX = -x;
	const offsetY = -y;

	engine.startGroup(offsetX, offsetY);

	for (const module of state.graphicHelper.modules) {
		if (!module) {
			continue;
		}

		if (module.positionOffsetterXWordAddress) {
			module.offsetX = state.compiler.memoryBuffer[module.positionOffsetterXWordAddress];
		}

		if (module.positionOffsetterYWordAddress) {
			module.offsetY = state.compiler.memoryBuffer[module.positionOffsetterYWordAddress];
		}

		if (
			module.x + module.offsetX + offsetX > -1 * module.width &&
			module.y + module.offsetY + offsetY > -1 * module.height &&
			module.x + module.offsetX + offsetX < state.graphicHelper.viewport.width &&
			module.y + module.offsetY + offsetY < state.graphicHelper.viewport.height
		) {
			engine.startGroup(module.x + module.offsetX, module.y + module.offsetY);

			engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);

			if (module === state.graphicHelper.draggedModule) {
				engine.drawSprite(0, 0, 'moduleBackgroundDragged', module.width, module.height);
			} else {
				engine.drawSprite(0, 0, 'moduleBackground', module.width, module.height);
			}

			if (state.graphicHelper.selectedModule === module) {
				engine.drawSprite(0, module.cursor.y, 'highlightedCodeLine', module.width, state.graphicHelper.viewport.hGrid);
			}

			engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);

			const corner = module.isOpen ? '+' : '+';

			engine.drawText(0, 0, corner);
			engine.drawText(module.width - state.graphicHelper.viewport.vGrid, 0, corner);
			engine.drawText(0, module.height - state.graphicHelper.viewport.hGrid, corner);
			engine.drawText(
				module.width - state.graphicHelper.viewport.vGrid,
				module.height - state.graphicHelper.viewport.hGrid,
				corner
			);

			engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);

			for (let i = 0; i < module.codeToRender.length; i++) {
				for (let j = 0; j < module.codeToRender[i].length; j++) {
					const lookup = module.codeColors[i][j];
					if (lookup) {
						engine.setSpriteLookup(lookup);
					}
					if (module.codeToRender[i][j] !== 32) {
						engine.drawSprite(
							state.graphicHelper.viewport.vGrid * (j + 1),
							state.graphicHelper.viewport.hGrid * i,
							module.codeToRender[i][j]
						);
					}
				}
			}

			if (state.graphicHelper.selectedModule === module) {
				engine.drawText(module.cursor.x, module.cursor.y, '_');
			}

			drawConnectors(engine, state, module);
			drawScopes(engine, state, module);
			drawDebuggers(engine, state, module);
			drawSwitches(engine, state, module);
			drawButtons(engine, state, module);
			drawErrorMessages(engine, state, module);

			engine.endGroup();
		}
	}

	engine.endGroup();
}
