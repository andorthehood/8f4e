import { signedLEB128 } from '../../../src/compiler/wasm/types';

const runTest = function() {
    signedLEB128(-10);
}

export default runTest;