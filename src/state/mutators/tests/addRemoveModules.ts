const sleep = async time => new Promise(resolve => setTimeout(resolve, time));

export default function addRemoveModules(state, events) {
	const onRunTest = async () => {
		for (let i = 0; i < 100; i++) {
			await sleep(100);
			events.dispatch('addModule', { x: i * 20, y: i * 10, type: 'scope' });
		}
	};

	events.on('runTest', onRunTest);
}
