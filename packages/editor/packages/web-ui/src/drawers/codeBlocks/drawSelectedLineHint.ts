import type { Engine } from 'glugglug';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';

function isStackAnalysisLine(line: string): boolean {
	return line.startsWith('before ') || line.startsWith('after: ');
}

function drawSignatureLine(engine: Engine, state: State, line: string, x: number, y: number): void {
	const spriteLookups = state.graphicHelper.spriteLookups!;
	const instructionMatch = /^(\S+)(.*)$/.exec(line);

	if (!instructionMatch) {
		return;
	}

	const [, instruction, rest] = instructionMatch;

	engine.setSpriteLookup(spriteLookups.fontInstruction);
	engine.drawText(x, y, instruction);

	if (rest.length === 0) {
		return;
	}

	engine.setSpriteLookup(spriteLookups.fontCode);
	engine.drawText(x + instruction.length * state.viewport.vGrid, y, rest);
}

export default function drawSelectedLineHint(engine: Engine, state: State, codeBlock: CodeBlockGraphicData): void {
	const spriteLookups = state.graphicHelper.spriteLookups;
	const lines = state.tooltip.text;

	if (
		!spriteLookups ||
		lines.length === 0 ||
		!state.featureFlags.codeLineSelection ||
		state.graphicHelper.selectedCodeBlock !== codeBlock
	) {
		return;
	}

	const { vGrid, hGrid } = state.viewport;
	const width = (Math.max(...lines.map(line => line.length)) + 2) * vGrid;
	const height = lines.length * hGrid;
	const x = -width - vGrid;
	const y = codeBlock.cursor.y;

	engine.setSpriteLookup(spriteLookups.fillColors);
	engine.drawSprite(x, y, 'debugInfoBackground', width, height);

	lines.forEach((line, index) => {
		const lineX = x + vGrid;
		const lineY = y + index * hGrid;

		if (index === 0 && !isStackAnalysisLine(line)) {
			drawSignatureLine(engine, state, line, lineX, lineY);
			return;
		}

		engine.setSpriteLookup(isStackAnalysisLine(line) ? spriteLookups.fontCode : spriteLookups.fontCodeComment);
		engine.drawText(lineX, lineY, line);
	});
}
