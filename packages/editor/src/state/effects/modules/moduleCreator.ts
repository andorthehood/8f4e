import { EventDispatcher } from '../../../events';
import { getModuleId } from '../../helpers/codeParsers';
import { Module, State } from '../../types';

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

function getModuleName() {
	return nameList[Math.floor(Math.random() * nameList.length)];
}

export default function moduleCreator(state: State, events: EventDispatcher): void {
	async function onAddModule({ x, y, isNew, isGroup }) {
		let code = [''];

		if (isNew) {
			if (isGroup) {
				code = ['group ' + getModuleName(), '', '', 'end'];
			} else {
				code = ['module ' + getModuleName(), '', '', 'end'];
			}
		} else {
			code = (await navigator.clipboard.readText()).split('\n');
		}

		state.graphicHelper.modules.add({
			width: 0,
			height: 0,
			code,
			codeWithLineNumbers: [],
			codeColors: [],
			inputs: new Map(),
			outputs: new Map(),
			debuggers: new Map(),
			switches: new Map(),
			scopes: new Map(),
			cursor: { col: 0, row: 0, x: 0, y: 0 },
			id: getModuleId(code) || '',
			gaps: new Map(),
			errorMessages: new Map(),
			x: x - state.project.viewport.x,
			y: y - state.project.viewport.y,
			isOpen: true,
			isGroup: !!isGroup,
			padLength: 2,
		});
		events.dispatch('saveState');
	}

	function onDeleteModule({ module }: { module: Module }): void {
		state.graphicHelper.modules.delete(module);
		events.dispatch('saveState');
	}

	function onCopyModule({ module }: { module: Module }): void {
		navigator.clipboard.writeText(module.code.join('\n'));
	}

	events.on('addModule', onAddModule);
	events.on('copyModule', onCopyModule);
	events.on('deleteModule', onDeleteModule);
}
