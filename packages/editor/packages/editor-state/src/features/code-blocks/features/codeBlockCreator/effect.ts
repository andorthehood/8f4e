import { instructionParser } from '@8f4e/compiler/syntax';
import { getModuleId } from '@8f4e/compiler/syntax';
import { getFunctionId } from '@8f4e/compiler/syntax';

import { insertDependencies } from './insertDependencies';
import { pasteMultipleBlocks } from './pasteMultipleBlocks';

import { parseClipboardData } from '../clipboard/clipboardUtils';
import getCodeBlockId from '../../utils/getCodeBlockId';
import upsertPos from '../position/upsertPos';
import upsertDisabled from '../disabled/upsertDisabled';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, EventDispatcher } from '~/types';

const nameList = [
	'quark',
	'electron',
	'positron',
	'muon',
	'tau',
	'neutrino',
	'photon',
	'gluon',
	'boson',
	'lepton',
	'axion',
	'curvaton',
	'dilaton',
	'graviton',
	'inflaton',
	'majoron',
	'preon',
	'tachyon',
	'pion',
	'baryon',
	'proton',
	'neutron',
	'nucleon',
	'kaon',
	'meson',
	'hadron',
	'dropleton',
	'anyon',
	'exciton',
	'fracton',
	'magnon',
	'plasmon',
	'polariton',
	'polaron',
	'roton',
	'trion',
];

function getRandomCodeBlockId() {
	return nameList[Math.floor(Math.random() * nameList.length)];
}

function checkIfCodeBlockIdIsTaken(state: State, id: string) {
	return state.graphicHelper.codeBlocks.some(codeBlock => {
		return codeBlock.id === id;
	});
}

function changeCodeBlockIdInCode(code: string[], instruction: string, id: string) {
	return code.map(line => {
		const match = line.match(instructionParser) as RegExpMatchArray | null;
		if (match && match[1] === instruction && match[2]) {
			// Reconstruct line with new ID, preserving spacing and everything after the ID
			const beforeInstruction = line.slice(0, match.index!);
			const matchedInstruction = match[1];
			const spacingAfterInstruction = line.slice(
				match.index! + matchedInstruction.length,
				line.indexOf(match[2], match.index!)
			);
			const afterOldId = line.slice(line.indexOf(match[2], match.index!) + match[2].length);
			return beforeInstruction + matchedInstruction + spacingAfterInstruction + id + afterOldId;
		}
		return line;
	});
}

function incrementCodeBlockId(id: string) {
	if (/.*[0-9]+$/gm.test(id)) {
		const [, trailingNumber] = id.match(/.*([0-9]+$)/) as [never, string];
		return id.replace(new RegExp(trailingNumber + '$'), `${parseInt(trailingNumber, 10) + 1}`);
	} else {
		return id + '2';
	}
}

function incrementCodeBlockIdUntilUnique(state: State, blockId: string) {
	while (checkIfCodeBlockIdIsTaken(state, blockId)) {
		blockId = incrementCodeBlockId(blockId);
	}
	return blockId;
}

export default function codeBlockCreator(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();
	async function onAddCodeBlock({
		x,
		y,
		isNew,
		blockType,
		code = [''],
	}: {
		x: number;
		y: number;
		isNew: boolean;
		blockType?: 'module' | 'function' | 'vertexShader' | 'fragmentShader' | 'comment';
		code?: string[];
	}) {
		if (!state.featureFlags.editing) {
			return;
		}

		const hasExplicitCode = code.length > 1 || (code.length === 1 && code[0].trim().length > 0);

		if (isNew && !hasExplicitCode) {
			if (blockType === 'function') {
				code = ['function ' + getRandomCodeBlockId(), '', '', 'functionEnd'];
			} else if (blockType === 'vertexShader') {
				code = ['vertexShader', '', '', 'vertexShaderEnd'];
			} else if (blockType === 'fragmentShader') {
				code = ['fragmentShader', '', '', 'fragmentShaderEnd'];
			} else if (blockType === 'comment') {
				code = ['comment', '', '', 'commentEnd'];
			} else {
				code = ['module ' + getRandomCodeBlockId(), '', '', 'moduleEnd'];
			}
		} else if (code.length < 2) {
			// If no callback is provided, fail silently
			if (!state.callbacks.readClipboardText) {
				return;
			}

			try {
				const clipboardText = await state.callbacks.readClipboardText();
				const parsedData = parseClipboardData(clipboardText);

				if (parsedData.type === 'multi') {
					// Multi-block paste
					pasteMultipleBlocks(store, { x, y, blocks: parsedData.blocks });
					return;
				} else {
					// Single-block paste
					code = parsedData.text.split('\n');
				}
			} catch {
				// Fail silently if clipboard read fails
				return;
			}
		}

		// Update ID based on block type
		const moduleId = getModuleId(code);
		const functionId = getFunctionId(code);

		if (functionId) {
			code = changeCodeBlockIdInCode(code, 'function', incrementCodeBlockIdUntilUnique(state, functionId));
		} else if (moduleId) {
			code = changeCodeBlockIdInCode(code, 'module', incrementCodeBlockIdUntilUnique(state, moduleId));
		}

		const creationIndex = state.graphicHelper.nextCodeBlockCreationIndex;
		state.graphicHelper.nextCodeBlockCreationIndex++;

		// Calculate grid position
		const gridX = Math.round((state.viewport.x + x) / state.viewport.vGrid);
		const gridY = Math.round((state.viewport.y + y) / state.viewport.hGrid);

		// Add canonical @pos directive to code
		code = upsertPos(code, gridX, gridY);

		const codeBlock: CodeBlockGraphicData = {
			width: 0,
			height: 0,
			code,
			codeColors: [],
			codeToRender: [],
			extras: {
				blockHighlights: [],
				inputs: [],
				outputs: [],
				debuggers: [],
				switches: [],
				buttons: [],
				sliders: [],
				pianoKeyboards: [],
				bufferPlotters: [],
				bufferScanners: [],
				errorMessages: [],
			},
			cursor: { col: 0, row: 0, x: 0, y: 0 },
			id: getCodeBlockId(code),
			gaps: new Map(),
			gridX,
			gridY,
			x: state.viewport.x + x,
			y: state.viewport.y + y,
			lineNumberColumnWidth: 2,
			offsetX: 0,
			lastUpdated: Date.now(),
			offsetY: 0,
			creationIndex,
			blockType: 'unknown', // Will be updated by blockTypeUpdater effect
			disabled: false,
			isHome: false,
		};

		store.set('graphicHelper.codeBlocks', [...state.graphicHelper.codeBlocks, codeBlock]);
	}

	function onDeleteCodeBlock({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		if (!state.featureFlags.editing) {
			return;
		}

		store.set(
			'graphicHelper.codeBlocks',
			state.graphicHelper.codeBlocks.filter(block => block !== codeBlock)
		);
	}

	function onCopyCodeBlock({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		// Use callback if available, otherwise fail silently
		if (state.callbacks.writeClipboardText) {
			state.callbacks.writeClipboardText(codeBlock.code.join('\n')).catch(() => {
				// Fail silently if clipboard write fails
				return undefined;
			});
		}
	}

	function onToggleCodeBlockDisabled({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		if (!state.featureFlags.editing) {
			return;
		}

		// Toggle disabled state by upserting/removing @disabled directive
		const newDisabledState = !codeBlock.disabled;
		codeBlock.code = upsertDisabled(codeBlock.code, newDisabledState);
		codeBlock.disabled = newDisabledState;
		// Update lastUpdated to invalidate cache
		codeBlock.lastUpdated = Date.now();
		// Use selectedCodeBlockForProgrammaticEdit to trigger graphics update
		store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', codeBlock);
	}

	async function onAddCodeBlockBySlug({
		codeBlockSlug,
		x,
		y,
	}: {
		codeBlockSlug: string;
		x: number;
		y: number;
	}): Promise<void> {
		if (!state.callbacks.getModule) {
			console.warn('No getCodeBlock callback provided');
			return;
		}

		// Load the requested module
		const requestedModule = await state.callbacks.getModule(codeBlockSlug);

		// Add the requested module at the clicked position
		const requestedCode = requestedModule.code.split('\n');
		onAddCodeBlock({ code: requestedCode, x, y, isNew: false });

		// If the module has dependencies, insert them to the right
		if (requestedModule.dependencies && requestedModule.dependencies.length > 0) {
			await insertDependencies({
				dependencies: requestedModule.dependencies,
				getModule: state.callbacks.getModule,
				requestedModuleCode: requestedCode,
				clickX: x,
				clickY: y,
				state,
				onAddCodeBlock,
			});
		}
	}

	events.on('addCodeBlockBySlug', onAddCodeBlockBySlug);
	events.on('addCodeBlock', onAddCodeBlock);
	events.on('copyCodeBlock', onCopyCodeBlock);
	events.on('deleteCodeBlock', onDeleteCodeBlock);
	events.on('toggleCodeBlockDisabled', onToggleCodeBlockDisabled);
}
