import type { CodeBlockGraphicData, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import upsertPos from '../code-blocks/features/directives/pos/upsert';
import { deriveDirectiveState } from '../code-blocks/features/directives/registry';
import getBlockType from '../code-blocks/utils/codeParsers/getBlockType';
import { createCodeBlockGraphicData } from '../code-blocks/utils/createCodeBlockGraphicData';
import {
	type GridBounds,
	getCodeBlockGridBounds,
	getCodeBlockGridSizeFromCode,
	placeCodeBlockAtFirstFreeGridY,
} from '../code-blocks/utils/finders/findFirstFreeCodeBlockGridY';
import getCodeBlockId from '../code-blocks/utils/getCodeBlockId';
import { parseBlockDirectives } from '../code-blocks/utils/parseBlockDirectives';
import {
	DEFAULT_BROWSER_LOCAL_NOTE,
	isBrowserLocalNoteBlock,
	isBrowserLocalNoteCode,
	serializeBrowserLocalNotes,
} from './browserLocalNotes';

export default function browserLocalNotes(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();
	let lastSavedBrowserLocalNotes = '';
	let browserLocalNotesLoaded = false;

	async function populateBrowserLocalNotes() {
		if (!state.initialProjectState || !state.callbacks.loadBrowserLocalNotes) {
			return;
		}

		try {
			const loadedBlocks = (await state.callbacks.loadBrowserLocalNotes()) ?? [];
			const validBlocks = loadedBlocks.filter(block => isBrowserLocalNoteCode(block.code));
			const browserLocalNotes = validBlocks.length > 0 ? validBlocks : [DEFAULT_BROWSER_LOCAL_NOTE];

			const nextCodeBlocks = [...state.codeBlockRendering.codeBlocks];
			const occupiedBounds: GridBounds[] = nextCodeBlocks
				.filter(existingCodeBlock => existingCodeBlock.viewportAnchor === undefined)
				.map(existingCodeBlock => getCodeBlockGridBounds(existingCodeBlock, state.viewport));
			let creationIndex = state.codeBlockRendering.nextCodeBlockCreationIndex;

			for (const rawBlock of browserLocalNotes) {
				const preferredGridX = rawBlock.gridCoordinates?.x ?? 0;
				const preferredGridY = rawBlock.gridCoordinates?.y ?? 0;
				const parsedDirectives = parseBlockDirectives(rawBlock.code);
				const directiveState = deriveDirectiveState(rawBlock.code, parsedDirectives);
				const blockType = getBlockType(rawBlock.code) as CodeBlockGraphicData['blockType'];
				const isViewportAnchored = directiveState.blockState.viewportAnchor !== undefined;
				const codeBlock = createCodeBlockGraphicData({
					name: getCodeBlockId(rawBlock.code),
					code: rawBlock.code,
					disabled: directiveState.blockState.disabled,
					hidden: directiveState.blockState.hidden,
					isHome: directiveState.blockState.isHome,
					homeAlignment: directiveState.blockState.homeAlignment,
					isFavorite: directiveState.blockState.isFavorite,
					opacity: directiveState.blockState.opacity,
					alwaysOnTop: directiveState.blockState.alwaysOnTop ?? false,
					viewportAnchor: directiveState.blockState.viewportAnchor,
					parsedDirectives,
					creationIndex,
					blockType,
					gridX: preferredGridX,
					gridY: preferredGridY,
					x: isViewportAnchored ? 0 : preferredGridX * state.viewport.vGrid,
					y: isViewportAnchored ? 0 : preferredGridY * state.viewport.hGrid,
				});

				if (!isViewportAnchored) {
					const targetSize = getCodeBlockGridSizeFromCode(codeBlock);
					const placement = placeCodeBlockAtFirstFreeGridY(
						{
							x: codeBlock.gridX,
							y: codeBlock.gridY,
							width: targetSize.width,
							height: targetSize.height,
						},
						occupiedBounds
					);

					codeBlock.gridX = placement.gridX;
					codeBlock.gridY = placement.gridY;
					codeBlock.x = placement.gridX * state.viewport.vGrid;
					codeBlock.y = placement.gridY * state.viewport.hGrid;
					codeBlock.code = upsertPos(codeBlock.code, placement.gridX, placement.gridY);
					occupiedBounds.push({
						x: placement.gridX,
						y: placement.gridY,
						width: targetSize.width,
						height: targetSize.height,
					});
				}

				nextCodeBlocks.push(codeBlock);

				creationIndex += 1;
			}

			state.codeBlockRendering.nextCodeBlockCreationIndex = creationIndex;
			browserLocalNotesLoaded = true;
			store.set('codeBlockRendering.codeBlocks', nextCodeBlocks);
			saveBrowserLocalNotes();
		} catch (err) {
			console.warn('Failed to load browser-local notes from storage:', err);
		}
	}

	function saveBrowserLocalNotes() {
		if (!browserLocalNotesLoaded || !state.callbacks.saveBrowserLocalNotes) {
			return;
		}

		const serializedBlocks = serializeBrowserLocalNotes(state.codeBlockRendering.codeBlocks);
		const nextSnapshot = JSON.stringify(serializedBlocks);
		if (nextSnapshot === lastSavedBrowserLocalNotes) {
			return;
		}

		lastSavedBrowserLocalNotes = nextSnapshot;
		state.callbacks.saveBrowserLocalNotes(serializedBlocks);
	}

	function saveSelectedBrowserLocalNote() {
		if (!isBrowserLocalNoteBlock(state.codeBlockRendering.selectedCodeBlock)) {
			return;
		}

		saveBrowserLocalNotes();
	}

	function saveProgrammaticallyEditedBrowserLocalNote() {
		if (!isBrowserLocalNoteBlock(state.codeBlockRendering.selectedCodeBlockForProgrammaticEdit)) {
			return;
		}

		saveBrowserLocalNotes();
	}

	function saveProgrammaticallyEditedBrowserLocalNoteWithoutCompilerTrigger() {
		if (!isBrowserLocalNoteBlock(state.codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger)) {
			return;
		}

		saveBrowserLocalNotes();
	}

	function saveAfterLocalNoteDelete({ codeBlock }: { codeBlock: CodeBlockGraphicData }) {
		if (!isBrowserLocalNoteBlock(codeBlock)) {
			return;
		}

		saveBrowserLocalNotes();
	}

	function saveAfterGroupDelete() {
		saveBrowserLocalNotes();
	}

	events.on('projectCodeBlocksPopulated', populateBrowserLocalNotes);
	events.on('deleteCodeBlock', saveAfterLocalNoteDelete);
	events.on('deleteGroup', saveAfterGroupDelete);
	store.subscribe('codeBlockRendering.selectedCodeBlock.code', saveSelectedBrowserLocalNote);
	store.subscribe(
		'codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code',
		saveProgrammaticallyEditedBrowserLocalNote
	);
	store.subscribe(
		'codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code',
		saveProgrammaticallyEditedBrowserLocalNoteWithoutCompilerTrigger
	);
}
