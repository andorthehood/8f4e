import { WASM_TYPE_F32, WASM_TYPE_I32, WASM_TYPE_VOID } from '@8f4e/compiler-wasm-utils';
import { BlockType } from '@8f4e/compiler-spec';

import type { WasmTypeValue } from '@8f4e/compiler-wasm-utils';
import type { BlockStack } from '@8f4e/compiler-spec';

type ResultType = 'float' | 'int' | null | undefined;
type ResultBlockType = typeof BlockType.BLOCK | typeof BlockType.CONDITION;

interface ResultBlockState<TBlockType extends ResultBlockType> {
	blockState: Extract<BlockStack[number], { blockType: TBlockType }>;
	wasmType: WasmTypeValue;
}

/**
 * Creates the compiler block-stack metadata and matching WASM block result type.
 */
export default function createResultBlockState<TBlockType extends ResultBlockType>(
	resultType: ResultType,
	blockType: TBlockType
): ResultBlockState<TBlockType> {
	if (resultType === 'float') {
		return {
			blockState: {
				expectedResultIsInteger: false,
				hasExpectedResult: true,
				blockType,
			} as Extract<BlockStack[number], { blockType: TBlockType }>,
			wasmType: WASM_TYPE_F32,
		};
	}

	if (resultType === 'int') {
		return {
			blockState: {
				expectedResultIsInteger: true,
				hasExpectedResult: true,
				blockType,
			} as Extract<BlockStack[number], { blockType: TBlockType }>,
			wasmType: WASM_TYPE_I32,
		};
	}

	return {
		blockState: {
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType,
		} as Extract<BlockStack[number], { blockType: TBlockType }>,
		wasmType: WASM_TYPE_VOID,
	};
}
