import { BASE_TYPE_METADATA } from '@8f4e/compiler-spec';

import type { BaseMemoryType } from '@8f4e/compiler-spec';

export default function getMemoryFlags(baseType: BaseMemoryType, pointerDepth: number) {
	const isPointer = pointerDepth > 0;
	const isInteger = BASE_TYPE_METADATA[baseType].isInteger || isPointer;
	const isFloat64 = baseType === 'float64' && !isPointer;
	let pointeeBaseType: BaseMemoryType | undefined;
	if (isPointer) {
		pointeeBaseType = baseType;
	}

	return {
		pointerDepth,
		isInteger,
		...(isFloat64 ? { isFloat64 } : {}),
		...(pointeeBaseType !== undefined ? { pointeeBaseType } : {}),
		isUnsigned: false,
	};
}
