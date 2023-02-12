import { EventDispatcher } from '../../../events';
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
	async function onAddModule({ x, y, isNew }) {
		let code = [''];

		if (isNew) {
			code = ['module ' + getModuleName(), '', '', ''];
		} else {
			code = (await navigator.clipboard.readText()).split('\n');
		}

		state.modules.push({
			code,
			x: x - state.viewport.x,
			y: y - state.viewport.y,
			isOpen: true,
		});
	}

	function onDeleteModule({ module }: { module: Module }): void {
		events.dispatch('deleteConnection', { module, replaceHistory: true });
		state.modules.splice(state.modules.indexOf(module), 1);
	}

	function onCopyModule({ module }: { module: Module }): void {
		navigator.clipboard.writeText(module.code.join('\n'));
	}

	events.on('addModule', onAddModule);
	events.on('copyModule', onCopyModule);
	events.on('deleteModule', onDeleteModule);
}
