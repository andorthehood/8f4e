import instructionParser from './codeBlockDecorators/instructionParser';

import { EventDispatcher } from '../../types';
import { getModuleId } from '../../helpers/codeParsers';

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

function getRandomModuleId() {
	return nameList[Math.floor(Math.random() * nameList.length)];
}

function checkIfModuleIdIsTaken(state: State, id: string) {
	return Array.from(state.graphicHelper.codeBlocks).some(codeBlock => {
		return codeBlock.id === id;
	});
}

function changeModuleIdInCode(code: string[], id: string) {
	return code.map(line => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, string, string];
		if (instruction === 'module') {
			return line.replace(args[0], id);
		}
		return line;
	});
}

function incrementModuleId(id: string) {
	if (/.*[0-9]+$/gm.test(id)) {
		const [, trailingNumber] = id.match(/.*([0-9]+$)/) as [never, string];
		return id.replace(new RegExp(trailingNumber + '$'), `${parseInt(trailingNumber, 10) + 1}`);
	} else {
		return id + '2';
	}
}

function incrementModuleIdUntilItsNotTaken(state: State, moduleId: string) {
	while (checkIfModuleIdIsTaken(state, moduleId)) {
		moduleId = incrementModuleId(moduleId);
	}
	return moduleId;
}

export default function codeBlockCreator(state: State, events: EventDispatcher): void {
	async function onAddCodeBlock({
		x,
		y,
		isNew,
		code = [''],
	}: {
		x: number;
		y: number;
		isNew: boolean;
		code?: string[];
	}) {
		// Check if editing is enabled
		if (!state.featureFlags.editing) {
			return;
		}

		if (isNew) {
			code = ['module ' + getRandomModuleId(), '', '', 'moduleEnd'];
		} else if (code.length < 2) {
			code = (await navigator.clipboard.readText()).split('\n');
		}

		code = changeModuleIdInCode(code, incrementModuleIdUntilItsNotTaken(state, getModuleId(code)));

		const codeBlock: CodeBlockGraphicData = {
			width: 0,
			minGridWidth: 32,
			height: 0,
			code,
			trimmedCode: code,
			codeColors: [],
			codeToRender: [],
			extras: {
				blockHighlights: [],
				inputs: new Map(),
				outputs: new Map(),
				debuggers: new Map(),
				switches: new Map(),
				buttons: new Map(),
				pianoKeyboards: new Map(),
				bufferPlotters: new Map(),
				errorMessages: new Map(),
			},
			cursor: { col: 0, row: 0, x: 0, y: 0 },
			id: getModuleId(code) || '',
			gaps: new Map(),
			x: state.graphicHelper.viewport.x + x,
			y: state.graphicHelper.viewport.y + y,
			gridX: Math.round((state.graphicHelper.viewport.x + x) / state.graphicHelper.viewport.vGrid),
			gridY: Math.round((state.graphicHelper.viewport.y + y) / state.graphicHelper.viewport.hGrid),
			padLength: 2,
			offsetX: 0,
			lastUpdated: Date.now(),
			offsetY: 0,
		};

		state.graphicHelper.codeBlocks.add(codeBlock);
		events.dispatch('codeBlockAdded', { codeBlock });
	}

	function onDeleteCodeBlock({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		// Check if editing is enabled
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
