import { createModuleForTestingHelpers } from './utils';
import { i32modulo } from '../../../../src/compiler/wasm/helpers';
import { createFunctionType } from '../../../../src/compiler/wasm/sections';
import { Type } from '../../../../src/compiler/wasm/enums';

let testModule;

beforeAll(async () => {
    testModule = await createModuleForTestingHelpers(i32modulo(), createFunctionType([Type.I32, Type.I32], [Type.I32]));
});

test('i32modulo', () => {
    const {test} = testModule;

    expect(test(10, 1)).toBe(10 % 1);
    expect(test(1, 10)).toBe(1 % 10);
    expect(test(69, 2)).toBe(69 % 2);
    expect(test(420, 2)).toBe(420 % 2);
    expect(test(420, 69)).toBe(420 % 69);
});
