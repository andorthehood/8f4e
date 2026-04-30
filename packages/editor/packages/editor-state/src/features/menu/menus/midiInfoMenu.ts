import type { MenuGenerator } from '@8f4e/editor-state-types';

export const midiInfoMenu: MenuGenerator = state => [
	{ title: 'Inputs:', disabled: true, isSectionTitle: true },
	...state.midi.inputs.map((input: MIDIInput) => ({
		title: `${input.name || input.id}${input.manufacturer ? ` ${input.manufacturer}` : ``}`,
		disabled: true,
	})),
	{ title: 'Outputs:', disabled: true, isSectionTitle: true },
	...state.midi.outputs.map((output: MIDIOutput) => ({
		title: `${output.name || output.id}${output.manufacturer ? ` ${output.manufacturer}` : ``}`,
		disabled: true,
	})),
];
