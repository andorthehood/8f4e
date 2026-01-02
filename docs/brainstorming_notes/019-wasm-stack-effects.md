# Brainstorm: central WASM stack effects

## Context
Stack state is manually updated in instruction compilers (e.g. `or` pushes `{ isInteger: true, isNonZero: operand1.isNonZero || operand2.isNonZero }`). The stack effect could be inferred from the emitted WASM opcode (e.g. `I32_OR` consumes two i32 and produces one i32).

## Goal
Add a central description for each WASM opcode describing what it consumes and produces on the stack, then use it to update `context.stack` instead of manual `push`/`pop` in each instruction compiler.

## Possible shape
```
type StackType = 'i32' | 'f32';

type StackEffect = {
  inputs: StackType[];
  outputs: StackType[];
  derive?: (inputs: StackItem[]) => StackItem[]; // optional flags logic
};

const wasmStackEffects: Record<WASMInstruction, StackEffect> = { ... };
```

Add a small helper, e.g. `emitWasm(context, opcode, immediates?, override?)`, that applies stack effects and calls `saveByteCode`. Keep `saveByteCode` for raw byte sequences (multi-opcode macros or the `wasm` instruction).

## Opcodes currently emitted in the compiler
Sources: `packages/compiler/src/wasmUtils/wasmInstruction.ts`, usage in `packages/compiler/src/instructionCompilers/*`.

### Arithmetic
- `I32_ADD`, `I32_SUB`, `I32_MUL`, `I32_DIV_S`, `I32_REM_S`: `i32,i32 -> i32`
- `F32_ADD`, `F32_SUB`, `F32_MUL`, `F32_DIV`: `f32,f32 -> f32`

### Bitwise
- `I32_AND`, `I32_OR`, `I32_XOR`, `I32_SHL`, `I32_SHR_S`, `I32_SHR_U`: `i32,i32 -> i32`

### Comparison
- `I32_EQ`, `I32_LT_S`, `I32_GT_S`, `I32_LE_S`, `I32_GE_S`: `i32,i32 -> i32`
- `F32_EQ`, `F32_LT`, `F32_GT`, `F32_LE`, `F32_GE`: `f32,f32 -> i32`
- `I32_EQZ`: `i32 -> i32`

### Conversion
- `I32_TUNC_F32_S`: `f32 -> i32`
- `F32_CONVERT_I32_S`: `i32 -> f32`

### Float unary
- `F32_ABS`, `F32_NEAREST`, `F32_SQRT`: `f32 -> f32`

### Stack
- `DROP`: `any -> (none)`

### Locals
- `LOCAL_GET`: `(none) -> local type`
- `LOCAL_SET`: `local type -> (none)`

### Const
- `I32_CONST`: `(none) -> i32`
- `F32_CONST`: `(none) -> f32`

### Memory
- `I32_LOAD`, `I32_LOAD_8_S`, `I32_LOAD_8_U`, `I32_LOAD_16_S`, `I32_LOAD_16_U`: `i32(address) -> i32`
- `F32_LOAD`: `i32(address) -> f32`
- `I32_STORE`: `i32(address),i32(value) -> (none)`
- `F32_STORE`: `i32(address),f32(value) -> (none)`

### Control flow
- `BLOCK`, `LOOP`, `IF`, `ELSE`, `END`, `BR`, `BR_IF`, `RETURN` are not purely stack-effect based due to block signatures and `blockStack` logic.
- `IF` pops `i32` condition; result handling still belongs in block stack logic.
- `CALL` stack effect depends on function signature.

## Notes on flags
- `isNonZero` and `isSafeMemoryAddress` are not fully opcode-derivable.
- For a few ops, `derive` can preserve or compute flags (e.g. `I32_OR` can set `isNonZero: op1.isNonZero || op2.isNonZero`).
- For most ops, default `isNonZero: false` (unknown) is safer.
- Memory safety checks (`isSafeMemoryAddress`) should probably stay in instruction-level logic (e.g. `load` bounds checks).

## Open questions
- Scope of opcodes in the map: only those currently emitted or broader WASM coverage.
- How to preserve current `isNonZero` behavior in `div` and `remainder`.
