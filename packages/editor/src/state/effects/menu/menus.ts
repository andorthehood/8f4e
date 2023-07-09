import { MenuGenerator } from '../../types';
import bistableMultivibratorsProject from '../../examples/projects/bistableMultivibrators';
import audioBufferProject from '../../examples/projects/audioBuffer';
import exampleModules from '../../examples/modules';

const modules = {
	'Logic Gates': ['AND', 'OR', 'NAND', 'NOR', 'XOR'],
	Bitwise: ['Bitwise And', 'Bitwise Or', 'Bitwise NAND', 'Bitwise NOR', 'Bitwise XOR'],
	Sequencers: { 'Binary Sequencer': 'binarySequencer' },
	MIDI: {
		'MIDI Note In': 'midiNoteIn',
		'MIDI Note Out': 'midiNoteOut',
		'MIDI CC In': 'midiCCIn',
		'MIDI CC Out': 'midiCCOut',
		'MIDI Codes': 'midiCodes',
	},
	'Audio Buffer': {
		'Audio Buffer Out Mono': 'audioBufferOut',
		'Audio Buffer Out Stereo': 'audioBufferOut',
		'Audio Buffer In': 'audioBufferOut',
	},
	Quantizers: { Quantizer: 'quantizer' },
} as const;

export const mainMenu: MenuGenerator = () => [
	{
		title: 'New Module',
		action: 'addModule',
		payload: { isNew: true },
		close: true,
	},
	{
		title: 'Paste Module',
		action: 'addModule',
		payload: { isPaste: true },
		close: true,
	},
	{
		title: 'Add Built-in Module',
		action: 'openSubMenu',
		payload: { menu: 'moduleCategoriesMenu' },
		close: false,
	},
	{ divider: true },
	{ title: 'New Project', action: 'new', close: true },
	{ divider: true },
	{ title: 'Open From Disk', action: 'open', close: true },
	{ title: 'Open Example Project', action: 'openSubMenu', payload: { menu: 'exampleProjectMenu' }, close: false },
	{ divider: true },
	{ title: 'Export Project', action: 'save', close: true },
	{ divider: true },
	{ title: 'Editor Settings', action: 'openSubMenu', payload: { menu: 'editorSettingsMenu' }, close: false },
	{ title: 'Project Settings', action: 'openSubMenu', payload: { menu: 'projectSettingsMenu' }, close: false },
	{ divider: true },
];

export const moduleMenu: MenuGenerator = state => [
	{
		title: 'Delete module',
		action: 'deleteModule',
		payload: { module: state.graphicHelper.selectedModule },
		close: true,
	},
	{ title: 'Copy module', action: 'copyModule', payload: { module: state.graphicHelper.selectedModule }, close: true },
];

export const moduleCategoriesMenu: MenuGenerator = () => {
	const categories = Object.keys(modules);
	return categories.map(category => {
		return { title: category, action: 'openSubMenu', payload: { menu: 'builtInModuleMenu', category }, close: false };
	});
};

export const builtInModuleMenu: MenuGenerator = (state, { category }: { category: string }) => {
	return Object.keys(modules[category]).map(module => {
		const code = exampleModules[modules[category][module]] || '';

		return {
			title: module,
			action: 'addModule',
			payload: { code: code.split('\n') },
			close: true,
		};
	});
};

export const sampleRateMenu: MenuGenerator = () => [
	{ title: '44100', action: 'setSampleRate', payload: { sampleRate: 44100 }, close: true },
	{ title: '22050', action: 'setSampleRate', payload: { sampleRate: 22050 }, close: true },
	{ title: '11025', action: 'setSampleRate', payload: { sampleRate: 11025 }, close: true },
];

export const projectSettingsMenu: MenuGenerator = () => [
	{
		title: 'Import RNBO patch',
		action: 'importRNBOPatch',
		close: true,
	},
	{
		title: 'Remove RNBO patches',
		action: 'removeRNBOPatches',
		close: true,
	},
	{ title: 'Set Sample Rate', action: 'openSubMenu', payload: { menu: 'sampleRateMenu ' }, close: false },
];

export const editorSettingsMenu: MenuGenerator = () => [
	{
		title: 'Theme',
		action: 'openSubMenu',
		payload: { menu: 'colorSchemeMenu' },
		close: false,
	},
];

export const colorSchemeMenu: MenuGenerator = () => [
	{ title: 'Hackerman', action: 'setColorScheme', payload: { colorScheme: 'hackerman' }, close: false },
	{ title: 'Red Alert', action: 'setColorScheme', payload: { colorScheme: 'redalert' }, close: false },
	{ title: 'Default', action: 'setColorScheme', payload: { colorScheme: 'default' }, close: false },
];

export const exampleProjectMenu: MenuGenerator = () => [
	{
		title: 'Bistable Multivibrators',
		action: 'loadProject',
		payload: { project: bistableMultivibratorsProject },
		close: true,
	},
	{ title: 'Audio Buffer', action: 'loadProject', payload: { project: audioBufferProject }, close: true },
];
