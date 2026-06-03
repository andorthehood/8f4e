import type { BlockResultTypes, BlockStack, BlockType, FunctionTypeRegistry } from '@8f4e/compiler-spec';

import type { WasmTypeValue } from '@8f4e/compiler-wasm-utils';
import { signedLEB128, WASM_TYPE_F32, WASM_TYPE_I32, WASM_TYPE_VOID } from '@8f4e/compiler-wasm-utils';
import { getOrRegisterFunctionType } from './functionTypeRegistry';

type ResultBlockType = typeof BlockType.BLOCK | typeof BlockType.CONDITION;

interface ResultBlockState<TBlockType extends ResultBlockType> {
	blockState: Extract<BlockStack[number], { blockType: TBlockType }>;
	wasmBlockType: number[];
}

function resultTypeToWasmType(resultType: BlockResultTypes[number]): WasmTypeValue {
	return resultType === 'float' ? WASM_TYPE_F32 : WASM_TYPE_I32;
}

/**
 * Creates the compiler block-stack metadata and matching WASM block result type.
 *
 * @param resultTypes - Result types expected from the block.
 * @param blockType - Project block type to inspect.
 * @param typeRegistry - Function type registry used for multi-value result signatures.
 * @returns Created result block state.
 */
export default function createResultBlockState<TBlockType extends ResultBlockType>(
	resultTypes: BlockResultTypes,
	blockType: TBlockType,
	typeRegistry?: FunctionTypeRegistry
): ResultBlockState<TBlockType> {
	if (resultTypes.length > 1) {
		if (!typeRegistry) {
			throw new Error('Missing function type registry for multi-result block.');
		}

		const resultWasmTypes = resultTypes.map(resultTypeToWasmType);
		const typeIndex = getOrRegisterFunctionType(typeRegistry, {
			params: [],
			results: resultWasmTypes,
		});

		return {
			blockState: {
				expectedResultTypes: resultTypes,
				blockType,
			} as Extract<BlockStack[number], { blockType: TBlockType }>,
			wasmBlockType: signedLEB128(typeIndex),
		};
	}

	if (resultTypes[0] === 'float') {
		return {
			blockState: {
				expectedResultTypes: resultTypes,
				blockType,
			} as Extract<BlockStack[number], { blockType: TBlockType }>,
			wasmBlockType: [WASM_TYPE_F32],
		};
	}

	if (resultTypes[0] === 'int') {
		return {
			blockState: {
				expectedResultTypes: resultTypes,
				blockType,
			} as Extract<BlockStack[number], { blockType: TBlockType }>,
			wasmBlockType: [WASM_TYPE_I32],
		};
	}

	return {
		blockState: {
			expectedResultTypes: [],
			blockType,
		} as Extract<BlockStack[number], { blockType: TBlockType }>,
		wasmBlockType: [WASM_TYPE_VOID],
	};
}
