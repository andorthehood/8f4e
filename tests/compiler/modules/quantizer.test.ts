import { createTestModule } from '../../utils';
import { quantizer } from '../../../src/compiler/modules';

let testModule;

beforeAll(async () => {
    testModule = await createTestModule(quantizer);
});

beforeEach(() => {
    testModule.reset();
});

test('quantizer module', () => {
    const {memory, test} = testModule;

    memory[0] = 201;
    test();
    expect(memory[2]).toBe(200);

    memory[0] = 301;
    test();
    expect(memory[2]).toBe(300);

    memory[0] = 101;
    test();
    expect(memory[2]).toBe(100);

    memory[0] = 10;
    test();
    expect(memory[2]).toBe(0);

    memory[0] = 230;
    test();
    expect(memory[2]).toBe(200);
});
