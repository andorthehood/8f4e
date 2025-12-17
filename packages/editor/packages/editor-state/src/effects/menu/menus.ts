import { buildCategoryTree, findNodeByPath } from './categoryTree';

import type { CodeBlockGraphicData, MenuGenerator, ContextMenuItem } from '../../types';

export const mainMenu: MenuGenerator = state => [
	...(state.featureFlags.editing
		? [
				{
					title: 'New Module',
					action: 'addCodeBlock',
					payload: { isNew: true, blockType: 'module' },
					close: true,
				},
				{
					title: 'New Function',
					action: 'addCodeBlock',
					payload: { isNew: true, blockType: 'function' },
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
					disabled: !state.callbacks.getListOfModules,
				},
				{ divider: true },
				{
					title: 'Import binary asset',
					action: 'importBinaryFile',
					close: true,
					disabled: !state.callbacks.importBinaryFile,
				},
			]
		: []),
	{ title: 'Binary assets', action: 'openSubMenu', payload: { menu: 'binaryAssetsMenu' }, close: false },
	...(state.featureFlags.editing ? [{ divider: true }] : []),
	...(state.featureFlags.editing ? [{ title: 'New Project', action: 'new', close: true }, { divider: true }] : []),
	{ title: 'Open From Disk', action: 'importProject', close: true, disabled: !state.callbacks.importProject },
	{
		title: 'Open Project',
		action: 'openSubMenu',
		payload: { menu: 'projectCategoriesMenu' },
		close: false,
		disabled: !state.callbacks.getListOfProjects,
	},
	{ divider: true },
	{ title: 'Export Project', action: 'exportProject', close: true, disabled: !state.callbacks.exportProject },
	{
		title: 'Export Runtime-Ready Project',
		action: 'exportRuntimeReadyProject',
		close: true,
		disabled: !state.compiler.codeBuffer || state.compiler.codeBuffer.length === 0 || !state.callbacks.exportProject,
	},
	{
		title: 'Export WebAssembly',
		action: 'exportWasm',
		close: true,
		disabled: !state.compiler.codeBuffer || state.compiler.codeBuffer.length === 0 || !state.callbacks.exportBinaryFile,
	},
	{ divider: true },
	{ title: 'Editor Settings', action: 'openSubMenu', payload: { menu: 'editorSettingsMenu' }, close: false },
	{ title: 'Project Settings', action: 'openSubMenu', payload: { menu: 'projectSettingsMenu' }, close: false },
	{ divider: true },
	{ title: 'MIDI Info', action: 'openSubMenu', payload: { menu: 'midiInfoMenu' }, close: false },
];

export const binaryAssetsMenu: MenuGenerator = async () => {
	const opfsRoot = await navigator.storage.getDirectory();
	const entries = (
		opfsRoot as unknown as { entries: () => AsyncIterableIterator<[string, FileSystemFileHandle]> }
	).entries();

	const files: [string, FileSystemFileHandle][] = [];
	for await (const [name, file] of entries) {
		files.push([name, file]);
	}

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

export const moduleMenu: MenuGenerator = state => {
	const blockType = state.graphicHelper.selectedCodeBlock?.blockType;
	const blockLabel = blockType === 'function' ? 'function' : 'module';

	return [
		...(state.featureFlags.editing
			? [
					{
						title: `Delete ${blockLabel}`,
						action: 'deleteCodeBlock',
						payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
						close: true,
					},
				]
			: []),
		{
			title: `Copy ${blockLabel}`,
			action: 'copyCodeBlock',
			payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
			close: true,
		},
		{
			title: `Log ${blockLabel} info to console`,
			action: 'consoleLog',
			payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
			close: true,
		},
	];
};

export const moduleCategoriesMenu: MenuGenerator = async (state, payload = {}) => {
	if (!state.callbacks.getListOfModules) {
		return [];
	}

	const { categoryPath = '' } = payload as { categoryPath?: string };
	const modules = await state.callbacks.getListOfModules();
	const tree = buildCategoryTree(modules);

	// Find the current node in the tree
	const currentNode = findNodeByPath(tree, categoryPath);
	if (!currentNode) {
		return [];
	}

	const menuItems: ContextMenuItem[] = [];

	// Add submenu items for child categories
	for (const childNode of currentNode.children) {
		menuItems.push({
			title: childNode.label,
			action: 'openSubMenu',
			payload: { menu: 'moduleCategoriesMenu', categoryPath: childNode.path },
			close: false,
		});
	}

	// Add leaf items (modules) at this level
	for (const item of currentNode.items) {
		menuItems.push({
			title: item.title,
			action: 'addCodeBlockBySlug',
			payload: { codeBlockSlug: item.slug },
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

export const editorSettingsMenu: MenuGenerator = state => [
	{
		title: 'Theme',
		action: 'openSubMenu',
		payload: { menu: 'colorSchemeMenu' },
		close: false,
		disabled: Object.keys(state.colorSchemes).length === 0,
	},
	{
		title: 'Font',
		action: 'openSubMenu',
		payload: { menu: 'fontMenu' },
		close: false,
	},
];

export const colorSchemeMenu: MenuGenerator = state => {
	return state.colorSchemes.map(key => ({
		title: key,
		selector: 'editorSettings.colorScheme',
		value: key,
		close: false,
	}));
};

export const fontMenu: MenuGenerator = () => [
	{ title: '8x16', selector: 'editorSettings.font', value: '8x16', close: false },
	{ title: '6x10', selector: 'editorSettings.font', value: '6x10', close: false },
];

export const projectCategoriesMenu: MenuGenerator = async (state, payload = {}) => {
	if (!state.callbacks.getListOfProjects || !state.callbacks.getProject) {
		return [];
	}

	const { categoryPath = '' } = payload as { categoryPath?: string };
	const projects = await state.callbacks.getListOfProjects();
	const tree = buildCategoryTree(projects);

	// Find the current node in the tree
	const currentNode = findNodeByPath(tree, categoryPath);
	if (!currentNode) {
		return [];
	}

	const menuItems: ContextMenuItem[] = [];

	// Add submenu items for child categories
	for (const childNode of currentNode.children) {
		menuItems.push({
			title: childNode.label,
			action: 'openSubMenu',
			payload: { menu: 'projectCategoriesMenu', categoryPath: childNode.path },
			close: false,
		});
	}

	// Add leaf items (projects) at this level
	for (const item of currentNode.items) {
		menuItems.push({
			title: item.title,
			action: 'loadProjectBySlug',
			payload: { projectSlug: item.slug },
			close: true,
		});
	}

	return menuItems;
};
