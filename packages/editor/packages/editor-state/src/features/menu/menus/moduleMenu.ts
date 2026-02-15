import { isSkipExecutionDirective } from '@8f4e/compiler/syntax';
import parseFavorite from '../../code-blocks/features/favorites/codeParser';

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

	// Check if module has #skipExecution directive
	const hasSkipExecutionDirective =
		blockType === 'module' &&
		state.graphicHelper.selectedCodeBlock?.code.some((line: string) => isSkipExecutionDirective(line));

	// Check if code block has ; @favorite directive
	const hasFavoriteDirective =
		state.graphicHelper.selectedCodeBlock && parseFavorite(state.graphicHelper.selectedCodeBlock.code);

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
					...(blockType === 'module'
						? [
								{
									title: hasSkipExecutionDirective ? 'Unskip module' : 'Skip module',
									action: 'toggleModuleSkipExecutionDirective',
									payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
									close: true,
								},
							]
						: []),
					{
						title: hasFavoriteDirective ? 'Unfavorite' : 'Favorite',
						action: 'toggleFavoriteDirective',
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
