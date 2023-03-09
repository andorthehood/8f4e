import { Engine } from '@8f4e/2d-engine';
import { fillColor, font } from '@8f4e/sprite-generator';

import drawConnectors from './connectors';
import drawScopes from './scopes';
import drawDebuggers from './debuggers';
import drawSwitches from './switches';

import { State } from '../../../state/types';
import { HGRID, VGRID } from '../consts';

export default function drawModules(engine: Engine, state: State): void {
	const { x: offsetX, y: offsetY } = state.project.viewport;

	engine.startGroup(offsetX, offsetY);

	for (let i = 0; i < state.project.modules.length; i++) {
		const { x, y, isOpen } = state.project.modules[i];
		const { width, height, codeWithLineNumbers, codeColors } = state.graphicHelper.modules.get(
			state.project.modules[i]
		) || {
			width: 0,
			height: 0,
			codeWithLineNumbers: [],
			codeColors: [],
		};

		if (
			x + offsetX > -1 * width &&
			y + offsetY > -1 * height &&
			x + offsetX < state.project.viewport.width &&
			y + offsetY < state.project.viewport.height
		) {
			engine.startGroup(x, y);

			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'rgb(0,0,0)', width, height);

			engine.setSpriteLookup(font('white'));

			const corner = isOpen ? '-' : '+';

			engine.drawText(0, 0, corner);
			engine.drawText(width - VGRID, 0, corner);
			engine.drawText(0, height - HGRID, corner);
			engine.drawText(width - VGRID, height - HGRID, corner);

			engine.setSpriteLookup(font('white'));

			engine.setSpriteLookup(font('white'));
			for (let i = 0; i < codeWithLineNumbers.length; i++) {
				engine.drawText(VGRID, HGRID * i, codeWithLineNumbers[i], codeColors[i]);
			}

			if (state.selectedModule === state.project.modules[i]) {
				const {
					row = 0,
					col = 0,
					offset = 0,
				} = state.graphicHelper.modules.get(state.project.modules[i])?.cursor || {};
				engine.drawText(col * VGRID + offset, row * HGRID, '_');
			}

			drawConnectors(engine, state, state.project.modules[i]);
			drawScopes(engine, state, state.project.modules[i]);
			drawDebuggers(engine, state, state.project.modules[i]);
			drawSwitches(engine, state, state.project.modules[i]);

			engine.endGroup();
		}
	}

	engine.endGroup();
}
