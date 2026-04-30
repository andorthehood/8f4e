import parsePos from '../directives/pos/data';
import { resolveRuntimeEnvConstants } from '../../../runtime/directives';

import type { StateManager } from '@8f4e/state-manager';
import type { State, CodeBlock, CodeBlockGraphicData } from '@8f4e/editor-state-types';

const AUTO_ENV_CONSTANTS_BLOCK_NAME = 'env';
const AUTO_ENV_CONSTANTS_BLOCK_ID = `constants_${AUTO_ENV_CONSTANTS_BLOCK_NAME}`;

const isEnvBlock = (block: CodeBlockGraphicData): boolean => block.id === AUTO_ENV_CONSTANTS_BLOCK_ID;

/**
 * Generates the content for the auto-managed environment constants block.
 * This block provides runtime environment values as constants that can be used throughout the program.
 *
 * @param state - The current editor state
 * @param existingPos - Existing env block grid position from its `; @pos x y` directive. When provided, this
 * position is preserved in the regenerated block; otherwise the block defaults to `0,0`.
 * @returns Array of code lines for the constants block
 */
function generateEnvConstantsBlock(state: State, existingPos?: { x: number; y: number }): string[] {
	const lines: string[] = [];
	const pos = existingPos ?? { x: 0, y: 0 };

	// Header with warning
	lines.push(`constants ${AUTO_ENV_CONSTANTS_BLOCK_NAME}`);
	lines.push(`; @pos ${pos.x} ${pos.y}`);
	lines.push('; @favorite');
	lines.push('; Auto-generated environment constants');
	lines.push('; Changes will be overwritten');
	lines.push('');

	lines.push(...resolveRuntimeEnvConstants(state));

	// Binary asset sizes
	const binaryAssets = state.binaryAssets || [];
	const assetSizeLines: string[] = [];
	const emittedConstantNames = new Set<string>();
	for (let i = 0; i < binaryAssets.length; i++) {
		if (binaryAssets[i].assetByteLength !== undefined && binaryAssets[i].fileName) {
			const assetIdentifier = (binaryAssets[i].id || `${i}`).toUpperCase();
			const constantName = `ASSET_${assetIdentifier}_SIZE`;
			if (emittedConstantNames.has(constantName)) {
				continue;
			}
			emittedConstantNames.add(constantName);
			assetSizeLines.push(`; '${binaryAssets[i].fileName}'`);
			assetSizeLines.push(`const ${constantName} ${binaryAssets[i].assetByteLength}`);
		}
	}

	if (assetSizeLines.length > 0) {
		lines.push('');
		lines.push('; Binary asset sizes in bytes');
		lines.push(...assetSizeLines);
	}

	lines.push('');
	lines.push('constantsEnd');

	return lines;
}

/**
 * Auto-managed environment constants block effect.
 *
 * This effect automatically maintains a constants block named 'env' that contains
 * environment values like sample rate, buffer size, and binary asset sizes.
 * The env block is added to the project's codeBlocks array when the project is loaded,
 * and its content is updated in graphicHelper.codeBlocks when runtime settings or binary assets change.
 *
 * @param store - State manager instance
 */
export default function autoEnvConstants(store: StateManager<State>): void {
	function areCodeLinesEqual(a: string[], b: string[]): boolean {
		if (a.length !== b.length) {
			return false;
		}

		for (let i = 0; i < a.length; i++) {
			if (a[i] !== b[i]) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Updates the env constants block code in graphicHelper.codeBlocks.
	 * This avoids triggering an infinite loop by not modifying initialProjectState.
	 */
	function updateEnvConstantsBlockInGraphicHelper(): void {
		const state = store.getState();
		const targetBlock = state.graphicHelper.codeBlocks.find(block => isEnvBlock(block));

		if (!targetBlock) {
			return;
		}
		const existingPos = parsePos(targetBlock.parsedDirectives);
		const newCode = generateEnvConstantsBlock(state, existingPos);

		if (areCodeLinesEqual(targetBlock.code, newCode)) {
			return;
		}

		targetBlock.code = newCode;
		targetBlock.lastUpdated = performance.now();

		store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', targetBlock);
	}

	/**
	 * Ensures env block exists in project when loaded.
	 * This only runs once when the project is loaded.
	 */
	function ensureEnvBlockInProject(): void {
		const state = store.getState();

		if (!state.initialProjectState) {
			return;
		}

		// Check if env block already exists
		const hasEnvBlock = state.initialProjectState.codeBlocks.some(
			block => block.code.length > 0 && block.code[0].includes(`constants ${AUTO_ENV_CONSTANTS_BLOCK_NAME}`)
		);

		if (!hasEnvBlock) {
			// Add env block at the beginning of codeBlocks array
			const envBlock: CodeBlock = {
				code: generateEnvConstantsBlock(state),
			};

			store.set('initialProjectState', {
				...state.initialProjectState,
				codeBlocks: [envBlock, ...state.initialProjectState.codeBlocks],
			});
		}
	}

	// Ensure env block exists when project is loaded
	store.subscribe('initialProjectState', ensureEnvBlockInProject);

	// Update env block code in graphicHelper.codeBlocks when runtime config or binary assets change.
	// This avoids the infinite loop caused by modifying initialProjectState.
	store.subscribe('graphicHelper.selectedCodeBlock.code', updateEnvConstantsBlockInGraphicHelper);
	store.subscribe('editorConfig.runtime', updateEnvConstantsBlockInGraphicHelper);
	store.subscribe('runtimeRegistry', updateEnvConstantsBlockInGraphicHelper);
	store.subscribe('binaryAssets', updateEnvConstantsBlockInGraphicHelper);
}
