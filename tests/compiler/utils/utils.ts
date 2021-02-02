import { signedLEB128 } from '../../../src/compiler/utils/utils';

const runTest = function() {
    signedLEB128(-10);
}

export default runTest;