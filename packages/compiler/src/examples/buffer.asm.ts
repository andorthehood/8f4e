export interface Config {
	numberOfPorts?: number;
	numberOfDataPlaceholders?: number;
}

export default ({ numberOfPorts = 1, numberOfDataPlaceholders = 1 }) => {
	const ports = new Array(numberOfPorts).fill(0).map((item, index) => index + 1);
	const dataPlaceholders = new Array(numberOfDataPlaceholders).fill(0).map((item, index) => index + 1);

	return `module buffer

memory defaultValue 0
memory numberOfInputs ${numberOfPorts}
memory numberOfOutputs ${numberOfPorts}
memory numberOfDataPlaceholders ${numberOfDataPlaceholders}

${ports.map(index => `memory in:${index} &defaultValue`).join('\n')}
${ports.map(index => `memory out:${index} 0`).join('\n')}

${dataPlaceholders.map(index => `memory data:${index} 0`).join('\n')}

${ports
	.map(
		index => `push &out:${index}
push *in:${index}
store
`
	)
	.join('\n')}`;
};
