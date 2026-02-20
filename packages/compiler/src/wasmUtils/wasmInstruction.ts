/**
 * WebAssembly instuction set
 */
enum WASMInstruction {
	/** Unreachable */
	UNREACHABLE = 0x00,
	/** No-Op. It does nothing. */
	NOP = 0x01,
	/** Pushes an entry onto the control-flow stack. */
	BLOCK = 0x02,
	/** Binds a label to the current position, and pushes an entry onto the control-flow stack. */
	LOOP = 0x03,
	/** If */
	IF = 0x04,
	/** Else */
	ELSE = 0x05,
	/** Pops an entry from the control-flow stack. */
	END = 0x0b,
	/** Unconditional branch */
	BR = 0x0c,
	/** Conditional branch */
	BR_IF = 0x0d,
	/** Table branch */
	BR_TABLE = 0x0e,
	/** Return */
	RETURN = 0x0f,
	CALL = 0x10,
	/** Drop */
	DROP = 0x1a,
	/** Get Local */
	LOCAL_GET = 0x20,
	/** Set Local */
	LOCAL_SET = 0x21,
	I32_LOAD = 0x28,
	F32_LOAD = 0x2a,
	F64_LOAD = 0x2b,
	I32_LOAD_8_S = 0x2c,
	I32_LOAD_8_U = 0x2d,
	I32_LOAD_16_S = 0x2e,
	I32_LOAD_16_U = 0x2f,
	I32_STORE = 0x36,
	F32_STORE = 0x38,
	F64_STORE = 0x39,
	/** varsint32 constant */
	I32_CONST = 0x41,
	/** varsint64 constant */
	I64_CONTS = 0x42,
	/** float32 constant */
	F32_CONST = 0x43,
	/** float64 constant */
	F64_CONST = 0x44,

	/**
	 * Equal with zero.
	 * The eqz instruction returns true if the operand is equal to zero, or
	 * false otherwise.
	 * Type signature: (param i32) (result i32)
	 */
	I32_EQZ = 0x45,

	/**
	 * Equality.
	 * Tests whether the operands are equal.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_EQ = 0x46,

	/**
	 * Inequality.
	 * Tests whether the operands are not equal.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_NE = 0x47,

	/**
	 * Less than (signed).
	 * Tests whether the first operand is less than the second operand.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_LT_S = 0x48,

	/**
	 * Less than (unsigned).
	 * Tests whether the first operand is less than the second operand.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_LT_U = 0x49,

	I32_GT_S = 0x4a,

	I32_GT_U = 0x4b,

	/**
	 * Less than or equal to (signed).
	 * Tests whether the first operand is less than or equal to the second operand.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_LE_S = 0x4c,

	/**
	 * Less than or equal to (unsigned).
	 * Tests whether the first operand is less than or equal to the second operand.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_LE_U = 0x4d,

	/** Greater than or equal to (signed)
	 *
	 *
	 */
	I32_GE_S = 0x4e,

	/** Integer Greater Than or Equal To, Unsigned */
	I32_GE_U = 0x4f,

	/**
	 * Floating-Point Equality
	 * Type signature: (param f32, f32) (result i32)
	 */
	F32_EQ = 0x5b,

	/**
	 * Floating-Point Less Than
	 * Type signature: (param f32, f32) (result i32)
	 */
	F32_LT = 0x5d,

	/**
	 * Floating-Point Greater Than
	 * Type signature: (param f32, f32) (result i32)
	 */
	F32_GT = 0x5e,

	/**
	 * Floating-Point Less Than Or Equal To
	 * Type signature (param f32, f32) (result i32)
	 */
	F32_LE = 0x5f,

	/**
	 * Floating-Point Greater Than Or Equal To
	 * Type signature: (param f32, f32) (result i32)
	 */
	F32_GE = 0x60,

	/**
	 * Aadd.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_ADD = 0x6a,

	/**
	 * Substract.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_SUB = 0x6b,

	/**
	 * Multiply.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_MUL = 0x6c,

	/**
	 * Divide (signed).
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_DIV_S = 0x6d,

	/**
	 * Divide (unsigned).
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_DIV_U = 0x6e,

	/**
	 * Remainder.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_REM_S = 0x6f,

	/**
	 * Bitwise and.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_AND = 0x71,

	/**
	 * Bitwise or.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_OR = 0x72,

	/**
	 * Exclusive or.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_XOR = 0x73,

	/**
	 * Shift left.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_SHL = 0x74,

	/**
	 * Shift right (signed).
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_SHR_S = 0x75,

	/**
	 * Shift right (unsigned).
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_SHR_U = 0x76,

	/**
	 * Rotate left.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_ROTL = 0x77,

	/**
	 * Rotate right.
	 * Type signature: (param i32 i32) (result i32)
	 */
	I32_ROTR = 0x78,

	/**
	 * Count leading zeros.
	 * It returns the number of leading zeros in its operand.
	 * Type signature: (param i32) (result i32)
	 */
	I32_CLZ = 0x67,

	/**
	 * Count trailing zeros.
	 * It returns the number of trailing zeros in its operand.
	 * Type signature: (param i32) (result i32)
	 */
	I32_CTZ = 0x68,

	/**
	 * Population count.
	 * It returns the number of 1-bits in its operand.
	 * Type signature: (param i32) (result i32)
	 */
	I32_POPCNT = 0x69,

	F32_ABS = 0x8b,

	F32_ADD = 0x92,

	F32_SUB = 0x93,

	F32_MUL = 0x94,

	F32_DIV = 0x95,

	F64_ADD = 0xa0,

	F64_SUB = 0xa1,

	F64_MUL = 0xa2,

	F64_DIV = 0xa3,

	F32_NEAREST = 0x90,

	F32_SQRT = 0x91,

	/**
	 * Truncate Floating-Point to Integer, Signed
	 * Type signature: (param f32) (result i32)
	 */
	I32_TUNC_F32_S = 0xa8,

	/**
	 * Convert Integer To Floating-Point, Signed
	 *  Type signature: (param f32) (result f32)
	 */
	F32_CONVERT_I32_S = 0xb2,

	/**
	 * Convert Integer To Floating-Point, Signed
	 * Type signature: (param i32) (result f64)
	 */
	F64_CONVERT_I32_S = 0xb7,

	/**
	 * Promote 32-bit float to 64-bit float
	 * Type signature: (param f32) (result f64)
	 */
	F64_PROMOTE_F32 = 0xbb,
}

export default WASMInstruction;
