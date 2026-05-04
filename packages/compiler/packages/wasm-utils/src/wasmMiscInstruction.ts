/**
 * WebAssembly miscellaneous instruction sub-opcodes.
 *
 * These are encoded after the 0xfc misc prefix opcode.
 */
enum WASMMiscInstruction {
	/**
	 * Non-trapping truncate f32 to signed i32.
	 * Full instruction encoding: 0xfc 0x00
	 * Type signature: (param f32) (result i32)
	 */
	I32_TRUNC_SAT_F32_S = 0x00,

	/**
	 * Non-trapping truncate f64 to signed i32.
	 * Full instruction encoding: 0xfc 0x02
	 * Type signature: (param f64) (result i32)
	 */
	I32_TRUNC_SAT_F64_S = 0x02,

	/**
	 * Bulk-memory copy from a passive data segment into linear memory.
	 * Full instruction encoding: 0xfc 0x08 <dataidx> <memidx>
	 * Stack: destination memory offset, source data offset, byte count.
	 */
	MEMORY_INIT = 0x08,

	/**
	 * Bulk-memory fill of linear memory with a byte value.
	 * Full instruction encoding: 0xfc 0x0b <memidx>
	 * Stack: destination memory offset, fill byte value, byte count.
	 */
	MEMORY_FILL = 0x0b,
}

export default WASMMiscInstruction;
