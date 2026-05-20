import { localGet } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../../utils/saveByteCode';
import { getMemoryRegionFields } from '../../../semantic/memoryRegions';

import type { CompilationContext, PushIdentifierLine } from '@8f4e/compiler-spec';

export default function pushLocal(line: PushIdentifierLine, context: CompilationContext): CompilationContext {
	const local = context.locals[line.arguments[0].value]!;
	const pointeeAddress = local.pointeeBaseType
		? getMemoryRegionFields(local.pointeeMemoryIndex ?? 0, local.pointeeMemoryRegionName)
		: undefined;

	context.stack.push({
		isInteger: local.isInteger,
		...(local.isFloat64 ? { isFloat64: true } : {}),
		...(local.pointeeBaseType ? { pointeeBaseType: local.pointeeBaseType } : {}),
		...(local.isPointingToPointer ? { isPointingToPointer: true } : {}),
		...(pointeeAddress
			? {
					address: pointeeAddress,
				}
			: {}),
		isNonZero: false,
	});
	return saveByteCode(context, localGet(local.index));
}
