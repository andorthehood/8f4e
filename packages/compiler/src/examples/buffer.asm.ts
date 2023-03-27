export interface Config {
	numberOfPorts?: number;
	numberOfDataPlaceholders?: number;
}

export default ({ numberOfPorts = 1, numberOfDataPlaceholders = 1 }) => {
	const ports = new Array(numberOfPorts).fill(0).map((item, index) => index + 1);
	const dataPlaceholders = new Array(numberOfDataPlaceholders).fill(0).map((item, index) => index + 1);

	return `module buffer

int defaultValue 0
int numberOfInputs ${numberOfPorts}
int numberOfOutputs ${numberOfPorts}
int numberOfDataPlaceholders ${numberOfDataPlaceholders}

${ports.map(index => `int* in:${index} &defaultValue`).join('\n')}
${ports.map(index => `int out:${index} 0`).join('\n')}

${dataPlaceholders.map(index => `int data:${index} 0`).join('\n')}

${ports
	.map(
		index => `push &out:${index}
push *in:${index}
store
`
	)
	.join('\n')}`;
};
