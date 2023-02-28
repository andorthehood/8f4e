import { Engine } from '@8f4e/2d-engine';
import { fillColor, font } from '@8f4e/sprite-generator';

import drawConnectors from './connectors';
import drawScopes from './scope';

import { State } from '../../../state/types';
import { HGRID, VGRID } from '../consts';

export default function drawModules(engine: Engine, state: State): void {
	const { x: offsetX, y: offsetY } = state.viewport;

	engine.startGroup(offsetX, offsetY);

	for (let i = 0; i < state.modules.length; i++) {
		const { x, y, isOpen } = state.modules[i];
		const { width, height, code, codeColors } = state.graphicHelper.modules.get(state.modules[i]) || {
			width: 0,
			height: 0,
			code: [],
			codeColors: [],
		};

		if (
			x + offsetX > -1 * width &&
			y + offsetY > -1 * height &&
			x + offsetX < state.viewport.width &&
			y + offsetY < state.viewport.height
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

			drawConnectors(engine, state, state.modules[i]);
			drawScopes(engine, state, state.modules[i]);

			engine.setSpriteLookup(font('white'));
			for (let i = 0; i < code.length; i++) {
				engine.drawText(VGRID, HGRID * i, code[i], codeColors[i]);
			}

			if (state.selectedModule === state.modules[i]) {
				const { row = 0, col = 0, offset = 0 } = state.graphicHelper.modules.get(state.modules[i])?.cursor || {};
				engine.drawText(col * VGRID + offset, row * HGRID, '_');
			}

			engine.endGroup();
		}
	}

	engine.endGroup();
}
