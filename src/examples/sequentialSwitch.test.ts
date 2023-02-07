import { createTestModule, TestModule } from '@8f4e/compiler';

import splitter from './sequentialSwitch.asm';

let testModule: TestModule;

const fixtures = [
	[1, 2, 3, 4, 0, 1],
	[1, 2, 3, 4, 1, 2],
	[1, 2, 3, 4, 2, 3],
	[1, 2, 3, 4, 3, 4],
	[1, 2, 3, 4, 0, 1],
	[1, 2, 3, 4, 1, 2],
	[1, 2, 3, 4, 2, 3],
	[1, 2, 3, 4, 3, 4],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(splitter);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the generated ast matches with the snapshot', () => {
		expect(testModule.ast).toMatchSnapshot();
	});

	test('if the wat code matches with the snapshot', () => {
		expect(testModule.wat).toMatchSnapshot();
	});

	test('if the generated memory map matches with the snapshot', () => {
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test.each(fixtures)(
		'given %p %p %p %p as inputs, %p pulse(s), the output should be %p',
		(input1, input2, input3, input4, numberOfPulses, output) => {
			const { memory, test } = testModule;

			const clock = memory.allocMemoryForPointer('in:clock');
			const in1address = memory.allocMemoryForPointer('in:1');
			const in2address = memory.allocMemoryForPointer('in:2');
			const in3address = memory.allocMemoryForPointer('in:3');
			const in4address = memory.allocMemoryForPointer('in:4');

			memory.set(in1address, input1);
			memory.set(in2address, input2);
			memory.set(in3address, input3);
			memory.set(in4address, input4);

			test();

			for (let i = 0; i < numberOfPulses; i++) {
				memory.set(clock, 0);
				test();
				memory.set(clock, 1);
				test();
				memory.set(clock, 0);
				test();
			}

			expect(memory.get('out')).toBe(output);
		}
	);
});
