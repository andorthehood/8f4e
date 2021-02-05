export const flatten = function (arr: any[]) {
	return [].concat.apply([], arr);
};

export const ieee754 = (n: number): Uint8Array => {
	const buf = Buffer.allocUnsafe(4);
	buf.writeFloatLE(n, 0);
	return Uint8Array.from(buf);
};

/**
 * LEB128 or Little Endian Base 128 is a variable-lenght code compression format like VLQ.
 * WebAssembly is using it's unsigned version for encoding all integer literals.
 */
export const unsignedLEB128 = function (n: number): number[] {
	const buffer = [];
	do {
		let byte = n & 0b1111111;
		n >>>= 7;
		if (n !== 0) {
			byte |= 0b10000000;
		}
		buffer.push(byte);
	} while (n !== 0);
	return buffer;
};

export const signedLEB128 = (n: number) => {
	const buffer = [];
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
};

export const encodeString = function (str: string) {
	return [...unsignedLEB128(str.length), ...str.split('').map(char => char.charCodeAt(0))];
};

export const createVector = function (data: number[]) {
	return [...unsignedLEB128(data.length), ...data];
};
