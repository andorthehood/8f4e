import type { CodegenContext } from '@8f4e/compiler-spec';
import { WORD_MEMORY_ACCESS_WIDTH } from '@8f4e/compiler-spec';
import {
	f32const,
	f32load,
	f64const,
	f64load,
	i32const,
	i32load,
	i32load8s,
	i32load8u,
	i32load16s,
	i32load16u,
	localGet,
} from '@8f4e/compiler-wasm-utils';
import type { PointerMetadata } from '../../utils/memoryData';
import {
	getDereferencedValueKindFromMetadata,
	getDereferencedValueWordSizeFromMetadata,
	getPointerDepthFromMetadata,
} from '../../utils/memoryData';
import { type PushValueKind, valueKindToWasmType } from '../../utils/pushValueKind';
import { guardedAddressOperation } from '../utils/memoryAccessGuard';

type PointerValueSource = 'pointer-slot' | 'pointer-value';
type PointerLoadStep = { accessByteWidth: number; loadByteCode: number[]; memoryIndex: number };

export { kindToStackItem, resolveArgumentValueKind, resolveMemoryValueKind } from '../../utils/pushValueKind';

export const constOpcode: Record<PushValueKind, (value: number) => number[]> = {
	int32: i32const,
	float32: f32const,
	float64: f64const,
};

export const loadOpcode: Record<PushValueKind, (memoryIndex: number) => number[]> = {
	int32: memoryIndex => i32load(2, 0, memoryIndex),
	float32: memoryIndex => f32load(2, 0, memoryIndex),
	float64: memoryIndex => f64load(3, 0, memoryIndex),
};

function buildGuardedPointerLoadChain(
	context: CodegenContext,
	lineNumberAfterMacroExpansion: number,
	kind: PushValueKind,
	steps: PointerLoadStep[]
): number[] {
	const resultType = valueKindToWasmType(kind);

	return steps.reduceRight<number[]>(
		(continuation, step) =>
			guardedAddressOperation(context, {
				accessByteWidth: step.accessByteWidth,
				memoryIndex: step.memoryIndex,
				lineNumberAfterMacroExpansion,
				resultType,
				buildTrueBranch: addressLocalIndex => [...localGet(addressLocalIndex), ...step.loadByteCode, ...continuation],
			}),
		[]
	);
}

function createPointerLoadStep(memoryIndex: number): PointerLoadStep {
	return {
		accessByteWidth: WORD_MEMORY_ACCESS_WIDTH,
		loadByteCode: i32load(2, 0, memoryIndex),
		memoryIndex,
	};
}

function getFinalDereferenceLoad(
	pointerMetadata: PointerMetadata,
	kind: PushValueKind,
	dereferencedValueWordSize: number,
	pointeeMemoryIndex: number
): number[] {
	if (pointerMetadata.pointeeBaseType === 'int8u') {
		return i32load8u(0, 0, pointeeMemoryIndex);
	}

	if (pointerMetadata.pointeeBaseType === 'int16u') {
		return i32load16u(1, 0, pointeeMemoryIndex);
	}

	if (dereferencedValueWordSize === 1) {
		return i32load8s(0, 0, pointeeMemoryIndex);
	}

	if (dereferencedValueWordSize === 2) {
		return i32load16s(1, 0, pointeeMemoryIndex);
	}

	return loadOpcode[kind](pointeeMemoryIndex);
}

export function buildPointerDereferenceByteCode(
	context: CodegenContext,
	lineNumberAfterMacroExpansion: number,
	pointerMetadata: PointerMetadata,
	baseAddressByteCode: number[],
	pointerValueSource: PointerValueSource,
	dereferenceDepth: number
): { kind: PushValueKind; byteCode: number[] } {
	const declaredPointerDepth = getPointerDepthFromMetadata(pointerMetadata);
	const isFinalDereference = dereferenceDepth === declaredPointerDepth;
	const kind = getDereferencedValueKindFromMetadata(pointerMetadata, dereferenceDepth);
	const dereferencedValueWordSize = getDereferencedValueWordSizeFromMetadata(pointerMetadata, dereferenceDepth);
	const pointeeMemoryIndex = 'pointeeMemoryIndex' in pointerMetadata ? (pointerMetadata.pointeeMemoryIndex ?? 0) : 0;
	const finalLoad = getFinalDereferenceLoad(pointerMetadata, kind, dereferencedValueWordSize, pointeeMemoryIndex);

	if (pointerValueSource === 'pointer-slot') {
		const slotMemoryIndex = 'memoryIndex' in pointerMetadata ? pointerMetadata.memoryIndex : 0;
		const pointerLoads = [
			...i32load(2, 0, slotMemoryIndex),
			...Array.from({ length: isFinalDereference ? dereferenceDepth - 1 : dereferenceDepth }, () =>
				i32load(2, 0, pointeeMemoryIndex)
			).flat(),
		];

		return { kind, byteCode: [...baseAddressByteCode, ...pointerLoads, ...(isFinalDereference ? finalLoad : [])] };
	}

	const guardedLoadSteps = Array.from({ length: isFinalDereference ? dereferenceDepth - 1 : dereferenceDepth }, () =>
		createPointerLoadStep(pointeeMemoryIndex)
	);
	if (isFinalDereference) {
		guardedLoadSteps.push({
			accessByteWidth: dereferencedValueWordSize,
			loadByteCode: finalLoad,
			memoryIndex: pointeeMemoryIndex,
		});
	}

	return {
		kind,
		byteCode: [
			...baseAddressByteCode,
			...buildGuardedPointerLoadChain(context, lineNumberAfterMacroExpansion, kind, guardedLoadSteps),
		],
	};
}
