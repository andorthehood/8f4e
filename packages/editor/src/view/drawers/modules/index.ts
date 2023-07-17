import { Engine } from '@8f4e/2d-engine';
import { Glyph } from '@8f4e/sprite-generator';

import drawConnectors from './connectors';
import drawScopes from './scopes';
import drawDebuggers from './debuggers';
import drawSwitches from './switches';
import drawButtons from './buttons';
import drawErrorMessages from './errorMessages';

import { State } from '../../../state/types';

function calculateIntersection(
	line1StartX: number,
	line1StartY: number,
	line1EndX: number,
	line1EndY: number,
	line2StartX: number,
	line2StartY: number,
	line2EndX: number,
	line2EndY: number
) {
	const denominator =
		(line2EndY - line2StartY) * (line1EndX - line1StartX) - (line2EndX - line2StartX) * (line1EndY - line1StartY);

	if (denominator === 0) {
		// Lines are parallel
		return null;
	}

	const a = line1StartY - line2StartY;
	const b = line1StartX - line2StartX;
	const numerator1 = (line2EndX - line2StartX) * a - (line2EndY - line2StartY) * b;
	const numerator2 = (line1EndX - line1StartX) * a - (line1EndY - line1StartY) * b;

	const r = numerator1 / denominator;
	const s = numerator2 / denominator;

	if (r < 0 || r > 1 || s < 0 || s > 1) {
		// Lines do not intersect
		return null;
	}

	const intersectionX = line1StartX + r * (line1EndX - line1StartX);
	const intersectionY = line1StartY + r * (line1EndY - line1StartY);

	return { x: intersectionX, y: intersectionY };
}

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
		} else {
			engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);

			const topIntersection = calculateIntersection(
				state.graphicHelper.viewport.borderLineCoordinates.top.startX,
				state.graphicHelper.viewport.borderLineCoordinates.top.startY,
				state.graphicHelper.viewport.borderLineCoordinates.top.endX,
				state.graphicHelper.viewport.borderLineCoordinates.top.endY,
				state.graphicHelper.viewport.center.x,
				state.graphicHelper.viewport.center.y,
				module.x,
				module.y
			);

			if (topIntersection) {
				engine.drawSprite(topIntersection.x, topIntersection.y, Glyph.ARROW_TOP);
			}

			const rightIntersection = calculateIntersection(
				state.graphicHelper.viewport.borderLineCoordinates.right.startX,
				state.graphicHelper.viewport.borderLineCoordinates.right.startY,
				state.graphicHelper.viewport.borderLineCoordinates.right.endX,
				state.graphicHelper.viewport.borderLineCoordinates.right.endY,
				state.graphicHelper.viewport.center.x,
				state.graphicHelper.viewport.center.y,
				module.x,
				module.y
			);

			if (rightIntersection) {
				engine.drawSprite(
					rightIntersection.x - state.graphicHelper.viewport.vGrid,
					rightIntersection.y,
					Glyph.ARROW_RIGHT
				);
			}

			const bottomIntersection = calculateIntersection(
				state.graphicHelper.viewport.borderLineCoordinates.bottom.startX,
				state.graphicHelper.viewport.borderLineCoordinates.bottom.startY,
				state.graphicHelper.viewport.borderLineCoordinates.bottom.endX,
				state.graphicHelper.viewport.borderLineCoordinates.bottom.endY,
				state.graphicHelper.viewport.center.x,
				state.graphicHelper.viewport.center.y,
				module.x,
				module.y
			);

			if (bottomIntersection) {
				engine.drawSprite(
					bottomIntersection.x,
					bottomIntersection.y - state.graphicHelper.viewport.hGrid,
					Glyph.ARROW_BOTTOM
				);
			}

			const leftIntersection = calculateIntersection(
				state.graphicHelper.viewport.borderLineCoordinates.left.startX,
				state.graphicHelper.viewport.borderLineCoordinates.left.startY,
				state.graphicHelper.viewport.borderLineCoordinates.left.endX,
				state.graphicHelper.viewport.borderLineCoordinates.left.endY,
				state.graphicHelper.viewport.center.x,
				state.graphicHelper.viewport.center.y,
				module.x,
				module.y
			);

			if (leftIntersection) {
				engine.drawSprite(leftIntersection.x, leftIntersection.y, Glyph.ARROW_LEFT);
			}
		}
	}

	engine.endGroup();
}
