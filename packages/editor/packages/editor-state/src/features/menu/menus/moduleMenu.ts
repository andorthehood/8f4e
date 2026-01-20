import type { CodeBlockGraphicData, MenuGenerator } from '~/types';

export interface OpenGroupEvent {
	codeBlock: CodeBlockGraphicData;
}

export const moduleMenu: MenuGenerator = state => {
	const blockType = state.graphicHelper.selectedCodeBlock?.blockType;
	let blockLabel = 'module';

	if (blockType === 'function') {
		blockLabel = 'function';
	} else if (blockType === 'vertexShader') {
		blockLabel = 'vertex shader';
	} else if (blockType === 'fragmentShader') {
		blockLabel = 'fragment shader';
	}

	const isDisabled = state.graphicHelper.selectedCodeBlock?.disabled ?? false;

	return [
		...(state.featureFlags.editing
			? [
					{
						title: `Delete ${blockLabel}`,
						action: 'deleteCodeBlock',
						payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
						close: true,
					},
					{
						title: isDisabled ? `Enable ${blockLabel}` : `Disable ${blockLabel}`,
						action: 'toggleCodeBlockDisabled',
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
			disabled: !state.callbacks.writeClipboardText,
		},
		{
			title: `Log ${blockLabel} info to console`,
			action: 'consoleLog',
			payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
			close: true,
		},
	];
};
