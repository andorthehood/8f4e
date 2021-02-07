import { createTestModule } from '../../utils';
import random from '../../../src/compiler/modules/random';

let testModule;

beforeAll(async () => {
    testModule = await createTestModule(random);
});

beforeEach(() => {
    testModule.reset();
});

test('random module', () => {
    const {memory, test} = testModule;
    test();
    const previous = memory[2];
    test();
    expect(memory[2]).not.toBe(previous);
});
