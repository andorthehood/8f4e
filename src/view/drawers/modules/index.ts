import { Engine } from '@8f4e/2d-engine';
import { fillColor, font } from '@8f4e/sprite-generator';

import scope from './scope';
import drawConnectors from './connectors';

import { State } from '../../../state/types';
import { HGRID, VGRID } from '../consts';

export default function drawModules(engine: Engine, state: State): void {
	const { x: offsetX, y: offsetY } = state.viewport;

	engine.startGroup(offsetX, offsetY);

	for (let i = 0; i < state.modules.length; i++) {
		const { x, y, type, id } = state.modules[i];
		const { width, height, code, codeColors } = state.graphicHelper.get(state.modules[i].id) || {
			width: 0,
			height: 0,
			code: [],
			codeColors: [],
		};

		if (
			x + offsetX > -1 * width &&
			y + offsetY > -1 * height &&
			x + offsetX < state.viewport.width &&
			y + offsetY < state.viewport.height &&
			!state.compiler.isCompiling
		) {
			engine.startGroup(x, y);

			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'rgb(0,0,0)', width, height);

			engine.setSpriteLookup(font('white'));
			engine.drawText(0, 0, '+');
			engine.drawText(width - VGRID, 0, '+');
			engine.drawText(0, height - HGRID, '+');
			engine.drawText(width - VGRID, height - HGRID, '+');

			if (type === 'scope') {
				scope(engine, state, id);
			}

			engine.setSpriteLookup(font('white'));

			drawConnectors(engine, state, id);

			engine.setSpriteLookup(font('white'));
			for (let i = 0; i < code.length; i++) {
				engine.drawText(VGRID, HGRID * i, code[i], codeColors[i]);
			}

			if (state.selectedModule === state.modules[i]) {
				const { row, col, offset } = state.graphicHelper.get(state.modules[i].id).cursor;
				engine.drawText(col * VGRID + offset, row * HGRID, '_');
			}

			engine.endGroup();
		}
	}

	engine.endGroup();
}
