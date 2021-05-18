import { createTestModule } from '../utils';
import arpeggiator, { Memory } from '../../src/modules/arpeggiator';

let testModule;

beforeAll(async () => {
	testModule = await createTestModule(arpeggiator, {});
});

beforeEach(() => {
	testModule.reset();
});

test('arpeggiator module', () => {
	const { memory, test } = testModule;
	test();
});
