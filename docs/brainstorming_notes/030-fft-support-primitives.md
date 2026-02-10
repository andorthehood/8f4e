# FFT support primitives and stdlib candidates

## Context
We want 8f4e to support Fourier-transform workflows with less boilerplate, better performance, and clearer user-level APIs.

Recent changes already landed:
- Env constants block generator now emits `INV_SAMPLE_RATE` alongside `SAMPLE_RATE`.
- `math` constants module now includes FFT/windowing helpers:
  - `SQRT1_2`
  - `HANN_A0`
  - `HAMMING_A0`, `HAMMING_A1`
  - `BLACKMAN_A0`, `BLACKMAN_A1`, `BLACKMAN_A2`

## Remaining constants to consider
- `TWOPI_OVER_SR` (or runtime-derived equivalent) to avoid repeated `TAU / SAMPLE_RATE` patterns.
- Keep canonical reciprocal/angle constants centralized in `math` to reduce per-module duplication.

## Instruction-level functionality that would help FFT
- Native `sin` and `cos` instructions.
- Native `sincos` instruction that returns both values in one call.
- `atan2` and `hypot` for phase/magnitude analysis.
- `bitReverse` for iterative radix-2 FFT passes.
- `isPowerOfTwo` and `nextPowerOfTwo` for sizing and validation.
- Optional packed complex helpers (`loadComplex` / `storeComplex`) to reduce memory-address boilerplate.

## Standard library function candidates
- Complex arithmetic helpers:
  - `complexMul(ar, ai, br, bi) -> rr, ri`
  - `complexAdd`, `complexSub`, `complexConj`
- Twiddle helper:
  - `fftTwiddle(k, n, length) -> cosTheta, sinTheta`
- Building blocks:
  - `fftRadix2Butterfly(...)`
  - `rfftPack(...)`, `rfftUnpack(...)`
- Analysis helpers:
  - `magnitude(real, imag)`
  - `phase(real, imag)`
- Window helpers:
  - `windowHann(n, length)`
  - `windowHamming(n, length)`
  - `windowBlackman(n, length)`

## Language/runtime ergonomics that would help
- Continue supporting multi-return pure functions for complex ops (`functionEnd float float`).
- Consider cheap function-local temporary array/slice support for butterfly staging.
- Consider optional fixed-point trig paths for deterministic low-cost targets.

## Implementation order (suggested)
1. Add native `sin`/`cos`/`sincos`.
2. Add complex stdlib helpers (`complexMul` + add/sub first).
3. Add radix-2 butterfly + bit-reversal support.
4. Add RFFT packing/unpacking helpers.
5. Add phase/magnitude helpers (`atan2`, `hypot`-based path).
