import type { StateManager } from '@8f4e/state-manager';
import type { State, CodeBlock, CodeBlockGraphicData } from '~/types';

const AUTO_ENV_CONSTANTS_BLOCK_ID = 'env';

const isEnvBlock = (block: CodeBlockGraphicData): boolean =>
	block.blockType === 'constants' && block.id === AUTO_ENV_CONSTANTS_BLOCK_ID;

/**
 * Generates the content for the auto-managed environment constants block.
 * This block provides runtime environment values as constants that can be used throughout the program.
 *
 * @param state - The current editor state
 * @returns Array of code lines for the constants block
 */
function generateEnvConstantsBlock(state: State): string[] {
	const lines: string[] = [];

	// Header with warning
	lines.push(`constants ${AUTO_ENV_CONSTANTS_BLOCK_ID}`);
	lines.push('; Auto-generated environment constants');
	lines.push('; Changes will be overwritten');
	lines.push('; Last updated: ' + new Date().toLocaleString());
	lines.push('');

	// Built-in compiler constants
	lines.push('const WORD_SIZE 4');
	lines.push('');

	// Sample rate from runtime config
	const sampleRate = state.compiledConfig.runtimeSettings[state.compiledConfig.selectedRuntime]?.sampleRate ?? 50;
	lines.push(`const SAMPLE_RATE ${sampleRate}`);

	// Audio buffer size (hardcoded for now, matching current behavior)
	lines.push('const AUDIO_BUFFER_SIZE 128');

	// Binary asset sizes
	const binaryAssets = state.binaryAssets || [];
	const assetSizeLines: string[] = [];
	for (let i = 0; i < binaryAssets.length; i++) {
		if (binaryAssets[i].assetByteLength !== undefined && binaryAssets[i].fileName) {
			// Convert to a valid constant name
			const constantName = `ASSET_${i}_SIZE`;
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
	/**
	 * Updates the env constants block code in graphicHelper.codeBlocks.
	 * This avoids triggering an infinite loop by not modifying initialProjectState.
	 */
	function updateEnvConstantsBlockInGraphicHelper(): void {
		const state = store.getState();

		const newCode = generateEnvConstantsBlock(state);
		const targetBlock = state.graphicHelper.codeBlocks.find(block => isEnvBlock(block));

		if (!targetBlock) {
			return;
		}

		state.graphicHelper.selectedCodeBlockForProgrammaticEdit = targetBlock;

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
			block => block.code.length > 0 && block.code[0].includes(`constants ${AUTO_ENV_CONSTANTS_BLOCK_ID}`)
		);

		if (!hasEnvBlock) {
			// Add env block at the beginning of codeBlocks array
			const envBlock: CodeBlock = {
				code: generateEnvConstantsBlock(state),
				gridCoordinates: { x: 0, y: 0 },
			};

			store.set('initialProjectState', {
				...state.initialProjectState,
				codeBlocks: [envBlock, ...state.initialProjectState.codeBlocks],
			});
		}
	}

	// Ensure env block exists when project is loaded
	store.subscribe('initialProjectState', ensureEnvBlockInProject);

	// Update env block code in graphicHelper.codeBlocks when config or binary assets change
	// This avoids the infinite loop caused by modifying initialProjectState
	store.subscribe('compiledConfig', updateEnvConstantsBlockInGraphicHelper);
	store.subscribe('binaryAssets', updateEnvConstantsBlockInGraphicHelper);
}
