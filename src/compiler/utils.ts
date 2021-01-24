export const flatten = function (arr: any[]) {
	return [].concat.apply([], arr);
};

export const unsignedLEB128 = function (n: number) {
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

export const encodeVector = function (code: any[]) {
	return [unsignedLEB128(code.length), ...flatten(code)];
};

export const createSection = function (sectionType, code: any[]) {
	return [sectionType, ...encodeVector(code)];
};

export const encodeString = function (str: string) {
	return [str.length, ...str.split('').map(char => char.charCodeAt(0))];
};
