const Type = {
	VOID: 0x40,
	I32: 0x7f,
	F64: 0x7c,
	F32: 0x7d,
} as const;

export type WasmType = (typeof Type)[keyof typeof Type];

export default Type;
