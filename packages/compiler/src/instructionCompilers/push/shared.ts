import {
	f32const,
	f32load,
	f64const,
	f64load,
	i32const,
	i32load,
	i32load16s,
	i32load8s,
	localGet,
} from '@8f4e/compiler-wasm-utils';
import { WORD_MEMORY_ACCESS_WIDTH } from '@8f4e/compiler-spec';

import {
	getDereferencedValueWordSize,
	resolvePointerTargetValueKind,
	valueKindToWasmType,
	type PushValueKind,
} from '../../utils/pushValueKind';
import { guardedAddressOperation } from '../utils/memoryAccessGuard';

import type { CodegenContext } from '@8f4e/compiler-spec';
import type { PointerMetadata } from '../../utils/memoryData';

type PointerValueSource = 'pointer-slot' | 'pointer-value';
type PointerLoadStep = { accessByteWidth: number; loadByteCode: number[]; memoryIndex: number };

export {
	kindToStackItem,
	resolveArgumentValueKind,
	resolveMemoryValueKind,
	resolvePointerTargetValueKind,
} from '../../utils/pushValueKind';

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

export function buildPointerDereferenceByteCode(
	context: CodegenContext,
	lineNumberAfterMacroExpansion: number,
	pointerMetadata: PointerMetadata,
	baseAddressByteCode: number[],
	pointerValueSource: PointerValueSource
): { kind: PushValueKind; byteCode: number[] } {
	const kind = resolvePointerTargetValueKind(pointerMetadata);
	const dereferencedValueWordSize = getDereferencedValueWordSize(pointerMetadata);
	const slotMemoryIndex =
		pointerValueSource === 'pointer-slot' && 'memoryIndex' in pointerMetadata ? pointerMetadata.memoryIndex : 0;
	const pointeeMemoryIndex = 'pointeeMemoryIndex' in pointerMetadata ? (pointerMetadata.pointeeMemoryIndex ?? 0) : 0;
	const finalLoad =
		dereferencedValueWordSize === 1
			? i32load8s(0, 0, pointeeMemoryIndex)
			: dereferencedValueWordSize === 2
				? i32load16s(1, 0, pointeeMemoryIndex)
				: loadOpcode[kind](pointeeMemoryIndex);

	const pointerLoadCount =
		pointerValueSource === 'pointer-slot'
			? pointerMetadata.isPointingToPointer
				? 2
				: 1
			: pointerMetadata.isPointingToPointer
				? 1
				: 0;

	const byteCode = [...baseAddressByteCode];
	const guardedLoadSteps: PointerLoadStep[] = [];
	for (let i = 0; i < pointerLoadCount; i++) {
		const memoryIndex = i === 0 && pointerValueSource === 'pointer-slot' ? slotMemoryIndex : pointeeMemoryIndex;
		const pointerLoad = i32load(2, 0, memoryIndex);
		if (i === 0 && pointerValueSource === 'pointer-slot') {
			byteCode.push(...pointerLoad);
		} else {
			guardedLoadSteps.push({
				accessByteWidth: WORD_MEMORY_ACCESS_WIDTH,
				loadByteCode: pointerLoad,
				memoryIndex,
			});
		}
	}
	guardedLoadSteps.push({
		accessByteWidth: dereferencedValueWordSize,
		loadByteCode: finalLoad,
		memoryIndex: pointeeMemoryIndex,
	});
	byteCode.push(...buildGuardedPointerLoadChain(context, lineNumberAfterMacroExpansion, kind, guardedLoadSteps));

	return { kind, byteCode };
}
