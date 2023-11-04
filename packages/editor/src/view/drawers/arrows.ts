import { Engine } from '@8f4e/2d-engine';
import { Icon } from '@8f4e/sprite-generator';

import { State } from '../../state/types';

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

	for (const codeBlock of state.graphicHelper.codeBlocks) {
		if (
			!(
				codeBlock.x + codeBlock.offsetX + offsetX > -1 * codeBlock.width &&
				codeBlock.y + codeBlock.offsetY + offsetY > -1 * codeBlock.height &&
				codeBlock.x + codeBlock.offsetX + offsetX < state.graphicHelper.viewport.width &&
				codeBlock.y + codeBlock.offsetY + offsetY < state.graphicHelper.viewport.height
			)
		) {
			engine.setSpriteLookup(state.graphicHelper.spriteLookups.icons);

			const topIntersection = calculateIntersection(
				state.graphicHelper.viewport.borderLineCoordinates.top.startX,
				state.graphicHelper.viewport.borderLineCoordinates.top.startY,
				state.graphicHelper.viewport.borderLineCoordinates.top.endX,
				state.graphicHelper.viewport.borderLineCoordinates.top.endY,
				state.graphicHelper.viewport.center.x,
				state.graphicHelper.viewport.center.y,
				module.x + codeBlock.offsetX,
				module.y + codeBlock.offsetY
			);

			if (topIntersection) {
				engine.drawSprite(topIntersection.x, topIntersection.y, Icon.ARROW_TOP);
			}

			const rightIntersection = calculateIntersection(
				state.graphicHelper.viewport.borderLineCoordinates.right.startX,
				state.graphicHelper.viewport.borderLineCoordinates.right.startY,
				state.graphicHelper.viewport.borderLineCoordinates.right.endX,
				state.graphicHelper.viewport.borderLineCoordinates.right.endY,
				state.graphicHelper.viewport.center.x,
				state.graphicHelper.viewport.center.y,
				module.x + codeBlock.offsetX,
				module.y + codeBlock.offsetY
			);

			if (rightIntersection) {
				engine.drawSprite(
					rightIntersection.x - state.graphicHelper.viewport.vGrid,
					rightIntersection.y,
					Icon.ARROW_RIGHT
				);
			}

			const bottomIntersection = calculateIntersection(
				state.graphicHelper.viewport.borderLineCoordinates.bottom.startX,
				state.graphicHelper.viewport.borderLineCoordinates.bottom.startY,
				state.graphicHelper.viewport.borderLineCoordinates.bottom.endX,
				state.graphicHelper.viewport.borderLineCoordinates.bottom.endY,
				state.graphicHelper.viewport.center.x,
				state.graphicHelper.viewport.center.y,
				codeBlock.x + codeBlock.offsetX,
				codeBlock.y + codeBlock.offsetY
			);

			if (bottomIntersection) {
				engine.drawSprite(
					bottomIntersection.x,
					bottomIntersection.y - state.graphicHelper.viewport.hGrid,
					Icon.ARROW_BOTTOM
				);
			}

			const leftIntersection = calculateIntersection(
				state.graphicHelper.viewport.borderLineCoordinates.left.startX,
				state.graphicHelper.viewport.borderLineCoordinates.left.startY,
				state.graphicHelper.viewport.borderLineCoordinates.left.endX,
				state.graphicHelper.viewport.borderLineCoordinates.left.endY,
				state.graphicHelper.viewport.center.x,
				state.graphicHelper.viewport.center.y,
				codeBlock.x + codeBlock.offsetX,
				codeBlock.y + codeBlock.offsetY
			);

			if (leftIntersection) {
				engine.drawSprite(leftIntersection.x, leftIntersection.y, Icon.ARROW_LEFT);
			}
		}
	}

	engine.endGroup();
}
