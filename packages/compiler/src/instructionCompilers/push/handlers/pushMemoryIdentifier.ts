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
	const pointeeMemoryRegionFields = getMemoryRegionFields(
		memoryItem.pointeeMemoryIndex,
		memoryItem.pointeeMemoryRegionName
	);
	context.stack.push(
		kindToStackItem(kind, {
			isNonZero: false,
			...(memoryItem.pointeeBaseType
				? {
						pointeeBaseType: memoryItem.pointeeBaseType,
						...(memoryItem.isPointingToPointer ? { isPointingToPointer: true } : {}),
						...(Object.keys(pointeeMemoryRegionFields).length > 0 ? { address: pointeeMemoryRegionFields } : {}),
					}
				: {}),
		})
	);

	return saveByteCode(context, [...i32const(memoryItem.byteAddress), ...loadOpcode[kind](memoryItem.memoryIndex)]);
}
