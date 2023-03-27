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

		state.project.modules.push({
			code,
			x: x - state.project.viewport.x,
			y: y - state.project.viewport.y,
			isOpen: true,
		});

		events.dispatch('saveState');
	}

	function onDeleteModule({ module }: { module: Module }): void {
		events.dispatch('deleteConnection', { module });
		state.project.modules.splice(state.project.modules.indexOf(module), 1);
	}

	function onCopyModule({ module }: { module: Module }): void {
		navigator.clipboard.writeText(module.code.join('\n'));
	}

	events.on('addModule', onAddModule);
	events.on('copyModule', onCopyModule);
	events.on('deleteModule', onDeleteModule);
}
