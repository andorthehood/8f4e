/**
 * WebAssembly value type codes.
 */

export const WASM_TYPE_VOID = 0x40;

export const WASM_TYPE_I32 = 0x7f;

export const WASM_TYPE_F64 = 0x7c;

export const WASM_TYPE_F32 = 0x7d;

export type WasmTypeValue = typeof WASM_TYPE_VOID | typeof WASM_TYPE_I32 | typeof WASM_TYPE_F64 | typeof WASM_TYPE_F32;
