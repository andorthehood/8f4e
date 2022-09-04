import { createTestModule } from '../../testUtils';
import buffer from '../../modules/buffer.asm';

let testModule;

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(buffer({ numberOfDataPlaceholders: 4, numberOfPorts: 6 }));
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the wat code matches with the snapshot', () => {
		expect(testModule.wat).toMatchSnapshot();
	});

	test('if the generated memory map matches with the snapshot', () => {
		expect(testModule.memoryMap).toMatchSnapshot();
	});
});
