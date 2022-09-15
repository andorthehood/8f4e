import { Engine } from '@8f4e/2d-engine';

import { Line } from '../../../state/types';

export default function drawLines(engine: Engine, lines: Line[]): void {
	for (let i = 0; i < lines.length; i++) {
		engine.drawSprite(lines[i].x, lines[i].y, 'rgb(102,102,102)', lines[i].width, lines[i].height);
	}
}
