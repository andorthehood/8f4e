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
 * - 'function': Contains function/functionEnd markers (compiled to WASM as reusable helper)
 * - 'constants': Contains constants/constantsEnd markers
 * - 'macro': Contains defineMacro/defineMacroEnd markers (reusable code snippets)
 * - 'note': Contains note/noteEnd markers (editor-only notes, not compiled)
 * - 'unknown': Mixed or incomplete markers, or no recognizable markers
 */
export type CodeBlockType = 'module' | 'function' | 'constants' | 'macro' | 'note' | 'unknown';

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
	memory?: DataStructure;
	bufferPointer: number;
	displayFormat: 'decimal' | 'binary' | 'hex';
	text?: string;
}

export interface MemoryIdentifier {
	memory: DataStructure;
	showAddress: boolean;
	showEndAddress: boolean;
	bufferPointer: number;
	displayFormat: 'decimal' | 'binary' | 'hex';
}

export interface ArrayPlotter {
	width: number;
	height: number;
	x: number;
	y: number;
	minValue: number;
	maxValue: number;
	startAddress: MemoryIdentifier;
	baseSampleShift: 0 | 1 | 2 | 3;
	length: number | MemoryIdentifier;
	valueType: TypedValueKind;
}

export interface ArrayMeter {
	width: number;
	height: number;
	x: number;
	y: number;
	minValue: number;
	maxValue: number;
	isBipolar: boolean;
	amplitudeLimit: number;
	inverseValueRange: number;
	greenEndX: number;
	yellowEndX: number;
	overloadMarkerX: number;
	overloadMarkerWidth: number;
	staticValueIndex?: number;
	memory: MemoryIdentifier;
	baseSampleShift: 0 | 1 | 2 | 3;
	valueType: TypedValueKind;
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

export type TypedValueKind = 'int8' | 'uint8' | 'int16' | 'uint16' | 'int32' | 'float32' | 'float64';

export interface ArrayWave {
	width: number;
	height: number;
	x: number;
	y: number;
	startAddress: MemoryIdentifier;
	elementByteSize: number;
	inverseElementByteSize: number;
	baseSampleShift: 0 | 1 | 2 | 3;
	length: number | MemoryIdentifier;
	pointer?: MemoryIdentifier;
	valueType: TypedValueKind;
	minValue: number;
	maxValue: number;
	inverseValueRange: number;
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
 * A single parsed directive record found in a code block's raw lines.
 * Covers both editor directives (`; @name`) and runtime directives (`; ~name`).
 * Multiple records may come from the same source line when directives are
 * chained in one comment.
 */
export interface ParsedDirectiveRecord {
	/** Directive prefix: '@' for editor directives, '~' for runtime directives */
	prefix: '@' | '~';
	/** Directive name (the word immediately after the prefix) */
	name: string;
	/** Whitespace-split arguments after the name */
	args: string[];
	/** Zero-based raw line index within the code block */
	rawRow: number;
	/** Original source line that contained the directive */
	sourceLine?: string;
	/** True when the directive appears as a trailing inline comment on a non-directive line */
	isTrailing: boolean;
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
	codeToRender: Array<Array<number | string>>;
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
	/** Pixel-space X coordinate, computed from gridX * vGrid (where vGrid = characterWidth) */
	x: number;
	/** Pixel-space Y coordinate, computed from gridY * hGrid (where hGrid = characterHeight) */
	y: number;
	offsetX: number;
	offsetY: number;
	widgets: {
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
		arrayPlotters: ArrayPlotter[];
		arrayMeters: ArrayMeter[];
		arrayWaves: ArrayWave[];
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
	 * Derived cache key for the block's rendered texture.
	 * Updated automatically whenever graphic data is recomputed.
	 */
	textureCacheKey: string;
	/**
	 * True when the block is currently rendered in a collapsed form.
	 */
	isCollapsed: boolean;
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
	 * When true, the block is hidden from rendering while unselected.
	 * Derived from `; @hidden`.
	 * Defaults to false.
	 */
	hidden: boolean;
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
	/**
	 * When true, marks this block as a favorite for quick navigation.
	 * Derived from ; @favorite directive.
	 * Defaults to false.
	 */
	isFavorite: boolean;
	/**
	 * Cached replay opacity value derived from `; @opacity <0..1>`.
	 * Applied only when the block is rendered through the cached path.
	 * When no `; @opacity` directive is specified, this is set to 1.
	 */
	opacity: number;
	/**
	 * Parsed directive records derived from this block's code lines during the central update pass.
	 * Covers both editor directives (`; @name`) and runtime directives (`; ~name`).
	 * Populated once per update; consumers should prefer these over rescanning raw code lines.
	 */
	parsedDirectives: ParsedDirectiveRecord[];
	/**
	 * Viewport anchor set by `; @viewport <corner>`.
	 * When present, `@pos` is interpreted as an inward offset from the specified viewport corner,
	 * and `gridX`/`gridY` store those anchored offsets rather than world-space grid coordinates.
	 * Undefined when no valid `@viewport` directive is present (world-space placement).
	 */
	viewportAnchor?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
	/**
	 * When true, this block belongs to the always-on-top z-order partition and renders above
	 * all normal blocks. Set by `; @alwaysOnTop`. Defaults to false.
	 */
	alwaysOnTop: boolean;
}

/**
 * Graphic helper state for rendering code blocks and UI elements.
 */
export type GraphicHelper = {
	spriteLookups?: SpriteLookups;
	outputsByWordAddress: Map<number, Output>;
	codeBlocks: CodeBlockGraphicData[];
	/**
	 * Subset of codeBlocks that have a `@viewport` directive.
	 * Maintained in sync with codeBlocks so that viewport move/resize handlers
	 * only iterate this smaller list instead of the full block array.
	 */
	viewportAnchoredCodeBlocks: CodeBlockGraphicData[];
	/**
	 * Monotonic render invalidation counter for code block texture caches.
	 * Increment when render-wide assets change without an individual block edit.
	 */
	textureCacheEpoch: number;
	/**
	 * Monotonically increasing counter for assigning creationIndex to new code blocks.
	 * Incremented each time a new code block is created.
	 * This is a runtime-only value and is NOT persisted.
	 */
	nextCodeBlockCreationIndex: number;
	contextMenu: ContextMenu;
	draggedCodeBlock?: CodeBlockGraphicData;
	selectedCodeBlock?: CodeBlockGraphicData;
	/** When true, blocks hidden by `; @hidden` stay visible regardless of selection. */
	showHiddenCodeBlocks: boolean;
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
