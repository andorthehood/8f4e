import { unsignedLEB128 } from '../../../src/compiler/utils/utils';

const runTest = function() {
    unsignedLEB128(-10);
}

export default runTest;