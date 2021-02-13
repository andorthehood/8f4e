export const enum NameSection {
	FUNCTION_NAME = 0x01,
	LOCAL_NAME = 0x02,
}

export const enum ImportDesc {
	MEMORY = 0x02,
}

export const enum ExportDesc {
	FUNC = 0x00,
}

export const enum Type {
	VOID = 0x40,
	I32 = 0x7f,
	F32 = 0x7d,
}

export const enum Instruction {
	NOP = 0x01,
	LOOP = 0x03,
	IF = 0x04,
	ELSE = 0x05,
	END = 0x0b,
	BR = 0x0c,
	BR_IF = 0x0d,
	CALL = 0x10,
	LOCAL_GET = 0x20,
	LOCAL_SET = 0x21,
	I32_LOAD = 0x28,
	F32_LOAD = 0x2a,
	I32_STORE = 0x36,
	I32_CONST = 0x41,
	F32_CONST = 0x43,
	I32_EQ = 0x46, // Integer Equality
	I32_LT_S = 0x48, // Integer Less Than, Signed
	I32_LE_S = 0x4c, // Integer Less Than or Equal To, Signed
	I32_GE_S = 0x4e, // Integer Greater Than or Equal To, Signed
	I32_GE_U = 0x4f, // Integer Greater Than or Equal To, Unsigned
	I32_ADD = 0x6a,
	I32_SUB = 0x6b,
	I32_MUL = 0x6c,
	I32_DIV_U = 0x6e,
	F32_STORE = 0x83,
	F32_ADD = 0x92,
	F32_SUB = 0x93,
	F32_MUL = 0x94,
	F32_DIV = 0x95,
}

export const enum Section {
	CUSTOM = 0x00,
	TYPE = 0x01,
	IMPORT = 0x02,
	FUNCTION = 0x03,
	MEMORY = 0x05,
	EXPORT = 0x07,
	CODE = 0x0a,
}
