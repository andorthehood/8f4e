import type { CodeBlockGraphicData, State, TooltipLiveValue } from '@8f4e/editor-state-types';
import type { PlannedMemoryDeclaration } from '@8f4e/language-spec';
import type { SpriteFont } from '@8f4e/sprite-generator';
import type { DrawContext } from '../../drawContext';
import type { MemoryViews } from '../../types';
import formatDebuggerValue, { formatDebuggerValueAtAddress } from './widgets/formatDebuggerValue';

const TOOLTIP_SPRING_DURATION_MS = 600;
const TOOLTIP_SPRING_REVOLUTIONS = 1.5;
const TOOLTIP_SPRING_VERTICAL_SCALE = 0.5;
const tooltipAnimationOffsetChars = 2;

export interface TooltipAnimationOffset {
	x: number;
	y: number;
}

export function getTooltipAnimationOffset(state: State, now = performance.now()): TooltipAnimationOffset {
	const { startedAt } = state.tooltip.animation;

	if (startedAt === undefined) {
		return { x: 0, y: 0 };
	}

	const progress = Math.min(Math.max((now - startedAt) / TOOLTIP_SPRING_DURATION_MS, 0), 1);
	if (progress === 1) {
		return { x: 0, y: 0 };
	}

	const damping = (1 - progress) ** 1.5;
	const angle = progress * TOOLTIP_SPRING_REVOLUTIONS * Math.PI * 2;
	const horizontalRadius = tooltipAnimationOffsetChars * state.viewport.vGrid;
	const verticalRadius = horizontalRadius * TOOLTIP_SPRING_VERTICAL_SCALE;
	const x = Math.round(-horizontalRadius * damping * Math.cos(angle));
	const y = Math.round(-verticalRadius * damping * Math.sin(angle));

	return {
		x: x === 0 ? 0 : x,
		y: y === 0 ? 0 : y,
	};
}

function getMemoryForLiveValueLine(
	state: State,
	moduleId: string,
	memoryId: string
): PlannedMemoryDeclaration | undefined {
	return state.compiler.memoryPlan.modules[moduleId]?.memory[memoryId];
}

function getLiveValueText(state: State, memoryViews: MemoryViews, liveValue: TooltipLiveValue): string | undefined {
	const memory = getMemoryForLiveValueLine(state, liveValue.source.moduleId, liveValue.source.memoryId);

	if (!memory) {
		return undefined;
	}

	switch (liveValue.source.kind) {
		case 'memoryAddress':
			return String(memory.byteAddress);
		case 'memoryValue':
			return formatDebuggerValue(memoryViews, memory, liveValue.source.elementIndex ?? 0, 'decimal');
		case 'memoryDereference': {
			const pointerByteAddress = memoryViews.int32[memory.wordAlignedAddress];
			return formatDebuggerValueAtAddress(
				memoryViews,
				pointerByteAddress,
				pointerByteAddress / 4,
				liveValue.source.format,
				'decimal'
			);
		}
	}
}

function drawCharactersWithColors(
	engine: DrawContext,
	state: State,
	characters: Array<number | string>,
	colors: Array<SpriteFont | undefined> | undefined,
	x: number,
	y: number
): void {
	const spriteLookups = state.spriteLookups!;
	let currentLookup = colors?.[0] ?? spriteLookups.fontTooltipText;

	for (let index = 0; index < characters.length; index++) {
		const nextLookup = colors?.[index] ?? currentLookup;

		currentLookup = nextLookup;

		if (characters[index] !== 32) {
			engine.drawSprite(x + index * state.viewport.vGrid, y, currentLookup[characters[index]] ?? currentLookup[63]);
		}
	}
}

function drawTextCharacters(
	engine: DrawContext,
	state: State,
	text: string,
	x: number,
	y: number,
	font: SpriteFont
): void {
	for (let index = 0; index < text.length; index++) {
		const character = text.charCodeAt(index);

		if (character !== 32) {
			engine.drawSprite(x + index * state.viewport.vGrid, y, font[character] ?? font[63]);
		}
	}
}

function drawLiveValue(
	engine: DrawContext,
	state: State,
	memoryViews: MemoryViews,
	liveValue: TooltipLiveValue,
	offset: TooltipAnimationOffset
): void {
	const spriteLookups = state.spriteLookups!;
	const value = getLiveValueText(state, memoryViews, liveValue);

	if (value === undefined) {
		return;
	}

	drawTextCharacters(
		engine,
		state,
		value,
		liveValue.x + offset.x,
		liveValue.y + offset.y,
		liveValue.color ?? spriteLookups.fontTooltipHighlight
	);
}

export default function drawSelectedLineHint(
	engine: DrawContext,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	const spriteLookups = state.spriteLookups;

	if (
		!spriteLookups ||
		!state.featureFlags.codeLineSelection ||
		state.codeBlockRendering.selectedCodeBlock !== codeBlock
	) {
		return;
	}

	if (state.tooltip.lineCount === 0) {
		return;
	}

	const { width, height, x, y, lineX } = state.tooltip.layout;
	const animationOffset = getTooltipAnimationOffset(state);

	engine.drawSprite(
		x + animationOffset.x,
		y + animationOffset.y,
		spriteLookups.fillColors.tooltipBackground,
		width,
		height
	);

	for (const highlight of state.tooltip.highlights) {
		engine.drawSprite(
			highlight.x + animationOffset.x,
			highlight.y + animationOffset.y,
			spriteLookups.fillColors[highlight.fillColor],
			highlight.width,
			highlight.height
		);
	}

	for (let index = 0; index < state.tooltip.characters.length; index++) {
		drawCharactersWithColors(
			engine,
			state,
			state.tooltip.characters[index],
			state.tooltip.colors[index],
			lineX + animationOffset.x,
			y + index * state.viewport.hGrid + animationOffset.y
		);
	}

	for (const liveValue of state.tooltip.liveValues) {
		drawLiveValue(engine, state, memoryViews, liveValue, animationOffset);
	}
}
