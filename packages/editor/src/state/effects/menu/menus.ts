import { MenuGenerator } from '../../types';

export const mainMenu: MenuGenerator = () => [
	{
		title: 'New Module',
		action: 'addCodeBlock',
		payload: { isNew: true },
		close: true,
	},
	{
		title: 'Paste Module',
		action: 'addCodeBlock',
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
	{ title: 'MIDI Info', action: 'openSubMenu', payload: { menu: 'midiInfoMenu' }, close: false },
];

export const midiInfoMenu: MenuGenerator = state => [
	{ title: 'Inputs:', disabled: true, isSectionTitle: true },
	...state.midi.inputs.map(input => ({
		title: `${input.name || input.id}${input.manufacturer ? ` ${input.manufacturer}` : ``}`,
		disabled: true,
	})),
	{ title: 'Outputs:', disabled: true, isSectionTitle: true },
	...state.midi.outputs.map(output => ({
		title: `${output.name || output.id}${output.manufacturer ? ` ${output.manufacturer}` : ``}`,
		disabled: true,
	})),
];

export const moduleMenu: MenuGenerator = state => [
	{
		title: 'Delete module',
		action: 'deleteCodeBlock',
		payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
		close: true,
	},
	{
		title: 'Copy module',
		action: 'copyModule',
		payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
		close: true,
	},
	{
		title: 'Open group',
		action: 'openGroup',
		payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
		close: true,
	},
];

export const moduleCategoriesMenu: MenuGenerator = state => {
	const categories = [...new Set(Object.entries(state.options.exampleModules).map(([, module]) => module.category))];
	return categories.map(category => {
		return { title: category, action: 'openSubMenu', payload: { menu: 'builtInModuleMenu', category }, close: false };
	});
};

export const builtInModuleMenu: MenuGenerator = (state, { category }: { category: string }) => {
	return Object.entries(state.options.exampleModules)
		.filter(([, module]) => module.category == category)
		.map(([, module]) => {
			return {
				title: module.title,
				action: 'addCodeBlock',
				payload: { code: module.code.split('\n') },
				close: true,
			};
		});
};

export const sampleRateMenu: MenuGenerator = () => [
	{
		title: '44100 Hz (buffered, for audio and MIDI CC)',
		action: 'setSampleRate',
		payload: { sampleRate: 44100 },
		close: true,
	},
	{
		title: '22050 Hz (buffered, for audio and MIDI CC)',
		action: 'setSampleRate',
		payload: { sampleRate: 22050 },
		close: true,
	},
	{
		title: '100 Hz (real time, for high precision MIDI timing)',
		action: 'setSampleRate',
		payload: { sampleRate: 100 },
		close: true,
	},
	{
		title: '50 Hz (real time, for high precision MIDI timing)',
		action: 'setSampleRate',
		payload: { sampleRate: 50 },
		close: true,
	},
	{ title: '1 Hz (real time, for debugging)', action: 'setSampleRate', payload: { sampleRate: 1 }, close: true },
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
	{ title: 'Set Sample Rate', action: 'openSubMenu', payload: { menu: 'sampleRateMenu' }, close: false },
];

export const editorSettingsMenu: MenuGenerator = () => [
	{
		title: 'Theme',
		action: 'openSubMenu',
		payload: { menu: 'colorSchemeMenu' },
		close: false,
	},
	{
		title: 'Font',
		action: 'openSubMenu',
		payload: { menu: 'fontMenu' },
		close: false,
	},
];

export const colorSchemeMenu: MenuGenerator = () => [
	{ title: 'Hackerman', action: 'setColorScheme', payload: { colorScheme: 'hackerman' }, close: false },
	{ title: 'Red Alert', action: 'setColorScheme', payload: { colorScheme: 'redalert' }, close: false },
	{ title: 'Default', action: 'setColorScheme', payload: { colorScheme: 'default' }, close: false },
];

export const fontMenu: MenuGenerator = () => [
	{ title: '8x16', action: 'setFont', payload: { font: '8x16' }, close: false },
	{ title: '6x10', action: 'setFont', payload: { font: '6x10' }, close: false },
];

export const exampleProjectMenu: MenuGenerator = state =>
	Object.entries(state.options.exampleProjects).map(([key, project]) => ({
		title: project.title,
		action: 'loadProject',
		payload: { project },
		close: true,
	}));
