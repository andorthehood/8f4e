import type { CodeBlockGraphicData, MenuGenerator } from '../../types';

export const mainMenu: MenuGenerator = state => [
	...(state.graphicHelper.activeViewport !== state.graphicHelper.activeViewport.parent
		? [
				{
					title: 'Go back',
					action: 'goBack',
					close: true,
				},
				{ divider: true },
				// eslint-disable-next-line
		]
		: []),
	// Only show editing options if editing is enabled
	...(state.featureFlags.editing
		? [
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
					disabled: !state.options.getListOfModules,
				},
				{ divider: true },
				{ title: 'Import binary asset', action: 'importBinaryAsset', close: true },
			]
		: []),
	{ title: 'Binary assets', action: 'openSubMenu', payload: { menu: 'binaryAssetsMenu' }, close: false },
	...(state.featureFlags.editing ? [{ divider: true }] : []),
	...(state.featureFlags.editing ? [{ title: 'New Project', action: 'new', close: true }, { divider: true }] : []),
	{ title: 'Open From Disk', action: 'open', close: true, disabled: !state.options.loadProjectFromFile },
	{
		title: 'Open Project',
		action: 'openSubMenu',
		payload: { menu: 'projectMenu' },
		close: false,
		disabled: !state.options.getListOfProjects,
	},
	{ divider: true },
	{ title: 'Export Project', action: 'save', close: true, disabled: !state.options.exportFile },
	{
		title: 'Export Runtime-Ready Project',
		action: 'saveRuntimeReady',
		close: true,
		disabled: !state.compiler.codeBuffer || state.compiler.codeBuffer.length === 0 || !state.options.exportFile,
	},
	{
		title: 'Export WebAssembly',
		action: 'exportWasm',
		close: true,
		disabled: !state.compiler.codeBuffer || state.compiler.codeBuffer.length === 0 || !state.options.exportFile,
	},
	{ divider: true },
	{ title: 'Editor Settings', action: 'openSubMenu', payload: { menu: 'editorSettingsMenu' }, close: false },
	{ title: 'Project Settings', action: 'openSubMenu', payload: { menu: 'projectSettingsMenu' }, close: false },
	{ divider: true },
	{ title: 'MIDI Info', action: 'openSubMenu', payload: { menu: 'midiInfoMenu' }, close: false },
];

export const binaryAssetsMenu: MenuGenerator = async () => {
	const opfsRoot = await navigator.storage.getDirectory();
	const entries = (opfsRoot as unknown as { entries: () => AsyncIterator<[string, FileSystemFileHandle]> }).entries();
	const asyncIterableEntries = {
		[Symbol.asyncIterator]: () => entries,
	};
	const files: [string, FileSystemFileHandle][] = await Array.fromAsync(asyncIterableEntries);

	return files.map(([name, file]) => ({
		title: name,
		action: 'openBinaryAsset',
		payload: { file },
		close: true,
	}));
};

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

export interface OpenGroupEvent {
	codeBlock: CodeBlockGraphicData;
}

export const moduleMenu: MenuGenerator = state => [
	// Only show delete option if editing is enabled
	...(state.featureFlags.editing
		? [
				{
					title: 'Delete module',
					action: 'deleteCodeBlock',
					payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
					close: true,
				},
			]
		: []),
	{
		title: 'Copy module',
		action: 'copyCodeBlock',
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

export const moduleCategoriesMenu: MenuGenerator = async state => {
	const modules = await state.options.getListOfModules();
	const categories = [...new Set(modules.map(module => module.category))];
	return categories.map(category => {
		return { title: category, action: 'openSubMenu', payload: { menu: 'builtInModuleMenu', category }, close: false };
	});
};

export const builtInModuleMenu: MenuGenerator = async (state, payload = {}) => {
	const { category } = payload as { category: string };
	const modules = await state.options.getListOfModules();
	const filteredModules = modules.filter(module => module.category === category);

	const menuItems = [];
	for (const moduleMetadata of filteredModules) {
		const module = await state.options.getModule(moduleMetadata.slug);
		menuItems.push({
			title: module.title,
			action: 'addCodeBlock',
			payload: { code: module.code.split('\n') },
			close: true,
		});
	}
	return menuItems;
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
	{ title: 'Set Sample Rate', action: 'openSubMenu', payload: { menu: 'sampleRateMenu' }, close: false },
	{ title: 'Configure Audio I/O', action: 'openSubMenu', payload: { menu: 'configureAudioIO' }, close: false },
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

export const projectMenu: MenuGenerator = async state => {
	const projects = await state.options.getListOfProjects();
	const menuItems = [];
	for (const projectMetadata of projects) {
		const project = await state.options.getProject(projectMetadata.slug);
		menuItems.push({
			title: project.title,
			action: 'loadProject',
			payload: { project },
			close: true,
		});
	}
	return menuItems;
};
