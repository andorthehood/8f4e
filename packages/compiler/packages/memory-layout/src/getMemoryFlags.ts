export function getMemoryFlags(baseType: 'int' | 'int8' | 'int16' | 'float' | 'float64', pointerDepth: number) {
	const isPointer = pointerDepth > 0;
	const isPointingToPointer = pointerDepth === 2;
	const isInteger = baseType === 'int' || baseType === 'int8' || baseType === 'int16' || isPointer;
	const isFloat64 = baseType === 'float64' && !isPointer;
	const pointeeBaseType = isPointer ? baseType : undefined;

	return {
		isPointingToPointer,
		isInteger,
		...(isFloat64 ? { isFloat64 } : {}),
		...(pointeeBaseType !== undefined ? { pointeeBaseType } : {}),
		isUnsigned: false,
	};
}
