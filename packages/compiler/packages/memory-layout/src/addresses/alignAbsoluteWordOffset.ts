export function alignAbsoluteWordOffset(absoluteWordOffset: number, elementWordSize: number): number {
	if (elementWordSize !== 8 || absoluteWordOffset % 2 === 0) {
		return absoluteWordOffset;
	}
	return absoluteWordOffset + 1;
}
