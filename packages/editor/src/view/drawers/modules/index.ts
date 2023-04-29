import { Engine } from '@8f4e/2d-engine';
import { fillColor, font } from '@8f4e/sprite-generator';

import drawConnectors from './connectors';
import drawScopes from './scopes';
import drawDebuggers from './debuggers';
import drawSwitches from './switches';
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
			module.x + offsetX < state.project.viewport.width &&
			module.y + offsetY < state.project.viewport.height
		) {
			engine.startGroup(module.x, module.y);

			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'rgb(0,0,0)', module.width, module.height);

			engine.setSpriteLookup(font('white'));

			const corner = module.isOpen ? '-' : '+';

			engine.drawText(0, 0, corner);
			engine.drawText(module.width - VGRID, 0, corner);
			engine.drawText(0, module.height - HGRID, corner);
			engine.drawText(module.width - VGRID, module.height - HGRID, corner);

			engine.setSpriteLookup(font('white'));

			engine.setSpriteLookup(font('white'));
			for (let i = 0; i < module.codeWithLineNumbers.length; i++) {
				engine.drawText(VGRID, HGRID * i, module.codeWithLineNumbers[i], module.codeColors[i]);
			}

			if (state.selectedModule === module) {
				engine.drawText(module.cursor.x, module.cursor.y, '_');
			}

			drawConnectors(engine, state, module);
			drawScopes(engine, state, module);
			drawDebuggers(engine, state, module);
			drawSwitches(engine, state, module);
			drawErrorMessages(engine, state, module);

			engine.endGroup();
		}
	}

	engine.endGroup();
}
