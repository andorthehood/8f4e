import { createTestModule } from '../../utils';
import saw from '../../../src/compiler/modules/saw';

let testModule;

beforeAll(async () => {
    testModule = await createTestModule(saw);
});

beforeEach(() => {
    testModule.reset();
});

test('saw module', () => {
    const {memory, test} = testModule;
    test();
    expect(memory[0]).toBe(1);
    test();
    expect(memory[0]).toBe(2);
    test();
    expect(memory[0]).toBe(3);
});
