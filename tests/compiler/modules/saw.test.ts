import { createSingleFunctionWASMProgramWithStandardLibrary, createTestModule } from '../../utils';
import saw from '../../../src/compiler/modules/saw';

test('saw module', async () => {
    const {memory, test} = await createTestModule(saw);
    test();
    expect(memory[0]).toBe(1);
    test();
    expect(memory[0]).toBe(2);
    test();
    expect(memory[0]).toBe(3);
});
