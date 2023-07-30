import { Instruction, instructionParser } from '@8f4e/compiler';

import { EventDispatcher } from '../../../events';
import { getModuleId } from '../../helpers/codeParsers';
import { ModuleGraphicData, State } from '../../types';

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
	return Array.from(state.graphicHelper.modules).some(module => {
		return module.id === id;
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
	if (/.*[0-9]+/gm.test(id)) {
		const [, trailingNumber] = id.match(/.*([0-9]+)/) as [never, string];
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

export default function moduleCreator(state: State, events: EventDispatcher): void {
	async function onAddModule({ x, y, isNew, code = [''] }) {
		if (isNew) {
			code = ['module ' + getRandomModuleId(), '', '', 'end'];
		} else if (code.length < 2) {
			code = (await navigator.clipboard.readText()).split('\n');
		}

		code = changeModuleIdInCode(code, incrementModuleIdUntilItsNotTaken(state, getModuleId(code)));

		const module: ModuleGraphicData = {
			width: 0,
			height: 0,
			code,
			codeWithLineNumbers: [],
			codeColors: [],
			codeToRender: [],
			inputs: new Map(),
			outputs: new Map(),
			debuggers: new Map(),
			switches: new Map(),
			buttons: new Map(),
			bufferPlotters: new Map(),
			cursor: { col: 0, row: 0, x: 0, y: 0 },
			id: getModuleId(code) || '',
			gaps: new Map(),
			errorMessages: new Map(),
			x: state.graphicHelper.viewport.x + x,
			y: state.graphicHelper.viewport.y + y,
			isOpen: true,
			isGroup: false,
			padLength: 2,
			offsetX: 0,
			offsetY: 0,
		};

		state.graphicHelper.modules.add(module);
		events.dispatch('moduleAdded', { module });
		events.dispatch('saveState');
	}

	function onDeleteModule({ module }: { module: ModuleGraphicData }): void {
		state.graphicHelper.modules.delete(module);
		events.dispatch('saveState');
	}

	function onCopyModule({ module }: { module: ModuleGraphicData }): void {
		navigator.clipboard.writeText(module.code.join('\n'));
	}

	events.on('addModule', onAddModule);
	events.on('copyModule', onCopyModule);
	events.on('deleteModule', onDeleteModule);
}
