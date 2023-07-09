import { Engine } from '@8f4e/2d-engine';
import { fillColor, font } from '@8f4e/sprite-generator';

import drawConnectors from './connectors';
import drawScopes from './scopes';
import drawDebuggers from './debuggers';
import drawSwitches from './switches';
import drawButtons from './buttons';
import drawErrorMessages from './errorMessages';

import { State } from '../../../state/types';
import { HGRID, VGRID } from '../consts';

export default function drawModules(engine: Engine, state: State): void {
	const { x: offsetX, y: offsetY } = state.project.viewport;

	engine.startGroup(offsetX, offsetY);

	for (const module of state.graphicHelper.modules) {
		if (!module) {
			continue;
		}

		if (
			module.x + offsetX > -1 * module.width &&
			module.y + offsetY > -1 * module.height &&
			module.x + offsetX < state.graphicHelper.viewport.width &&
			module.y + offsetY < state.graphicHelper.viewport.height
		) {
			engine.startGroup(module.x, module.y);

			engine.setSpriteLookup(fillColor);

			if (module === state.graphicHelper.draggedModule) {
				engine.drawSprite(0, 0, 'moduleBackgroundDragged', module.width, module.height);
			} else {
				engine.drawSprite(0, 0, 'moduleBackground', module.width, module.height);
			}

			if (state.graphicHelper.selectedModule === module) {
				engine.drawSprite(0, module.cursor.y, 'highlightedCodeLine', module.width, HGRID);
			}

			engine.setSpriteLookup(font('code'));

			const corner = module.isOpen ? '+' : '+';

			engine.drawText(0, 0, corner);
			engine.drawText(module.width - VGRID, 0, corner);
			engine.drawText(0, module.height - HGRID, corner);
			engine.drawText(module.width - VGRID, module.height - HGRID, corner);

			engine.setSpriteLookup(font('code'));

			for (let i = 0; i < module.codeToRender.length; i++) {
				for (let j = 0; j < module.codeToRender[i].length; j++) {
					const lookup = module.codeColors[i][j];
					if (lookup) {
						engine.setSpriteLookup(lookup);
					}
					if (module.codeToRender[i][j] !== 32) {
						engine.drawSprite(VGRID * (j + 1), HGRID * i, module.codeToRender[i][j]);
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
