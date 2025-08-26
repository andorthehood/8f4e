import { Instruction, instructionParser } from '@8f4e/compiler';

import { EventDispatcher } from '../../../events';
import { getModuleId } from '../../helpers/codeParsers';
import { CodeBlockGraphicData, State } from '../../types';

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
	return Array.from(state.graphicHelper.activeViewport.codeBlocks).some(codeBlock => {
		return codeBlock.id === id;
	});
}

function changeModuleIdInCode(code: string[], id: string) {
	return code.map(line => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, Instruction, string, string];
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
	async function onAddCodeBlock({ x, y, isNew, code = [''] }) {
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
			x: state.graphicHelper.activeViewport.viewport.x + x,
			y: state.graphicHelper.activeViewport.viewport.y + y,
			gridX: Math.round((state.graphicHelper.activeViewport.viewport.x + x) / state.graphicHelper.globalViewport.vGrid),
			gridY: Math.round((state.graphicHelper.activeViewport.viewport.y + y) / state.graphicHelper.globalViewport.hGrid),
			isOpen: true,
			padLength: 2,
			offsetX: 0,
			offsetY: 0,
			parent: state.graphicHelper.activeViewport,
			codeBlocks: new Set(),
			viewport: {
				x: 0,
				y: 0,
			},
		};

		state.graphicHelper.activeViewport.codeBlocks.add(codeBlock);
		events.dispatch('codeBlockAdded', { codeBlock });
		events.dispatch('saveState');
	}

	function onDeleteCodeBlock({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		state.graphicHelper.activeViewport.codeBlocks.delete(codeBlock);
		events.dispatch('saveState');
	}

	function onCopyCodeBlock({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		navigator.clipboard.writeText(codeBlock.code.join('\n'));
	}

	events.on('addCodeBlock', onAddCodeBlock);
	events.on('copyCodeBlock', onCopyCodeBlock);
	events.on('deleteCodeBlock', onDeleteCodeBlock);

	// Handle lazy loading of example modules
	events.on('addExampleModule', async ({ moduleKey }: { moduleKey: string }) => {
		const moduleWrapper = state.options.exampleModules[moduleKey];
		if (moduleWrapper && moduleWrapper.code) {
			const code = await moduleWrapper.code;
			// Use the same parameters as other module additions
			await onAddCodeBlock({ x: 0, y: 0, isNew: false, code: code.split('\n') });
		}
	});
}
