import { Engine } from 'glugglug';
import { Icon } from '@8f4e/sprite-generator';

import type { State } from '../../state/types';

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

	const { x, y } = state.graphicHelper.activeViewport.viewport;

	const offsetX = -x;
	const offsetY = -y;

	engine.startGroup(offsetX, offsetY);

	for (const codeBlock of state.graphicHelper.activeViewport.codeBlocks) {
		if (
			!(
				codeBlock.x + codeBlock.offsetX + offsetX > -1 * codeBlock.width &&
				codeBlock.y + codeBlock.offsetY + offsetY > -1 * codeBlock.height &&
				codeBlock.x + codeBlock.offsetX + offsetX < state.graphicHelper.globalViewport.width &&
				codeBlock.y + codeBlock.offsetY + offsetY < state.graphicHelper.globalViewport.height
			)
		) {
			engine.setSpriteLookup(state.graphicHelper.spriteLookups.icons);

			const topIntersection = calculateIntersection(
				state.graphicHelper.globalViewport.borderLineCoordinates.top.startX,
				state.graphicHelper.globalViewport.borderLineCoordinates.top.startY,
				state.graphicHelper.globalViewport.borderLineCoordinates.top.endX,
				state.graphicHelper.globalViewport.borderLineCoordinates.top.endY,
				state.graphicHelper.globalViewport.center.x,
				state.graphicHelper.globalViewport.center.y,
				codeBlock.x + codeBlock.offsetX,
				codeBlock.y + codeBlock.offsetY
			);

			if (topIntersection) {
				engine.drawSprite(topIntersection.x, topIntersection.y, Icon.ARROW_TOP);
			}

			const rightIntersection = calculateIntersection(
				state.graphicHelper.globalViewport.borderLineCoordinates.right.startX,
				state.graphicHelper.globalViewport.borderLineCoordinates.right.startY,
				state.graphicHelper.globalViewport.borderLineCoordinates.right.endX,
				state.graphicHelper.globalViewport.borderLineCoordinates.right.endY,
				state.graphicHelper.globalViewport.center.x,
				state.graphicHelper.globalViewport.center.y,
				codeBlock.x + codeBlock.offsetX,
				codeBlock.y + codeBlock.offsetY
			);

			if (rightIntersection) {
				engine.drawSprite(
					rightIntersection.x - state.graphicHelper.globalViewport.vGrid,
					rightIntersection.y,
					Icon.ARROW_RIGHT
				);
			}

			const bottomIntersection = calculateIntersection(
				state.graphicHelper.globalViewport.borderLineCoordinates.bottom.startX,
				state.graphicHelper.globalViewport.borderLineCoordinates.bottom.startY,
				state.graphicHelper.globalViewport.borderLineCoordinates.bottom.endX,
				state.graphicHelper.globalViewport.borderLineCoordinates.bottom.endY,
				state.graphicHelper.globalViewport.center.x,
				state.graphicHelper.globalViewport.center.y,
				codeBlock.x + codeBlock.offsetX,
				codeBlock.y + codeBlock.offsetY
			);

			if (bottomIntersection) {
				engine.drawSprite(
					bottomIntersection.x,
					bottomIntersection.y - state.graphicHelper.globalViewport.hGrid,
					Icon.ARROW_BOTTOM
				);
			}

			const leftIntersection = calculateIntersection(
				state.graphicHelper.globalViewport.borderLineCoordinates.left.startX,
				state.graphicHelper.globalViewport.borderLineCoordinates.left.startY,
				state.graphicHelper.globalViewport.borderLineCoordinates.left.endX,
				state.graphicHelper.globalViewport.borderLineCoordinates.left.endY,
				state.graphicHelper.globalViewport.center.x,
				state.graphicHelper.globalViewport.center.y,
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
