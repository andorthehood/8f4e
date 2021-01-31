import saw from '../modules/saw';
import { createTestModule, setInitialMemory } from './utils';

const runTest = async function () {
	const { functionBody, initialMemory, memoryFootprint } = saw(0, 0);
	const { memory, test } = await createTestModule(functionBody);

	setInitialMemory(memory, initialMemory);

	for (let i = 0; i < 30; i++) {
		test();
		console.log(memory.slice(0, memoryFootprint));
	}
};

export default runTest;
