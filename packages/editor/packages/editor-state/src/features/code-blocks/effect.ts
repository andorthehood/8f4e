import type { CodeBlockGraphicData, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { getDocumentProjectBlockType, getPointerDepth, isMemoryDeclarationInstruction } from '@8f4e/tokenizer';
import gapCalculator from '../code-editing/gapCalculator';
import highlightSyntax8f4e from '../code-editing/highlightSyntax8f4e';
import highlightSyntaxGlsl from '../code-editing/highlightSyntaxGlsl';
import highlightSyntaxNote from '../code-editing/highlightSyntaxNote';
import { moveCaret } from '../code-editing/moveCaret';
import reverseGapCalculator from '../code-editing/reverseGapCalculator';
import {
	expandLineColorsToCells,
	expandLineToCells,
	getRawIndexForVisualColumn,
	getTabStopsByLine,
	getVisualColumnForRawIndex,
} from '../code-editing/tabLayout';
import { isShaderNoteCode } from '../shader-effects/getShaderNoteMetadata';
import centerViewportOnCodeBlock from '../viewport/centerViewportOnCodeBlock';
import updateViewport from '../viewport/updateViewport';
import blockHighlights from './features/blockHighlights/updateGraphicData';
import type { CodeBlockClickEvent } from './features/codeBlockDragger/effect';
import parsePos from './features/directives/pos/data';
import {
	deriveDirectiveState,
	runAfterGraphicDataWidthCalculation,
	runBeforeGraphicDataWidthCalculation,
} from './features/directives/registry';
import inputs from './features/inputs/updateGraphicData';
import outputs from './features/outputs/updateGraphicData';
import gaps from './gaps';
import getCodeBlockGridWidth from './getCodeBlockGridWidth';
import paramShape, { updateParamShapeDeclarations } from './paramShape/updateGraphicData';
import positionOffsetters from './positionOffsetters';
import shape, { updateShapeDeclarations } from './shape/updateGraphicData';
import { createCodeBlockGraphicData } from './utils/createCodeBlockGraphicData';
import getCodeBlockNameFromSource from './utils/getCodeBlockNameFromSource';
import { parseBlockDirectives } from './utils/parseBlockDirectives';
import wrapText from './utils/wrapText';

function shouldRenderBlankLineNumber(sourceLine: string): boolean {
	const instruction = sourceLine.match(/^\s*([^\s;]+)/)?.[1];
	return instruction !== undefined && isMemoryDeclarationInstruction(instruction) && getPointerDepth(instruction) > 0;
}

function getLineNumberPrefix(
	displayRow: number,
	lineNumberColumnWidth: number,
	sourceLine: string,
	isPlaceholder: boolean
): string {
	if (!isPlaceholder && shouldRenderBlankLineNumber(sourceLine)) {
		return ''.padStart(lineNumberColumnWidth + 1, ' ');
	}

	return `${displayRow}`.padStart(lineNumberColumnWidth, '0') + ' ';
}

export default function codeBlockRendering(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();
	const shouldExpandCodeBlockForEditing = (codeBlock: CodeBlockGraphicData): boolean =>
		codeBlock === state.codeBlockRendering.selectedCodeBlock;

	const onCodeBlockClick = ({ relativeX = 0, relativeY = 0, codeBlock }: CodeBlockClickEvent) => {
		if (!state.featureFlags.codeLineSelection) {
			return;
		}

		const directiveState = deriveDirectiveState(codeBlock.code, codeBlock.parsedDirectives, {
			isExpandedForEditing: !codeBlock.isCollapsed,
		});
		const displayModel = directiveState.displayModel;
		const displayRow = reverseGapCalculator(Math.floor(relativeY / state.viewport.hGrid), codeBlock.gaps);
		const row = displayModel.displayRowToRawRow[Math.min(displayRow, displayModel.displayRowToRawRow.length - 1)] ?? 0;
		const visualCol = Math.max(Math.floor(relativeX / state.viewport.vGrid) - (codeBlock.lineNumberColumnWidth + 2), 0);
		const tabStopsByLine = getTabStopsByLine(codeBlock.code);
		const col = getRawIndexForVisualColumn(
			codeBlock.code[Math.min(row, codeBlock.code.length - 1)] || '',
			visualCol,
			tabStopsByLine[Math.min(row, codeBlock.code.length - 1)] || []
		);
		const [boundedRow, boundedCol] = moveCaret(codeBlock.code, row, col, 'jump');
		if (codeBlock !== state.codeBlockRendering.selectedCodeBlock) {
			return;
		}

		store.set('codeBlockRendering.selectedCodeBlock.cursor', {
			...codeBlock.cursor,
			row: boundedRow,
			col: boundedCol,
		});
	};

	const updateGraphics = (graphicData: CodeBlockGraphicData) => {
		if (!state.spriteLookups) {
			return;
		}

		const spriteLookups = state.spriteLookups;
		const directiveState = deriveDirectiveState(graphicData.code, graphicData.parsedDirectives, {
			isExpandedForEditing: shouldExpandCodeBlockForEditing(graphicData),
			state,
		});
		const displayModel = directiveState.displayModel;

		graphicData.disabled = directiveState.blockState.disabled;
		graphicData.hidden = directiveState.blockState.hidden && state.codeBlockRendering.selectedCodeBlock !== graphicData;
		graphicData.isHome = directiveState.blockState.isHome;
		graphicData.homeAlignment = directiveState.blockState.homeAlignment;
		graphicData.isFavorite = directiveState.blockState.isFavorite;
		graphicData.opacity = directiveState.blockState.opacity;
		const tabStopsByLine = getTabStopsByLine(graphicData.code);

		graphicData.lineNumberColumnWidth = graphicData.code.length.toString().length;

		graphicData.codeToRender = displayModel.lines.map(({ text, rawRow, isPlaceholder }, displayRow) => {
			const prefix = getLineNumberPrefix(displayRow, graphicData.lineNumberColumnWidth, text, isPlaceholder ?? false);
			return [...prefix]
				.map(char => char.charCodeAt(0) as number | string)
				.concat(expandLineToCells(text, tabStopsByLine[rawRow] || []));
		});
		graphicData.name = getCodeBlockNameFromSource(graphicData.code);
		graphicData.isCollapsed = displayModel.isCollapsed;

		// Choose highlighter based on block type and get syntax colors for raw code
		let rawCodeColors;
		if (graphicData.blockType === 'note' && isShaderNoteCode(graphicData.code)) {
			rawCodeColors = highlightSyntaxGlsl(graphicData.code, spriteLookups);
		} else if (graphicData.blockType === 'note') {
			rawCodeColors = highlightSyntaxNote(graphicData.code, spriteLookups);
		} else {
			rawCodeColors = highlightSyntax8f4e(graphicData.code, spriteLookups);
		}

		// Merge raw code colors into color matrix aligned with codeWithLineNumbers
		// by offsetting indices to account for line number prefix
		const lineNumberPrefixLength = graphicData.lineNumberColumnWidth + 1; // +1 for space
		graphicData.codeColors = graphicData.codeToRender.map((line, displayRow) => {
			const lineColors = new Array(line.length).fill(undefined);
			const displayLine = displayModel.lines[displayRow];
			const rawRow = displayModel.displayRowToRawRow[displayRow] ?? 0;

			// Apply line number color at the first column (color persists until changed)
			lineColors[0] = spriteLookups.fontLineNumber;

			// Reset to code color after line number prefix (at the space separator)
			lineColors[graphicData.lineNumberColumnWidth] = displayLine?.isPlaceholder
				? spriteLookups.fontCodeComment
				: spriteLookups.fontCode;

			if (displayLine?.isPlaceholder) {
				return lineColors;
			}

			// Merge syntax colors from raw code, offset by prefix length
			const rawColors = expandLineColorsToCells(
				graphicData.code[rawRow] || '',
				rawCodeColors[rawRow] || [],
				tabStopsByLine[rawRow] || []
			);
			rawColors.forEach((color, i) => {
				if (color !== undefined) {
					lineColors[i + lineNumberPrefixLength] = color;
				}
			});

			return lineColors;
		});

		shape(graphicData, state, directiveState);
		paramShape(graphicData, state, directiveState);
		gaps(graphicData, directiveState);
		updateShapeDeclarations(graphicData, state, directiveState);
		updateParamShapeDeclarations(graphicData, state, directiveState);
		runBeforeGraphicDataWidthCalculation(graphicData, state, directiveState);

		graphicData.width = getCodeBlockGridWidth(graphicData.code, graphicData.minGridWidth) * state.viewport.vGrid;

		runAfterGraphicDataWidthCalculation(graphicData, state, directiveState);
		outputs(graphicData, state);
		inputs(graphicData, state);
		positionOffsetters(graphicData, state);
		blockHighlights(graphicData, state);

		graphicData.height = graphicData.codeToRender.length * state.viewport.hGrid;
		graphicData.cursor.x =
			(getVisualColumnForRawIndex(
				graphicData.code[graphicData.cursor.row] || '',
				graphicData.cursor.col,
				tabStopsByLine[graphicData.cursor.row] || []
			) +
				(graphicData.lineNumberColumnWidth + 2)) *
			state.viewport.vGrid;
		const displayRow = displayModel.rawRowToDisplayRow[graphicData.cursor.row] ?? graphicData.cursor.row;
		graphicData.cursor.y = gapCalculator(displayRow, graphicData.gaps) * state.viewport.hGrid;
		graphicData.groupName = directiveState.blockState.groupName;
		graphicData.groupNonstick = directiveState.blockState.groupNonstick;
		graphicData.viewportAnchor = directiveState.blockState.viewportAnchor;
		graphicData.alwaysOnTop = directiveState.blockState.alwaysOnTop ?? false;

		graphicData.textureCacheKey = `codeBlock:${graphicData.creationIndex}:${graphicData.lastUpdated}:${displayModel.isCollapsed ? 'collapsed' : 'expanded'}:${state.codeBlockRendering.textureCacheEpoch}`;
	};

	const updateGraphicsAll = () => {
		for (const graphicData of state.codeBlockRendering.codeBlocks) {
			updateGraphics(graphicData);
		}
	};

	const recomputePixelCoordinatesAndUpdateGraphics = () => {
		// When viewport grid dimensions change (e.g., font change), recompute pixel positions
		// from the stable grid coordinates, then update graphics. Combined into single iteration.
		for (const codeBlock of state.codeBlockRendering.codeBlocks) {
			if (!codeBlock.viewportAnchor) {
				// World-space blocks: derive pixel position directly from grid coordinates.
				codeBlock.x = codeBlock.gridX * state.viewport.vGrid;
				codeBlock.y = codeBlock.gridY * state.viewport.hGrid;
			}
			// Viewport-anchored blocks: x/y depend on current block width/height (for right/bottom
			// anchors). updateGraphics() computes width and height first, then applies the anchored
			// position at the end of its execution. No pre-assignment needed here.
			updateGraphics(codeBlock);
		}
	};

	const centerViewportOnSelectedCodeBlock = () => {
		const selectedCodeBlock = state.codeBlockRendering.selectedCodeBlock;
		if (!selectedCodeBlock) {
			return;
		}

		const { x, y } = centerViewportOnCodeBlock(state.viewport, selectedCodeBlock, {
			alignment: selectedCodeBlock.homeAlignment,
		});
		updateViewport(state, x, y, events);
	};

	const updateSelectedCodeBlock = () => {
		if (!state.codeBlockRendering.selectedCodeBlock) {
			return;
		}
		updateGraphics(state.codeBlockRendering.selectedCodeBlock);
	};

	const updateProgrammaticSelectedCodeBlock = () => {
		const block = state.codeBlockRendering.selectedCodeBlockForProgrammaticEdit;
		if (!block) {
			return;
		}
		updateGraphics(block);
	};

	const updateProgrammaticSelectedCodeBlockWithoutCompilerTrigger = () => {
		const block = state.codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger;
		if (!block) {
			return;
		}
		updateGraphics(block);
	};

	const updateHideSelectionTransition = (
		previousBlock: CodeBlockGraphicData | undefined,
		nextBlock: CodeBlockGraphicData | undefined
	) => {
		[previousBlock, nextBlock].forEach(codeBlock => {
			if (!codeBlock) {
				return;
			}

			updateGraphics(codeBlock);
		});
	};

	let previousSelectedCodeBlock = state.codeBlockRendering.selectedCodeBlock;
	const onSelectedCodeBlockChanged = () => {
		updateHideSelectionTransition(previousSelectedCodeBlock, state.codeBlockRendering.selectedCodeBlock);
		previousSelectedCodeBlock = state.codeBlockRendering.selectedCodeBlock;
	};

	const populateCodeBlocks = async () => {
		if (!state.initialProjectState) {
			return;
		}

		state.codeBlockRendering.outputsByWordAddress.clear();
		state.codeBlockRendering.draggedCodeBlock = undefined;
		state.codeBlockRendering.nextCodeBlockCreationIndex = 0;
		store.set('codeBlockRendering.selectedCodeBlock', undefined);
		store.set('codeBlockRendering.selectedCodeBlockForProgrammaticEdit', undefined);

		const codeBlocks = state.initialProjectState.codeBlocks.map(codeBlock => {
			const creationIndex = state.codeBlockRendering.nextCodeBlockCreationIndex;
			state.codeBlockRendering.nextCodeBlockCreationIndex++;

			// Parse @pos directive from code, default to (0,0) if missing or invalid
			const blockParsedDirectives = parseBlockDirectives(codeBlock.code);
			const posResult = parsePos(blockParsedDirectives);
			const gridX = posResult?.x ?? 0;
			const gridY = posResult?.y ?? 0;
			const directiveState = deriveDirectiveState(codeBlock.code, blockParsedDirectives);

			// For viewport-anchored blocks, x/y will be resolved after updateGraphics() sets
			// width/height; initialize to 0 here as a safe placeholder.
			const isAnchored = directiveState.blockState.viewportAnchor !== undefined;
			const pixelX = isAnchored ? 0 : gridX * state.viewport.vGrid;
			const pixelY = isAnchored ? 0 : gridY * state.viewport.hGrid;

			const blockType = getDocumentProjectBlockType(codeBlock.code) as CodeBlockGraphicData['blockType'];
			if (blockType === 'module' && !codeBlock.entry) {
				throw new Error(`Project module block "${getCodeBlockNameFromSource(codeBlock.code)}" is missing an entry`);
			}

			return createCodeBlockGraphicData({
				width: 0,
				height: 0,
				code: codeBlock.code,
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				name: getCodeBlockNameFromSource(codeBlock.code),
				gridX,
				gridY,
				x: pixelX,
				y: pixelY,
				lineNumberColumnWidth: 1,
				creationIndex,
				blockType,
				entry: codeBlock.entry,
				disabled: directiveState.blockState.disabled,
				hidden: directiveState.blockState.hidden,
				isHome: directiveState.blockState.isHome,
				homeAlignment: directiveState.blockState.homeAlignment,
				isFavorite: directiveState.blockState.isFavorite,
				opacity: directiveState.blockState.opacity,
				alwaysOnTop: directiveState.blockState.alwaysOnTop ?? false,
				viewportAnchor: directiveState.blockState.viewportAnchor,
				parsedDirectives: blockParsedDirectives,
			});
		});

		// Stable-sort to maintain the partition: normal blocks first, always-on-top last.
		const partitionedCodeBlocks = [...codeBlocks.filter(b => !b.alwaysOnTop), ...codeBlocks.filter(b => b.alwaysOnTop)];

		store.set('codeBlockRendering.codeBlocks', partitionedCodeBlocks);

		// Center viewport on first @home block, or default to (0,0)
		const homeBlock = codeBlocks.find(block => block.isHome);
		if (homeBlock) {
			store.set('codeBlockRendering.selectedCodeBlock', homeBlock);
			const { x, y } = centerViewportOnCodeBlock(state.viewport, homeBlock, {
				alignment: homeBlock.homeAlignment,
			});
			updateViewport(state, x, y, events);
		} else {
			updateViewport(state, 0, 0, events);
		}

		events.dispatch('projectCodeBlocksPopulated');
	};

	function updateErrorMessages() {
		const codeErrors = [
			...state.codeErrors.compilationErrors,
			...state.codeErrors.editorDirectiveErrors,
			...state.codeErrors.shaderErrors,
		];
		state.codeBlockRendering.codeBlocks.forEach(codeBlock => {
			codeBlock.widgets.errorMessages = [];
			codeErrors.forEach(codeError => {
				const matchesCodeBlock = codeBlock.creationIndex === codeError.codeBlockId;

				if (matchesCodeBlock) {
					const message = wrapText(codeError.message, codeBlock.width / state.viewport.vGrid - 1).map(
						line => ' ' + line
					);

					codeBlock.widgets.errorMessages.push({
						x: 0,
						y: (gapCalculator(codeError.lineNumber, codeBlock.gaps) + 1) * state.viewport.hGrid,
						message: [' Error:', ...message],
						lineNumber: codeError.lineNumber,
					});

					updateGraphics(codeBlock);
				}
			});
		});
	}

	// When user edits code, parse @pos and update runtime position if valid
	const applyPositionFromCodeEdit = () => {
		if (!state.codeBlockRendering.selectedCodeBlock) {
			return;
		}
		const codeBlock = state.codeBlockRendering.selectedCodeBlock;
		const posResult = parsePos(codeBlock.parsedDirectives);

		// Only update position if @pos is valid
		if (posResult !== undefined) {
			codeBlock.gridX = posResult.x;
			codeBlock.gridY = posResult.y;
			if (!codeBlock.viewportAnchor) {
				// World-space block: convert grid coordinates directly to pixels.
				codeBlock.x = posResult.x * state.viewport.vGrid;
				codeBlock.y = posResult.y * state.viewport.hGrid;
			}
			// Viewport-anchored block: x/y will be recomputed by updateGraphics()
			// once width/height are up to date.
		}
	};

	updateErrorMessages();

	events.on<CodeBlockClickEvent>('codeBlockClick', onCodeBlockClick);
	events.on<CodeBlockClickEvent>('codeBlockClick', ({ codeBlock }) => updateGraphics(codeBlock));
	events.on('runtimeInitialized', updateGraphicsAll);
	events.on('spriteSheetRerendered', () => {
		state.codeBlockRendering.textureCacheEpoch += 1;
		recomputePixelCoordinatesAndUpdateGraphics();
		centerViewportOnSelectedCodeBlock();
	});
	store.subscribe('codeErrors', updateErrorMessages);
	store.subscribe('initialProjectState', populateCodeBlocks);
	store.subscribe('codeBlockRendering.codeBlocks', updateGraphicsAll);
	store.subscribe('info', updateGraphicsAll);
	store.subscribe('codeBlockRendering.selectedCodeBlock', onSelectedCodeBlockChanged);
	store.subscribe('codeBlockRendering.selectedCodeBlock.code', updateSelectedCodeBlock);
	store.subscribe('codeBlockRendering.selectedCodeBlock.code', applyPositionFromCodeEdit);
	store.subscribe('codeBlockRendering.selectedCodeBlock.cursor', updateSelectedCodeBlock);
	store.subscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code', updateProgrammaticSelectedCodeBlock);
	store.subscribe(
		'codeBlockRendering.selectedCodeBlockForProgrammaticEdit.cursor',
		updateProgrammaticSelectedCodeBlock
	);
	store.subscribe(
		'codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code',
		updateProgrammaticSelectedCodeBlockWithoutCompilerTrigger
	);
}
