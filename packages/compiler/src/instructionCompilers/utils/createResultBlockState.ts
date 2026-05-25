import { WASM_TYPE_F32, WASM_TYPE_I32, WASM_TYPE_VOID } from '@8f4e/compiler-wasm-utils';

import type { WasmTypeValue } from '@8f4e/compiler-wasm-utils';
import type { BlockStack, BlockTypeValue } from '@8f4e/compiler-spec';

type ResultType = 'float' | 'int' | null | undefined;

interface ResultBlockState {
	blockState: BlockStack[number];
	wasmType: WasmTypeValue;
}

/**
 * Creates the compiler block-stack metadata and matching WASM block result type.
 */
export default function createResultBlockState(resultType: ResultType, blockType: BlockTypeValue): ResultBlockState {
	if (resultType === 'float') {
		return {
			blockState: {
				expectedResultIsInteger: false,
				hasExpectedResult: true,
				blockType,
			},
			wasmType: WASM_TYPE_F32,
		};
	}

	if (resultType === 'int') {
		return {
			blockState: {
				expectedResultIsInteger: true,
				hasExpectedResult: true,
				blockType,
			},
			wasmType: WASM_TYPE_I32,
		};
	}

	return {
		blockState: {
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType,
		},
		wasmType: WASM_TYPE_VOID,
	};
}
