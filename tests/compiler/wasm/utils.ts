import { signedLEB128 } from '../../../src/compiler/wasm/utils';

const runTest = function() {
    signedLEB128(-10);
}

export default runTest;