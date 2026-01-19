import type { StateManager } from '@8f4e/state-manager';
import type { State } from '~/types';

const AUTO_ENV_CONSTANTS_BLOCK_ID = 'env';

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
	lines.push('');
	lines.push('// Auto-generated environment constants - changes will be overwritten');
	lines.push('');

	// Sample rate from runtime config
	const sampleRate = state.compiledConfig.runtimeSettings[state.compiledConfig.selectedRuntime]?.sampleRate ?? 50;
	lines.push(`const SAMPLE_RATE ${sampleRate}`);

	// Audio buffer size (hardcoded for now, matching current behavior)
	lines.push('const AUDIO_BUFFER_SIZE 128');

	// Channel constants
	lines.push('const LEFT_CHANNEL 0');
	lines.push('const RIGHT_CHANNEL 1');

	// Binary asset sizes
	const binaryAssets = state.binaryAssets || [];
	if (binaryAssets.length > 0) {
		lines.push('');
		lines.push('// Binary asset sizes in bytes');
		for (const asset of binaryAssets) {
			if (asset.sizeBytes !== undefined && asset.memoryId) {
				// Convert memoryId to a valid constant name (uppercase, replace special chars with underscore)
				const constantName = `${asset.memoryId.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}_SIZE`;
				lines.push(`const ${constantName} ${asset.sizeBytes}`);
			}
		}
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
 * The block is always ordered first (creationIndex 0) and is regenerated when
 * runtime settings or binary assets change.
 *
 * @param store - State manager instance
 */
export default function autoEnvConstants(store: StateManager<State>): void {
	const state = store.getState();

	/**
	 * Creates or updates the auto-managed env constants block.
	 * Ensures it has the lowest creationIndex to be compiled first.
	 */
	function ensureEnvConstantsBlock(): void {
		const newCode = generateEnvConstantsBlock(state);
		const existingBlockIndex = state.graphicHelper.codeBlocks.findIndex(
			block => block.id === AUTO_ENV_CONSTANTS_BLOCK_ID
		);

		if (existingBlockIndex >= 0) {
			// Update existing block
			const existingBlock = state.graphicHelper.codeBlocks[existingBlockIndex];

			// Check if code has actually changed to avoid unnecessary updates
			const codeChanged = JSON.stringify(existingBlock.code) !== JSON.stringify(newCode);

			if (codeChanged) {
				const updatedBlocks = [...state.graphicHelper.codeBlocks];
				updatedBlocks[existingBlockIndex] = {
					...existingBlock,
					code: newCode,
					lastUpdated: Date.now(),
				};
				store.set('graphicHelper.codeBlocks', updatedBlocks);
			}
		} else {
			// Create new block
			// Insert at the beginning with creationIndex 0
			const newBlock = {
				width: 0,
				minGridWidth: 32,
				height: 0,
				code: newCode,
				codeColors: [],
				codeToRender: [],
				extras: {
					blockHighlights: [],
					inputs: [],
					outputs: [],
					debuggers: [],
					switches: [],
					buttons: [],
					pianoKeyboards: [],
					bufferPlotters: [],
					errorMessages: [],
				},
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				id: AUTO_ENV_CONSTANTS_BLOCK_ID,
				gaps: new Map(),
				gridX: 0,
				gridY: 0,
				x: 0,
				y: 0,
				lineNumberColumnWidth: 2,
				offsetX: 0,
				lastUpdated: Date.now(),
				offsetY: 0,
				creationIndex: 0,
				blockType: 'constants' as const,
			};

			// Increment all existing blocks' creationIndex
			const updatedBlocks = state.graphicHelper.codeBlocks.map(block => ({
				...block,
				creationIndex: block.creationIndex + 1,
			}));

			// Add new block at the beginning
			store.set('graphicHelper.codeBlocks', [newBlock, ...updatedBlocks]);
		}
	}

	// Initialize the env constants block on first load
	ensureEnvConstantsBlock();

	// Update when config changes (which includes runtime settings and binary assets)
	store.subscribe('compiledConfig', ensureEnvConstantsBlock);

	// Update when binary assets change (to include asset sizes)
	store.subscribe('binaryAssets', ensureEnvConstantsBlock);
}
