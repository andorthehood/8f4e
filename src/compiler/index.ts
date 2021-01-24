const moduleHeader = [0x00, 0x61, 0x73, 0x6d];
const moduleVersion = [0x01, 0x00, 0x00, 0x00];

const enum Types {
	I32 = 0x7f,
	F32 = 0x7d,
}

const enum Instructions {
	END = 0x0b,
	GET_LOCAL = 0x20,
	F32_AA = 0x92,
}

const compile = function (state) {
	return Uint8Array.from([...moduleHeader, ...moduleVersion]);
};

export default compile;
