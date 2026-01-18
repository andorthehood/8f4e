/**
 * Types for code-blocks feature - manages code block entities, rendering, and interactions.
 */

import type { GridCoordinates } from '../../shared/types';
import type { ProjectViewport } from '../viewport/types';
import type { SpriteLookup, SpriteLookups, PostProcessEffect } from 'glugglug';
import type { ContextMenu } from '../menu/types';

/**
 * Project-level code block structure with grid-based coordinates.
 * Used for persistent storage.
 */
export interface CodeBlock {
	code: string[];
	/** Grid coordinates for the code block position in the editor */
	gridCoordinates: GridCoordinates;
	viewport?: ProjectViewport;
}

/**
 * The type of a code block, determined by its content markers.
 * - 'module': Contains module/moduleEnd markers (compiled to WASM)
 * - 'config': Contains config/configEnd markers (compiled to JSON configuration)
 * - 'function': Contains function/functionEnd markers (compiled to WASM as reusable helper)
 * - 'constants': Contains constants/constantsEnd markers
 * - 'vertexShader': Contains vertexShader/vertexShaderEnd markers (GLSL vertex shader)
 * - 'fragmentShader': Contains fragmentShader/fragmentShaderEnd markers (GLSL fragment shader)
 * - 'comment': Contains comment/commentEnd markers (documentation, excluded from compilation)
 * - 'unknown': Mixed or incomplete markers, or no recognizable markers
 */
export type CodeBlockType =
	| 'module'
	| 'config'
	| 'function'
	| 'constants'
	| 'vertexShader'
	| 'fragmentShader'
	| 'comment'
	| 'unknown';

// Forward declarations for circular dependencies
export interface Input {
	codeBlock: CodeBlockGraphicData;
	width: number;
	height: number;
	x: number;
	y: number;
	id: string;
	wordAlignedAddress: number;
}

export interface Output {
	codeBlock: CodeBlockGraphicData;
	width: number;
	height: number;
	x: number;
	y: number;
	id: string;
	calibratedMax: number;
	calibratedMin: number;
	memory: import('@8f4e/compiler').DataStructure;
}

export interface Debugger {
	width: number;
	height: number;
	showAddress: boolean;
	showEndAddress: boolean;
	x: number;
	y: number;
	id: string;
	memory: import('@8f4e/compiler').DataStructure;
	bufferPointer: number;
	showBinary: boolean;
}

export interface MemoryIdentifier {
	memory: import('@8f4e/compiler').DataStructure;
	showAddress: boolean;
	showEndAddress: boolean;
	bufferPointer: number;
	showBinary: boolean;
}

export interface BufferPlotter {
	width: number;
	height: number;
	x: number;
	y: number;
	minValue: number;
	maxValue: number;
	buffer: MemoryIdentifier;
	bufferLength: MemoryIdentifier | undefined;
}

export interface Switch {
	width: number;
	height: number;
	x: number;
	y: number;
	id: string;
	offValue: number;
	onValue: number;
}

export interface PianoKeyboard {
	x: number;
	y: number;
	width: number;
	height: number;
	keyWidth: number;
	pressedKeys: Set<number>;
	pressedKeysListMemory: import('@8f4e/compiler').DataStructure;
	pressedNumberOfKeysMemory: import('@8f4e/compiler').DataStructure;
	startingNumber: number;
}

/**
 * Runtime graphic data for a code block.
 * Contains all information needed to render and interact with a code block.
 */
export interface CodeBlockGraphicData {
	width: number;
	minGridWidth: number;
	height: number;
	code: string[];
	lineNumberColumnWidth: number;
	codeToRender: number[][];
	codeColors: Array<Array<SpriteLookup | undefined>>;
	/** The gaps between lines */
	gaps: Map<number, { size: number }>;
	cursor: {
		/** The column of the cursor */
		col: number;
		/** The row of the cursor */
		row: number;
		/** The x position of the cursor calculated considering the grid and the line numbers. */
		x: number;
		/** The y position of the cursor calculated considering the grid and the gaps between lines. */
		y: number;
	};
	id: string;
	positionOffsetterXWordAddress?: number;
	positionOffsetterYWordAddress?: number;
	/** Grid-space X coordinate (source of truth for horizontal position). Pixel X = gridX * vGrid */
	gridX: number;
	/** Grid-space Y coordinate (source of truth for vertical position). Pixel Y = gridY * hGrid */
	gridY: number;
	/** Pixel-space X coordinate, computed from gridX * vGrid (where vGrid = characterWidth) */
	x: number;
	/** Pixel-space Y coordinate, computed from gridY * hGrid (where hGrid = characterHeight) */
	y: number;
	offsetX: number;
	offsetY: number;
	extras: {
		blockHighlights: Array<{
			x: number;
			y: number;
			height: number;
			width: number;
			color: string;
		}>;
		inputs: Input[];
		outputs: Output[];
		debuggers: Debugger[];
		bufferPlotters: BufferPlotter[];
		switches: Switch[];
		buttons: Switch[];
		pianoKeyboards: PianoKeyboard[];
		errorMessages: Array<{
			message: string[];
			x: number;
			y: number;
			lineNumber: number;
		}>;
	};
	lastUpdated: number;
	/**
	 * Monotonically increasing index assigned when the code block is created.
	 * Used to maintain stable ordering for compiler module list.
	 * This is a runtime-only value and is NOT persisted.
	 */
	creationIndex: number;
	/**
	 * The type of the code block, determined by its content markers.
	 * Updated automatically when code changes.
	 */
	blockType: CodeBlockType;
}

/**
 * Graphic helper state for rendering code blocks and UI elements.
 */
export type GraphicHelper = {
	spriteLookups?: SpriteLookups;
	outputsByWordAddress: Map<number, Output>;
	viewport: {
		width: number;
		height: number;
		roundedWidth: number;
		roundedHeight: number;
		vGrid: number;
		hGrid: number;
		borderLineCoordinates: {
			top: { startX: number; startY: number; endX: number; endY: number };
			right: { startX: number; startY: number; endX: number; endY: number };
			bottom: { startX: number; startY: number; endX: number; endY: number };
			left: { startX: number; startY: number; endX: number; endY: number };
		};
		center: { x: number; y: number };
		x: number;
		y: number;
		animationDurationMs?: number;
	};
	codeBlocks: CodeBlockGraphicData[];
	/**
	 * Monotonically increasing counter for assigning creationIndex to new code blocks.
	 * Incremented each time a new code block is created.
	 * This is a runtime-only value and is NOT persisted.
	 */
	nextCodeBlockCreationIndex: number;
	contextMenu: ContextMenu;
	draggedCodeBlock?: CodeBlockGraphicData;
	selectedCodeBlock?: CodeBlockGraphicData;
	dialog: {
		show: boolean;
		text: string;
		title: string;
		buttons: Array<{
			title: string;
			action: string;
			payload?: unknown;
		}>;
	};
	/** Post-process effects configuration for custom visual effects */
	postProcessEffects: PostProcessEffect[];
};
