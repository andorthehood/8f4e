import { instructionParser } from '@8f4e/syntax-rules';

import { EventDispatcher } from '../../types';
import getModuleId from '../../pureHelpers/codeParsers/getModuleId';
import getFunctionId from '../../pureHelpers/codeParsers/getFunctionId';

import type { CodeBlockGraphicData, State } from '../../types';

export interface CodeBlockAddedEvent {
	codeBlock: CodeBlockGraphicData;
}

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
	return Array.from(state.graphicHelper.codeBlocks).some(codeBlock => {
		return codeBlock.id === id;
	});
}

function changeModuleIdInCode(code: string[], id: string) {
	return code.map(line => {
		const match = line.match(instructionParser) as RegExpMatchArray | null;
		if (match && match[1] === 'module' && match[2]) {
			// Reconstruct line with new ID, preserving spacing and everything after the ID
			const beforeInstruction = line.slice(0, match.index!);
			const instruction = match[1];
			const spacingAfterInstruction = line.slice(
				match.index! + instruction.length,
				line.indexOf(match[2], match.index!)
			);
			const afterOldId = line.slice(line.indexOf(match[2], match.index!) + match[2].length);
			return beforeInstruction + instruction + spacingAfterInstruction + id + afterOldId;
		}
		return line;
	});
}

function changeFunctionIdInCode(code: string[], id: string) {
	return code.map(line => {
		const match = line.match(instructionParser) as RegExpMatchArray | null;
		if (match && match[1] === 'function' && match[2]) {
			// Reconstruct line with new ID, preserving spacing and everything after the ID
			const beforeInstruction = line.slice(0, match.index!);
			const instruction = match[1];
			const spacingAfterInstruction = line.slice(
				match.index! + instruction.length,
				line.indexOf(match[2], match.index!)
			);
			const afterOldId = line.slice(line.indexOf(match[2], match.index!) + match[2].length);
			return beforeInstruction + instruction + spacingAfterInstruction + id + afterOldId;
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

export default function codeBlockCreator(state: State, events: EventDispatcher): void {
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
		blockType?: 'module' | 'function';
		code?: string[];
	}) {
		if (!state.featureFlags.editing) {
			return;
		}

		if (isNew) {
			if (blockType === 'function') {
				code = ['function ' + getRandomCodeBlockId(), '', '', 'functionEnd'];
			} else {
				code = ['module ' + getRandomCodeBlockId(), '', '', 'moduleEnd'];
			}
		} else if (code.length < 2) {
			code = (await navigator.clipboard.readText()).split('\n');
		}

		// Update ID based on block type
		const moduleId = getModuleId(code);
		const functionId = getFunctionId(code);

		if (functionId) {
			code = changeFunctionIdInCode(code, incrementCodeBlockIdUntilUnique(state, functionId));
		} else if (moduleId) {
			code = changeModuleIdInCode(code, incrementCodeBlockIdUntilUnique(state, moduleId));
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
			id: getFunctionId(code) || getModuleId(code) || '',
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

		state.graphicHelper.codeBlocks.add(codeBlock);
		events.dispatch('codeBlockAdded', { codeBlock });
	}

	function onDeleteCodeBlock({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		if (!state.featureFlags.editing) {
			return;
		}

		state.graphicHelper.codeBlocks.delete(codeBlock);
	}

	function onCopyCodeBlock({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		navigator.clipboard.writeText(codeBlock.code.join('\n'));
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
