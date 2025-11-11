const listOfWebApisToCheck = [
	{
		name: 'OffscreenCanvas',
		checker: () => typeof OffscreenCanvas !== 'undefined',
	},
	{
		name: 'AudioWorklet',
		checker: () => typeof AudioWorklet !== 'undefined',
	},
	{
		name: 'WebMIDIApi',
		checker: () => typeof navigator.requestMIDIAccess === 'function',
	},
	{
		name: 'WebAssembly',
		checker: () => typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function',
	},
];

export default function () {
	return listOfWebApisToCheck.map(api => {
		return {
			name: api.name,
			available: api.checker(),
		};
	});
}
