import { isSkipExecutionDirective } from '@8f4e/compiler/syntax';

import { getGroupBlocks, getGroupModuleBlocks } from '../../code-blocks/features/group/getGroupBlocks';
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

	// Check if code block has a group name and compute group skip/sticky status
	const groupName = state.graphicHelper.selectedCodeBlock?.groupName;
	const hasGroup = !!groupName;
	let allGroupBlocksSkipped = false;
	let allGroupBlocksSticky = false;

	if (hasGroup) {
		// Find all blocks in the same group for sticky check
		const groupBlocks = getGroupBlocks(state.graphicHelper.codeBlocks, groupName);
		// Check if all group blocks have sticky flag
		allGroupBlocksSticky = groupBlocks.every((block: CodeBlockGraphicData) => block.groupSticky);

		if (blockType === 'module') {
			// Find all module blocks in the same group
			const groupModuleBlocks = getGroupModuleBlocks(state.graphicHelper.codeBlocks, groupName);
			// Check if all group module blocks have #skipExecution directive
			allGroupBlocksSkipped = groupModuleBlocks.every((block: CodeBlockGraphicData) =>
				block.code.some((line: string) => isSkipExecutionDirective(line))
			);
		}
	}

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
					...(blockType === 'module' && hasGroup
						? [
								{
									title: allGroupBlocksSkipped ? 'Unskip group' : 'Skip group',
									action: 'toggleGroupSkipExecutionDirective',
									payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
									close: true,
								},
							]
						: []),
					...(hasGroup
						? [
								{
									title: 'Remove from group',
									action: 'removeFromGroupDirective',
									payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
									close: true,
								},
								{
									title: `Ungroup "${groupName}"`,
									action: 'ungroupByName',
									payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
									close: true,
								},
								{
									title: allGroupBlocksSticky ? 'Make Group Non-Sticky' : 'Make Group Sticky',
									action: 'toggleGroupSticky',
									payload: {
										codeBlock: state.graphicHelper.selectedCodeBlock,
										makeSticky: !allGroupBlocksSticky,
									},
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
		...(hasGroup
			? [
					{
						title: 'Copy group',
						action: 'copyGroupBlocks',
						payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
						close: true,
						disabled: !state.callbacks.writeClipboardText,
					},
				]
			: []),
		{
			title: `Log ${blockLabel} info to console`,
			action: 'consoleLog',
			payload: { codeBlock: state.graphicHelper.selectedCodeBlock },
			close: true,
		},
	];
};
