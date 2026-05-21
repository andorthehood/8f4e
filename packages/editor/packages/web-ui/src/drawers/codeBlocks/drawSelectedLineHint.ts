import type { Engine } from 'glugglug';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { SpriteLookup } from 'glugglug';

const numberRegExp = /(?<![#\w])-?(?:\d+|0b[01]+|0x[\da-f]+)\b/gi;
const horizontalPaddingChars = 2;

function isStackAnalysisLine(line: string): boolean {
	return line.startsWith('before ') || line.startsWith('after: ');
}

function drawTextWithNumberFormatting(
	engine: Engine,
	state: State,
	text: string,
	x: number,
	y: number,
	defaultLookup: SpriteLookup
): void {
	const spriteLookups = state.graphicHelper.spriteLookups!;
	let previousIndex = 0;

	for (const match of text.matchAll(numberRegExp)) {
		if (typeof match.index !== 'number') {
			continue;
		}

		if (match.index > previousIndex) {
			engine.setSpriteLookup(defaultLookup);
			engine.drawText(x + previousIndex * state.viewport.vGrid, y, text.slice(previousIndex, match.index));
		}

		engine.setSpriteLookup(spriteLookups.fontNumbers);
		engine.drawText(x + match.index * state.viewport.vGrid, y, match[0]);
		previousIndex = match.index + match[0].length;
	}

	if (previousIndex < text.length) {
		engine.setSpriteLookup(defaultLookup);
		engine.drawText(x + previousIndex * state.viewport.vGrid, y, text.slice(previousIndex));
	}
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

	drawTextWithNumberFormatting(
		engine,
		state,
		rest,
		x + instruction.length * state.viewport.vGrid,
		y,
		spriteLookups.fontCode
	);
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
	const horizontalPadding = horizontalPaddingChars * vGrid;
	const width = (Math.max(...lines.map(line => line.length)) + horizontalPaddingChars * 2) * vGrid;
	const height = lines.length * hGrid;
	const x = -width - vGrid;
	const y = codeBlock.cursor.y;

	engine.setSpriteLookup(spriteLookups.fillColors);
	engine.drawSprite(x, y, 'debugInfoBackground', width, height);

	lines.forEach((line, index) => {
		const lineX = x + horizontalPadding;
		const lineY = y + index * hGrid;

		if (index === 0 && !isStackAnalysisLine(line)) {
			drawSignatureLine(engine, state, line, lineX, lineY);
			return;
		}

		drawTextWithNumberFormatting(
			engine,
			state,
			line,
			lineX,
			lineY,
			isStackAnalysisLine(line) ? spriteLookups.fontCode : spriteLookups.fontCodeComment
		);
	});
}
