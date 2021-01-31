import saw from '../../../src/compiler/modules/saw';
import { createTestModule, setInitialMemory, assertEqual } from '../../utils';

const runTest = async function () {
	const { functionBody, initialMemory, memoryFootprint } = saw(0, 0);
	const { memory, test } = await createTestModule(functionBody);

	setInitialMemory(memory, initialMemory);

	for (let i = 1; i < 10; i++) {
		test();
		assertEqual(memory[0], i);
	}
};

export default runTest;
