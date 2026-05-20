import { i32const } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../../utils/saveByteCode';
import { getDataStructure } from '../../../utils/memoryData';
import { kindToStackItem, loadOpcode, resolveMemoryValueKind } from '../shared';
import { getMemoryRegionFields } from '../../../semantic/memoryRegions';

import type { CompilationContext, PushIdentifierLine } from '@8f4e/compiler-spec';

export default function pushMemoryIdentifier(
	line: PushIdentifierLine,
	context: CompilationContext
): CompilationContext {
	const memory = context.namespace.memory;
	const memoryItem = getDataStructure(memory, line.arguments[0].value)!;

	const kind = resolveMemoryValueKind(memoryItem);
	const pointeeAddress = memoryItem.pointeeBaseType
		? getMemoryRegionFields(memoryItem.pointeeMemoryIndex ?? 0, memoryItem.pointeeMemoryRegionName)
		: undefined;
	context.stack.push(
		kindToStackItem(kind, {
			isNonZero: false,
			...(memoryItem.pointeeBaseType
				? {
						pointeeBaseType: memoryItem.pointeeBaseType,
						...(memoryItem.isPointingToPointer ? { isPointingToPointer: true } : {}),
						...(pointeeAddress ? { address: pointeeAddress } : {}),
					}
				: {}),
		})
	);

	return saveByteCode(context, [...i32const(memoryItem.byteAddress), ...loadOpcode[kind](memoryItem.memoryIndex)]);
}
