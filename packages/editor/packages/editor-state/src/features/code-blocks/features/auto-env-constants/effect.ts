import type { StateManager } from '@8f4e/state-manager';
import type { State, CodeBlock } from '~/types';

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

	// Built-in compiler constants
	lines.push('const I16_SIGNED_LARGEST_NUMBER 32767');
	lines.push('const I16_SIGNED_SMALLEST_NUMBER -32768');
	lines.push('const I32_SIGNED_LARGEST_NUMBER 2147483647');
	lines.push('const WORD_SIZE 4');
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
	const assetSizeLines: string[] = [];
	for (const asset of binaryAssets) {
		if (asset.sizeBytes !== undefined && asset.memoryId) {
			// Convert memoryId to a valid constant name (uppercase, replace special chars with underscore)
			const constantName = `${asset.memoryId.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}_SIZE`;
			assetSizeLines.push(`const ${constantName} ${asset.sizeBytes}`);
		}
	}

	if (assetSizeLines.length > 0) {
		lines.push('');
		lines.push('// Binary asset sizes in bytes');
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
 * and its content is updated when runtime settings or binary assets change.
 *
 * @param store - State manager instance
 */
export default function autoEnvConstants(store: StateManager<State>): void {
	/**
	 * Ensures the env constants block exists in the project and updates its code.
	 */
	function updateEnvConstantsBlock(): void {
		const state = store.getState();

		if (!state.initialProjectState) {
			return;
		}

		const newCode = generateEnvConstantsBlock(state);
		const existingBlockIndex = state.initialProjectState.codeBlocks.findIndex(
			block => block.code.length > 0 && block.code[0].includes(`constants ${AUTO_ENV_CONSTANTS_BLOCK_ID}`)
		);

		if (existingBlockIndex >= 0) {
			// Update existing block's code
			const updatedCodeBlocks = [...state.initialProjectState.codeBlocks];
			updatedCodeBlocks[existingBlockIndex] = {
				...updatedCodeBlocks[existingBlockIndex],
				code: newCode,
			};
			store.set('initialProjectState', {
				...state.initialProjectState,
				codeBlocks: updatedCodeBlocks,
			});
		}
	}

	/**
	 * Ensures env block exists in project when loaded.
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

	// Update env block code when config or binary assets change
	store.subscribe('compiledConfig', updateEnvConstantsBlock);
	store.subscribe('binaryAssets', updateEnvConstantsBlock);
}
