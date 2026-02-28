/**
 * Types for code-blocks feature - manages code block entities, rendering, and interactions.
 */

import type { DataStructure } from '@8f4e/compiler';
import type { SpriteLookups } from '@8f4e/sprite-generator';
import type { SpriteLookup, PostProcessEffect, BackgroundEffect } from 'glugglug';
import type { ContextMenu } from '../menu/types';

/**
 * Project-level code block structure for persistent storage.
 * Position is stored within code via @pos directive.
 * Disabled state is stored within code via @disabled directive.
 */
export interface CodeBlock {
	code: string[];
}

/**
 * The type of a code block, determined by its content markers.
 * - 'module': Contains module/moduleEnd markers (compiled to WASM)
 * - 'config': Contains config/configEnd markers (compiled to JSON configuration)
 * - 'function': Contains function/functionEnd markers (compiled to WASM as reusable helper)
 * - 'constants': Contains constants/constantsEnd markers
 * - 'macro': Contains defineMacro/defineMacroEnd markers (reusable code snippets)
 * - 'vertexShader': Contains vertexShader/vertexShaderEnd markers (GLSL vertex shader)
 * - 'fragmentShader': Contains fragmentShader/fragmentShaderEnd markers (GLSL fragment shader)
 * - 'unknown': Mixed or incomplete markers, or no recognizable markers
 */
export type CodeBlockType =
	| 'module'
	| 'config'
	| 'function'
	| 'constants'
	| 'macro'
	| 'vertexShader'
	| 'fragmentShader'
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
	memory: DataStructure;
}

export interface Debugger {
	width: number;
	height: number;
	showAddress: boolean;
	showEndAddress: boolean;
	x: number;
	y: number;
	id: string;
	memory: DataStructure;
	bufferPointer: number;
	showBinary: boolean;
}

export interface MemoryIdentifier {
	memory: DataStructure;
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
	pressedKeysListMemory: DataStructure;
	pressedNumberOfKeysMemory: DataStructure;
	startingNumber: number;
}

export interface BufferScanner {
	width: number;
	height: number;
	x: number;
	y: number;
	buffer: MemoryIdentifier;
	pointer: MemoryIdentifier;
}

export interface Slider {
	width: number;
	height: number;
	x: number;
	y: number;
	id: string;
	min: number;
	max: number;
	step?: number;
}

/**
 * Runtime graphic data for a code block.
 * Contains all information needed to render and interact with a code block.
 */
export interface CodeBlockGraphicData {
	width: number;
	height: number;
	code: string[];
	lineNumberColumnWidth: number;
	codeToRender: number[][];
	codeColors: Array<Array<SpriteLookup | undefined>>;
	/** The gaps between lines */
	gaps: Map<number, { size: number }>;
	/** Optional minimum grid width override (e.g., for piano keyboards) */
	minGridWidth?: number;
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
	/** Raw module/constants identifier used as key in compiler.compiledModules */
	moduleId?: string;
	positionOffsetterXWordAddress?: number;
	positionOffsetterYWordAddress?: number;
	/** Grid-space X coordinate (source of truth for horizontal position). Pixel X = gridX * vGrid */
	gridX: number;
	/** Grid-space Y coordinate (source of truth for vertical position). Pixel Y = gridY * hGrid */
	gridY: number;
	/** Grid-space width of the block. Updated alongside width in updateGraphics. */
	gridWidth: number;
	/** Grid-space height of the block, including visual gap rows. Updated alongside height in updateGraphics. */
	gridHeight: number;
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
		bufferScanners: BufferScanner[];
		switches: Switch[];
		buttons: Switch[];
		sliders: Slider[];
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
	/**
	 * When true, the block is excluded from compilation and rendered with a transparent background.
	 * Defaults to false.
	 */
	disabled: boolean;
	/**
	 * Optional group name for the code block, derived from ; @group directive.
	 * Blocks with the same group name move together by default during drag.
	 */
	groupName?: string;
	/**
	 * Optional flag indicating whether the group should override default grouped drag behavior.
	 * When true, blocks in this group drag individually by default (Alt key reverses to group drag).
	 * When false/undefined, blocks in this group drag together by default (Alt key reverses to single-block drag).
	 * Derived from the optional 'nonstick' keyword in ; @group directive.
	 */
	groupNonstick?: boolean;
	/**
	 * When true, marks this block as the home block for initial viewport placement.
	 * The viewport centers on the first block with isHome=true when a project loads.
	 * Derived from ; @home directive.
	 * Defaults to false.
	 */
	isHome: boolean;
}

/**
 * Graphic helper state for rendering code blocks and UI elements.
 */
export type GraphicHelper = {
	spriteLookups?: SpriteLookups;
	outputsByWordAddress: Map<number, Output>;
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
	selectedCodeBlockForProgrammaticEdit?: CodeBlockGraphicData;
	/**
	 * Similar to selectedCodeBlockForProgrammaticEdit but without triggering compiler effects.
	 * Use this for operations like drag-end position updates that should save but not recompile.
	 */
	selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger?: CodeBlockGraphicData;
	/** Post-process effects configuration for custom visual effects */
	postProcessEffects: PostProcessEffect[];
	/** Background effects configuration for custom visual effects */
	backgroundEffects: BackgroundEffect[];
};
