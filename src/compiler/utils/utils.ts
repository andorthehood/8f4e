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
		let byte = n & 0x7f;
		n >>>= 7;
		if (n !== 0) {
			byte |= 0x80;
		}
		buffer.push(byte);
	} while (n !== 0);
	return buffer;
};

export const signedLEB128 = (n: number): number[] => {
	const buffer = [];
	let more = true;
	while (more) {
		let byte = n & 0x7f;
		n >>>= 7;
		if ((n === 0 && (byte & 0x40) === 0) || (n === -1 && (byte & 0x40) !== 0)) {
			more = false;
		} else {
			byte |= 0x80;
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
