import { createTestModule } from '../../utils';
import clock from '../../../src/compiler/modules/clockGenerator';

let testModule;

beforeAll(async () => {
    testModule = await createTestModule(clock);
});

beforeEach(() => {
    testModule.reset();
});

test('clock module', () => {
    const {memory, test} = testModule;
    test();
    expect(memory[0]).toBe(1);
    expect(memory[1]).toBe(1);

    test();
    expect(memory[0]).toBe(2);
    expect(memory[1]).toBe(1);

    test();
    expect(memory[0]).toBe(3);
    expect(memory[1]).toBe(1);

    test();
    expect(memory[0]).toBe(4);
    expect(memory[1]).toBe(1);

    test();
    expect(memory[0]).toBe(5);
    expect(memory[1]).toBe(1);

    test();
    expect(memory[0]).toBe(6);
    expect(memory[1]).toBe(1);

    test();
    expect(memory[0]).toBe(7);
    expect(memory[1]).toBe(0);

    test();
    expect(memory[0]).toBe(8);
    expect(memory[1]).toBe(0);
});
