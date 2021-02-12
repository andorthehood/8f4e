import { createModuleForTestingHelpers } from './utils';
import { i32abs } from '../../../../src/compiler/wasm/helpers';
import { createFunctionType } from '../../../../src/compiler/wasm/sections';
import { Type } from '../../../../src/compiler/wasm/enums';

let testModule;

beforeAll(async () => {
    testModule = await createModuleForTestingHelpers(i32abs(), createFunctionType([Type.I32], [Type.I32]));
});

test('i32abs', () => {
    const {test} = testModule;

    expect(test(-1)).toBe(1);
    expect(test(1)).toBe(1);
    expect(test(-100)).toBe(100);
    expect(test(0)).toBe(0);
});
