import { Type } from '@8f4e/compiler-wasm-utils';

import type { BLOCK_TYPE, BlockStack } from '@8f4e/compiler-spec';

type ResultType = 'float' | 'int' | null | undefined;

export interface ResultBlockState {
	blockState: BlockStack[number];
	wasmType: Type;
}

/**
 * Creates the compiler block-stack metadata and matching WASM block result type.
 */
export default function createResultBlockState(resultType: ResultType, blockType: BLOCK_TYPE): ResultBlockState {
	if (resultType === 'float') {
		return {
			blockState: {
				expectedResultIsInteger: false,
				hasExpectedResult: true,
				blockType,
			},
			wasmType: Type.F32,
		};
	}

	if (resultType === 'int') {
		return {
			blockState: {
				expectedResultIsInteger: true,
				hasExpectedResult: true,
				blockType,
			},
			wasmType: Type.I32,
		};
	}

	return {
		blockState: {
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType,
		},
		wasmType: Type.VOID,
	};
}
