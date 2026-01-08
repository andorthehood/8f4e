import { instructionParser } from '@8f4e/compiler/syntax';
import { getModuleId } from '@8f4e/compiler/syntax';
import { getFunctionId } from '@8f4e/compiler/syntax';

import getVertexShaderId from '../../pureHelpers/shaderUtils/getVertexShaderId';
import getFragmentShaderId from '../../pureHelpers/shaderUtils/getFragmentShaderId';
import { EventDispatcher } from '../../types';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State } from '../../types';

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

		if (isNew) {
			if (blockType === 'function') {
				code = ['function ' + getRandomCodeBlockId(), '', '', 'functionEnd'];
			} else if (blockType === 'vertexShader') {
				code = ['vertexShader ' + getRandomCodeBlockId(), '', '', 'vertexShaderEnd'];
			} else if (blockType === 'fragmentShader') {
				code = ['fragmentShader ' + getRandomCodeBlockId(), '', '', 'fragmentShaderEnd'];
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
				code = clipboardText.split('\n');
			} catch {
				// Fail silently if clipboard read fails
				return;
			}
		}

		// Update ID based on block type
		const moduleId = getModuleId(code);
		const functionId = getFunctionId(code);
		const vertexShaderId = getVertexShaderId(code);
		const fragmentShaderId = getFragmentShaderId(code);

		if (functionId) {
			code = changeCodeBlockIdInCode(code, 'function', incrementCodeBlockIdUntilUnique(state, functionId));
		} else if (moduleId) {
			code = changeCodeBlockIdInCode(code, 'module', incrementCodeBlockIdUntilUnique(state, moduleId));
		} else if (vertexShaderId) {
			code = changeCodeBlockIdInCode(code, 'vertexShader', incrementCodeBlockIdUntilUnique(state, vertexShaderId));
		} else if (fragmentShaderId) {
			code = changeCodeBlockIdInCode(code, 'fragmentShader', incrementCodeBlockIdUntilUnique(state, fragmentShaderId));
		}

		const creationIndex = state.graphicHelper.nextCodeBlockCreationIndex;
		state.graphicHelper.nextCodeBlockCreationIndex++;

		const codeBlock: CodeBlockGraphicData = {
			width: 0,
			minGridWidth: 32,
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
				pianoKeyboards: [],
				bufferPlotters: [],
				errorMessages: [],
			},
			cursor: { col: 0, row: 0, x: 0, y: 0 },
			id: getFunctionId(code) || getModuleId(code) || getVertexShaderId(code) || getFragmentShaderId(code) || '',
			gaps: new Map(),
			gridX: Math.round((state.graphicHelper.viewport.x + x) / state.graphicHelper.viewport.vGrid),
			gridY: Math.round((state.graphicHelper.viewport.y + y) / state.graphicHelper.viewport.hGrid),
			x: state.graphicHelper.viewport.x + x,
			y: state.graphicHelper.viewport.y + y,
			lineNumberColumnWidth: 2,
			offsetX: 0,
			lastUpdated: Date.now(),
			offsetY: 0,
			creationIndex,
			blockType: 'unknown', // Will be updated by blockTypeUpdater effect
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
		const codeBlock = await state.callbacks.getModule(codeBlockSlug);
		onAddCodeBlock({ code: codeBlock.code.split('\n'), x, y, isNew: false });
	}

	events.on('addCodeBlockBySlug', onAddCodeBlockBySlug);
	events.on('addCodeBlock', onAddCodeBlock);
	events.on('copyCodeBlock', onCopyCodeBlock);
	events.on('deleteCodeBlock', onDeleteCodeBlock);
}
