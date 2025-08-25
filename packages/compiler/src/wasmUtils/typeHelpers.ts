export type LocalDeclaration = number[];
export type FunctionBody = number[];
export type FunctionExport = number[];
export type FunctionType = number[];
export type FunctionName = number[];
export type LocalName = number[];
export type Import = number[];

export const ieee754 = (n: number): Uint8Array => {
	const buf = new ArrayBuffer(4);
	const view = new DataView(buf);
	view.setFloat32(0, n, true); // true for little-endian
	return new Uint8Array(buf);
};

/**
 * LEB128 or Little Endian Base 128 is a variable-lenght code compression format like VLQ.
 * WebAssembly is using it's unsigned version for encoding all integer literals.
 */
export function unsignedLEB128(n: number): number[] {
	const buffer: number[] = [];
	do {
		let byte = n & 0b1111111;
		n >>>= 7;
		if (n !== 0) {
			byte |= 0b10000000;
		}
		buffer.push(byte);
	} while (n !== 0);
	return buffer;
}

export function signedLEB128(n: number): number[] {
	const buffer: number[] = [];
	let more = true;
	const isNegative = n < 0;
	const bitCount = Math.ceil(Math.log2(Math.abs(n))) + 1;
	while (more) {
		let byte = n & 0b1111111;
		n >>= 7;
		if (isNegative) {
			n = n | -(0b1 << (bitCount - 8));
		}
		if ((n === 0 && (byte & 0b1000000) === 0) || (n === -1 && (byte & 0b1000000) == 0b1000000)) {
			more = false;
		} else {
			byte |= 0b10000000;
		}
		buffer.push(byte);
	}
	return buffer;
}

export function encodeString(str: string): number[] {
	return [...unsignedLEB128(str.length), ...str.split('').map(char => char.charCodeAt(0))];
}

export function createVector(data: number[]): number[] {
	return [...unsignedLEB128(data.length), ...data];
}
